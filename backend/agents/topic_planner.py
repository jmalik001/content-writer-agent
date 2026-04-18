"""Topic Planner Agent — selects or refines a topic and creates a content plan."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage

from agents.llm_factory import get_llm
from models.schemas import AgentState, TopicOutline

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (Path(__file__).parent.parent / "prompts" / "topic_planner.md").read_text()


async def plan_topic(state: AgentState) -> dict:
    """LangGraph node: Evaluate available topics and create a structured content plan."""
    logger.info("[TopicPlanner] Planning topic")

    llm = get_llm(temperature=0.5)

    # Build context from available inputs
    if state.user_topic:
        context = f"User-provided topic: {state.user_topic}"
    elif state.trending_topics:
        topics_text = "\n".join(
            f"- {t.title}: {t.reason} (audience: {t.audience})"
            for t in state.trending_topics
        )
        context = f"Trending topics discovered:\n{topics_text}"
    else:
        context = "No specific topic provided. Choose an evergreen professional topic."

    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"{context}\n\n"
                "Create a content plan for the best LinkedIn post topic. "
                "Return ONLY valid JSON as specified."
            )
        ),
    ]

    response = await llm.ainvoke(messages)
    raw = response.content.strip()

    topic_plan: TopicOutline | None = None
    try:
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        topic_plan = TopicOutline(**data)
    except (json.JSONDecodeError, Exception) as exc:
        logger.warning("[TopicPlanner] Failed to parse JSON: %s", exc)
        # Fallback plan
        topic_plan = TopicOutline(
            topic=state.user_topic or "Professional Growth",
            angle="Practical insights for career development",
            audience="professionals",
            tone="conversational",
            outline={
                "hook": "Here's something most professionals overlook...",
                "key_points": ["Point 1", "Point 2", "Point 3"],
                "cta": "What's your experience? Drop a comment below.",
            },
        )

    logger.info("[TopicPlanner] Topic plan created: %s", topic_plan.topic)
    return {
        "topic_plan": topic_plan,
        "current_step": "plan_topic",
        "steps_completed": state.steps_completed + ["plan_topic"],
    }
