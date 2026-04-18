"""Editor Agent — reviews and improves the LinkedIn post draft."""

from __future__ import annotations

import logging
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage

from agents.llm_factory import get_llm
from models.schemas import AgentState
from tools.post_formatter import format_post

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (Path(__file__).parent.parent / "prompts" / "editor.md").read_text()


async def edit_post(state: AgentState) -> dict:
    """LangGraph node: Edit and polish the draft, then format for LinkedIn."""
    logger.info("[Editor] Editing draft")

    if not state.draft:
        raise ValueError("draft is required before editing")

    llm = get_llm(temperature=0.4)
    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"Please edit and improve the following LinkedIn post draft:\n\n"
                f"{state.draft}\n\n"
                "Apply all the editing rules and return only the final polished post."
            )
        ),
    ]

    response = await llm.ainvoke(messages)
    edited = response.content.strip()

    # Apply post formatting and validation
    formatted = format_post(edited)
    final_post = formatted["post"]

    logger.info(
        "[Editor] Post finalized: %d chars, %d hashtags",
        formatted["char_count"],
        len(formatted["hashtags"]),
    )
    return {
        "final_post": final_post,
        "current_step": "edit_post",
        "steps_completed": state.steps_completed + ["edit_post"],
    }
