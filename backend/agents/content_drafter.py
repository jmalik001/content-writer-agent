"""Content Drafter Agent — writes the initial LinkedIn post draft."""

from __future__ import annotations

import logging
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage

from agents.llm_factory import get_llm
from models.schemas import AgentState

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (Path(__file__).parent.parent / "prompts" / "content_drafter.md").read_text()


async def draft_content(state: AgentState) -> dict:
    """LangGraph node: Write a LinkedIn post draft based on the topic plan."""
    logger.info("[ContentDrafter] Writing draft")

    if not state.topic_plan:
        raise ValueError("topic_plan is required before drafting content")

    plan = state.topic_plan
    outline_str = (
        f"Hook idea: {plan.outline.get('hook', '')}\n"
        f"Key points: {', '.join(plan.outline.get('key_points', []))}\n"
        f"CTA direction: {plan.outline.get('cta', '')}"
    )

    llm = get_llm(temperature=0.8)
    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"Write a LinkedIn post with the following plan:\n\n"
                f"Topic: {plan.topic}\n"
                f"Angle: {plan.angle}\n"
                f"Target audience: {plan.audience}\n"
                f"Tone: {plan.tone}\n"
                f"Outline:\n{outline_str}\n\n"
                "Write the full LinkedIn post now."
            )
        ),
    ]

    response = await llm.ainvoke(messages)
    draft = response.content.strip()

    logger.info("[ContentDrafter] Draft written (%d chars)", len(draft))
    return {
        "draft": draft,
        "current_step": "draft_content",
        "steps_completed": state.steps_completed + ["draft_content"],
    }
