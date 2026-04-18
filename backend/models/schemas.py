"""Pydantic v2 schemas for the LinkedIn Content Writer Agent."""

from __future__ import annotations

from typing import Any, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# LangGraph Agent State
# ---------------------------------------------------------------------------

class TopicOutline(BaseModel):
    topic: str
    angle: str
    audience: str
    tone: str
    outline: dict[str, Any]


class TrendingTopic(BaseModel):
    title: str
    reason: str
    audience: str


class AgentState(BaseModel):
    """Shared state passed between LangGraph nodes."""

    run_id: str = Field(default_factory=lambda: str(uuid4()))

    # Input
    user_topic: Optional[str] = None
    mode: Literal["topic", "trending"] = "topic"

    # Intermediate
    trending_topics: list[TrendingTopic] = Field(default_factory=list)
    topic_plan: Optional[TopicOutline] = None
    draft: Optional[str] = None

    # Output
    final_post: Optional[str] = None

    # Progress tracking
    current_step: str = "idle"
    steps_completed: list[str] = Field(default_factory=list)
    error: Optional[str] = None

    class Config:
        arbitrary_types_allowed = True


# ---------------------------------------------------------------------------
# API Request / Response Models
# ---------------------------------------------------------------------------

class GenerateRequest(BaseModel):
    topic: Optional[str] = Field(
        default=None,
        description="User-provided topic. Leave empty to auto-discover trending topics.",
    )
    mode: Literal["topic", "trending"] = Field(
        default="topic",
        description="'topic' uses the provided topic; 'trending' auto-discovers trending topics.",
    )


class PostDraft(BaseModel):
    draft: str
    char_count: int
    hashtags: list[str]


class GenerateResponse(BaseModel):
    run_id: str
    final_post: str
    char_count: int
    hashtags: list[str]
    topic_plan: Optional[TopicOutline] = None
    steps_completed: list[str]


class FeedbackRequest(BaseModel):
    run_id: str
    action: Literal["approve", "reject", "edit"]
    edited_post: Optional[str] = Field(
        default=None,
        description="Required when action is 'edit'. The user-edited version of the post.",
    )


class TrendingTopicsResponse(BaseModel):
    topics: list[TrendingTopic]


class StatusResponse(BaseModel):
    run_id: str
    status: Literal["running", "completed", "failed"]
    current_step: str
    steps_completed: list[str]
    result: Optional[GenerateResponse] = None
    error: Optional[str] = None
