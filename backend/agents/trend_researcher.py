"""Trend Researcher Agent — discovers trending topics via web search."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from langchain_core.messages import HumanMessage, SystemMessage

from agents.llm_factory import get_llm
from models.schemas import AgentState, TrendingTopic
from tools.web_search import web_search

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (Path(__file__).parent.parent / "prompts" / "trend_researcher.md").read_text()

_SEARCH_QUERIES = [
    "trending LinkedIn posts professional development 2025",
    "viral LinkedIn topics technology AI business 2025",
    "popular professional topics LinkedIn this week",
]


async def research_trends(state: AgentState) -> dict:
    """LangGraph node: Search for trending topics and return structured results."""
    logger.info("[TrendResearcher] Starting trend research")

    # Gather search results from multiple queries
    all_results: list[dict] = []
    for query in _SEARCH_QUERIES:
        results = web_search(query, max_results=5)
        all_results.extend(results)

    # Summarise results into a context string for the LLM
    context_lines = []
    for r in all_results[:15]:
        context_lines.append(f"- {r.get('title', '')} — {r.get('content', '')[:200]}")
    context = "\n".join(context_lines)

    llm = get_llm(temperature=0.3)
    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(
            content=(
                f"Based on the following recent web search results, identify the top trending "
                f"professional topics suitable for a LinkedIn post.\n\n{context}\n\n"
                "Return ONLY valid JSON as specified."
            )
        ),
    ]

    response = await llm.ainvoke(messages)
    raw = response.content.strip()

    # Extract JSON from the response
    trending_topics: list[TrendingTopic] = []
    try:
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        trending_topics = [TrendingTopic(**item) for item in data]
    except (json.JSONDecodeError, Exception) as exc:
        logger.warning("[TrendResearcher] Failed to parse JSON response: %s", exc)
        # Fallback: create a generic topic from raw response
        trending_topics = [
            TrendingTopic(
                title="Professional Development Trends",
                reason=raw[:200],
                audience="professionals",
            )
        ]

    logger.info("[TrendResearcher] Found %d trending topics", len(trending_topics))
    return {
        "trending_topics": trending_topics,
        "current_step": "research_trends",
        "steps_completed": state.steps_completed + ["research_trends"],
    }
