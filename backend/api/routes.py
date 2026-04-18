"""FastAPI routes for the LinkedIn Content Writer Agent API."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

from models.schemas import (
    AgentState,
    FeedbackRequest,
    GenerateRequest,
    GenerateResponse,
    StatusResponse,
    TrendingTopicsResponse,
)
from tools.post_formatter import extract_hashtags, format_post
from tools.web_search import web_search
from workflows.graph import get_graph

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory run store (replace with Redis/DB for production)
_runs: dict[str, dict[str, Any]] = {}


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _run_graph(run_id: str, state: AgentState) -> None:
    """Execute the LangGraph pipeline and store result in _runs."""
    graph = get_graph()
    _runs[run_id] = {"status": "running", "state": state.model_dump()}

    try:
        # Stream graph execution
        final_state: dict = state.model_dump()
        async for event in graph.astream(state.model_dump()):
            for node_name, node_output in event.items():
                if isinstance(node_output, dict):
                    final_state.update(node_output)
                    _runs[run_id]["state"] = final_state
                    _runs[run_id]["current_step"] = node_output.get("current_step", node_name)
                    logger.info("[Runner] Completed node: %s", node_name)

        _runs[run_id]["status"] = "completed"
    except Exception as exc:
        logger.exception("[Runner] Pipeline failed for run %s", run_id)
        _runs[run_id]["status"] = "failed"
        _runs[run_id]["error"] = str(exc)


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=GenerateResponse)
async def generate_post(request: GenerateRequest) -> GenerateResponse:
    """
    Generate a LinkedIn post.

    - If `mode="topic"`, uses the provided `topic`.
    - If `mode="trending"`, auto-discovers trending topics first.
    """
    run_id = str(uuid4())
    initial_state = AgentState(
        run_id=run_id,
        user_topic=request.topic,
        mode=request.mode,
    )

    # Run pipeline synchronously (await background task inline for simplicity)
    await _run_graph(run_id, initial_state)

    run = _runs.get(run_id, {})
    if run.get("status") == "failed":
        raise HTTPException(status_code=500, detail=run.get("error", "Pipeline failed"))

    final_state = run.get("state", {})
    final_post = final_state.get("final_post", "")
    if not final_post:
        raise HTTPException(status_code=500, detail="No post was generated")

    formatted = format_post(final_post)
    topic_plan_data = final_state.get("topic_plan")

    from models.schemas import TopicOutline
    topic_plan = None
    if isinstance(topic_plan_data, dict):
        topic_plan = TopicOutline(**topic_plan_data)
    elif isinstance(topic_plan_data, TopicOutline):
        topic_plan = topic_plan_data

    return GenerateResponse(
        run_id=run_id,
        final_post=formatted["post"],
        char_count=formatted["char_count"],
        hashtags=formatted["hashtags"],
        topic_plan=topic_plan,
        steps_completed=final_state.get("steps_completed", []),
    )


@router.get("/status/{run_id}", response_model=StatusResponse)
async def get_status(run_id: str) -> StatusResponse:
    """Get the current status of a generation run."""
    run = _runs.get(run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run {run_id!r} not found")

    state = run.get("state", {})
    result = None

    if run.get("status") == "completed":
        final_post = state.get("final_post", "")
        formatted = format_post(final_post) if final_post else {"post": "", "char_count": 0, "hashtags": []}
        from models.schemas import TopicOutline
        topic_plan_data = state.get("topic_plan")
        topic_plan = None
        if isinstance(topic_plan_data, dict):
            topic_plan = TopicOutline(**topic_plan_data)
        elif isinstance(topic_plan_data, TopicOutline):
            topic_plan = topic_plan_data

        result = GenerateResponse(
            run_id=run_id,
            final_post=formatted["post"],
            char_count=formatted["char_count"],
            hashtags=formatted["hashtags"],
            topic_plan=topic_plan,
            steps_completed=state.get("steps_completed", []),
        )

    return StatusResponse(
        run_id=run_id,
        status=run.get("status", "running"),
        current_step=state.get("current_step", "idle"),
        steps_completed=state.get("steps_completed", []),
        result=result,
        error=run.get("error"),
    )


@router.get("/trending", response_model=TrendingTopicsResponse)
async def get_trending_topics() -> TrendingTopicsResponse:
    """Fetch and return a list of trending professional topics."""
    from agents.llm_factory import get_llm
    from langchain_core.messages import HumanMessage, SystemMessage
    from pathlib import Path
    from models.schemas import TrendingTopic
    import json

    results = web_search("trending LinkedIn professional topics technology AI 2025", max_results=10)
    context = "\n".join(
        f"- {r.get('title', '')} — {r.get('content', '')[:200]}"
        for r in results[:10]
    )

    system_prompt = (Path(__file__).parent.parent / "prompts" / "trend_researcher.md").read_text()
    llm = get_llm(temperature=0.3)
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(
            content=(
                f"Based on these recent search results, identify trending professional topics:\n\n"
                f"{context}\n\nReturn ONLY valid JSON as specified."
            )
        ),
    ]

    response = await llm.ainvoke(messages)
    raw = response.content.strip()

    topics: list[TrendingTopic] = []
    try:
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        topics = [TrendingTopic(**item) for item in data]
    except Exception:
        topics = [TrendingTopic(
            title="AI in the Workplace",
            reason="Widespread discussion about AI transforming professional roles",
            audience="professionals",
        )]

    return TrendingTopicsResponse(topics=topics)


@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest) -> JSONResponse:
    """Accept user feedback on a generated post (approve / reject / edit)."""
    run = _runs.get(request.run_id)
    if not run:
        raise HTTPException(status_code=404, detail=f"Run {request.run_id!r} not found")

    if request.action == "approve":
        _runs[request.run_id]["feedback"] = "approved"

    elif request.action == "reject":
        _runs[request.run_id]["feedback"] = "rejected"

    elif request.action == "edit":
        if not request.edited_post:
            raise HTTPException(status_code=400, detail="edited_post is required for 'edit' action")
        _runs[request.run_id]["state"]["final_post"] = request.edited_post
        _runs[request.run_id]["feedback"] = "edited"

    return JSONResponse({"run_id": request.run_id, "action": request.action, "status": "recorded"})


# ---------------------------------------------------------------------------
# WebSocket — real-time agent step streaming
# ---------------------------------------------------------------------------

@router.websocket("/ws/generate")
async def websocket_generate(websocket: WebSocket) -> None:
    """
    WebSocket endpoint for streaming agent progress in real time.

    Client sends JSON: { "topic": "...", "mode": "topic" | "trending" }
    Server streams JSON events per agent step, then sends the final post.
    """
    await websocket.accept()

    try:
        data = await websocket.receive_json()
        run_id = str(uuid4())

        request = GenerateRequest(**data)
        initial_state = AgentState(
            run_id=run_id,
            user_topic=request.topic,
            mode=request.mode,
        )
        _runs[run_id] = {"status": "running", "state": initial_state.model_dump()}

        graph = get_graph()

        # Send run_id immediately
        await websocket.send_json({"type": "run_started", "run_id": run_id})

        # Stream graph execution
        final_state: dict = initial_state.model_dump()
        async for event in graph.astream(initial_state.model_dump()):
            for node_name, node_output in event.items():
                if isinstance(node_output, dict):
                    final_state.update(node_output)
                    _runs[run_id]["state"] = final_state
                    # Send step update to client
                    await websocket.send_json({
                        "type": "step_update",
                        "run_id": run_id,
                        "step": node_output.get("current_step", node_name),
                        "steps_completed": node_output.get("steps_completed", []),
                    })

        _runs[run_id]["status"] = "completed"

        # Send final result
        final_post = final_state.get("final_post", "")
        formatted = format_post(final_post) if final_post else {"post": "", "char_count": 0, "hashtags": []}

        await websocket.send_json({
            "type": "completed",
            "run_id": run_id,
            "final_post": formatted["post"],
            "char_count": formatted["char_count"],
            "hashtags": formatted["hashtags"],
            "steps_completed": final_state.get("steps_completed", []),
        })

    except WebSocketDisconnect:
        logger.info("[WebSocket] Client disconnected")
    except Exception as exc:
        logger.exception("[WebSocket] Error during generation")
        try:
            await websocket.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
