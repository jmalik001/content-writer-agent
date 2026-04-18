"""Post formatting utilities — character limits, hashtag extraction, emoji handling."""

from __future__ import annotations

import re


LINKEDIN_MAX_CHARS = 3000
LINKEDIN_RECOMMENDED_CHARS = 1300


def extract_hashtags(text: str) -> list[str]:
    """Extract all hashtags from a LinkedIn post."""
    return re.findall(r"#\w+", text)


def count_chars(text: str) -> int:
    """Return the character count of the post."""
    return len(text)


def truncate_to_limit(text: str, limit: int = LINKEDIN_MAX_CHARS) -> str:
    """Truncate post to LinkedIn's hard character limit, preserving word boundaries."""
    if len(text) <= limit:
        return text

    truncated = text[:limit]
    last_space = truncated.rfind(" ")
    if last_space > limit - 100:
        truncated = truncated[:last_space]
    return truncated + "\n\n[Post truncated]"


def format_post(text: str) -> dict:
    """
    Validate and format a LinkedIn post.

    Returns a dict with:
    - post: the (possibly truncated) post text
    - char_count: character count
    - hashtags: list of hashtags
    - within_recommended: whether post is within recommended 1300 chars
    - within_limit: whether post is within hard 3000-char limit
    """
    text = text.strip()
    text = truncate_to_limit(text, LINKEDIN_MAX_CHARS)

    char_count = count_chars(text)
    hashtags = extract_hashtags(text)

    return {
        "post": text,
        "char_count": char_count,
        "hashtags": hashtags,
        "within_recommended": char_count <= LINKEDIN_RECOMMENDED_CHARS,
        "within_limit": char_count <= LINKEDIN_MAX_CHARS,
    }
