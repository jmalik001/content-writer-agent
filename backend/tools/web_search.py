"""Web search tool — DuckDuckGo (free) with optional Tavily upgrade."""

from __future__ import annotations

import json
import logging
from typing import Any

from langchain_core.tools import tool

from config import settings

logger = logging.getLogger(__name__)


def _tavily_search(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    from tavily import TavilyClient  # type: ignore[import]

    client = TavilyClient(api_key=settings.tavily_api_key)
    response = client.search(query=query, max_results=max_results)
    return [
        {"title": r.get("title", ""), "url": r.get("url", ""), "content": r.get("content", "")}
        for r in response.get("results", [])
    ]


def _ddg_search(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    from duckduckgo_search import DDGS  # type: ignore[import]

    results = []
    with DDGS() as ddgs:
        for r in ddgs.text(query, max_results=max_results):
            results.append(
                {
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "content": r.get("body", ""),
                }
            )
    return results


def web_search(query: str, max_results: int = 5) -> list[dict[str, Any]]:
    """Search the web using Tavily (if API key set) or DuckDuckGo."""
    if settings.tavily_api_key:
        logger.info("Using Tavily for search: %s", query)
        try:
            return _tavily_search(query, max_results)
        except Exception as exc:
            logger.warning("Tavily search failed (%s), falling back to DDG", exc)

    logger.info("Using DuckDuckGo for search: %s", query)
    return _ddg_search(query, max_results)


@tool
def search_trending_topics(query: str) -> str:
    """Search the web for trending professional/LinkedIn topics.

    Args:
        query: The search query to find trending topics.

    Returns:
        JSON string with a list of search results.
    """
    results = web_search(query, max_results=8)
    return json.dumps(results, ensure_ascii=False)


@tool
def search_topic_context(query: str) -> str:
    """Search the web for context and information about a specific topic.

    Args:
        query: The topic or question to search for.

    Returns:
        JSON string with relevant search results.
    """
    results = web_search(query, max_results=5)
    return json.dumps(results, ensure_ascii=False)
