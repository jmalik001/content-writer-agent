"""LLM factory — returns a configured chat model based on settings."""

from __future__ import annotations

from langchain_core.language_models.chat_models import BaseChatModel

from config import settings


def get_llm(temperature: float = 0.7) -> BaseChatModel:
    """Return a chat model based on the configured LLM_PROVIDER."""
    provider = settings.llm_provider

    if provider == "groq":
        from langchain_groq import ChatGroq  # type: ignore[import]

        return ChatGroq(
            model=settings.effective_llm_model,
            api_key=settings.groq_api_key,  # type: ignore[arg-type]
            temperature=temperature,
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI  # type: ignore[import]

        return ChatOpenAI(
            model=settings.effective_llm_model,
            api_key=settings.openai_api_key,  # type: ignore[arg-type]
            temperature=temperature,
        )

    raise ValueError(f"Unsupported LLM provider: {provider!r}")
