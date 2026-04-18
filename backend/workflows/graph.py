"""LangGraph workflow — orchestrates the LinkedIn content writer multi-agent pipeline."""

from __future__ import annotations

import logging
from typing import Any, Literal

from langgraph.graph import END, START, StateGraph

from agents.content_drafter import draft_content
from agents.editor import edit_post
from agents.topic_planner import plan_topic
from agents.trend_researcher import research_trends
from models.schemas import AgentState

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Conditional routing
# ---------------------------------------------------------------------------

def should_research_trends(state: AgentState) -> Literal["research_trends", "plan_topic"]:
    """Route to trend research if no user topic provided."""
    if state.mode == "trending" or not state.user_topic:
        return "research_trends"
    return "plan_topic"


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------

def build_graph() -> Any:
    """Build and compile the LangGraph StateGraph for the content writer pipeline."""

    # Use a dict-based state for LangGraph compatibility
    # AgentState is used for type hints; graph state is plain dict
    graph = StateGraph(dict)

    # Add nodes
    graph.add_node("research_trends", _wrap(research_trends))
    graph.add_node("plan_topic", _wrap(plan_topic))
    graph.add_node("draft_content", _wrap(draft_content))
    graph.add_node("edit_post", _wrap(edit_post))

    # Entry point: conditional routing
    graph.add_conditional_edges(
        START,
        lambda state: should_research_trends(AgentState(**state)),
        {
            "research_trends": "research_trends",
            "plan_topic": "plan_topic",
        },
    )

    # Linear flow after routing
    graph.add_edge("research_trends", "plan_topic")
    graph.add_edge("plan_topic", "draft_content")
    graph.add_edge("draft_content", "edit_post")
    graph.add_edge("edit_post", END)

    return graph.compile()


def _wrap(node_fn):
    """Wrap an async agent node to accept/return plain dicts (LangGraph requirement)."""

    async def wrapper(state: dict) -> dict:
        agent_state = AgentState(**state)
        updates = await node_fn(agent_state)
        return updates

    wrapper.__name__ = node_fn.__name__
    return wrapper


# Singleton compiled graph
_graph = None


def get_graph():
    """Return the compiled graph (singleton)."""
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
