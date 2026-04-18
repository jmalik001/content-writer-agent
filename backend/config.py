"""Application configuration using Pydantic Settings v2."""

from __future__ import annotations

from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # LLM provider: "groq" (default, free) or "openai"
    llm_provider: Literal["groq", "openai"] = Field(default="groq")
    groq_api_key: str = Field(default="")
    openai_api_key: str = Field(default="")
    llm_model: str = Field(default="")  # empty = use provider default

    # Web search
    tavily_api_key: str = Field(default="")  # optional; falls back to DuckDuckGo

    # LangSmith tracing (optional)
    langchain_tracing_v2: bool = Field(default=False)
    langchain_api_key: str = Field(default="")
    langchain_project: str = Field(default="linkedin-content-writer")

    # Server
    frontend_origin: str = Field(default="http://localhost:3000")
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)

    @property
    def effective_llm_model(self) -> str:
        if self.llm_model:
            return self.llm_model
        defaults = {
            "groq": "llama3-8b-8192",
            "openai": "gpt-4o-mini",
        }
        return defaults[self.llm_provider]


settings = Settings()
