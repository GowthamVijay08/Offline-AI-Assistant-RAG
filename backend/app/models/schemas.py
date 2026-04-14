"""
schemas.py — Pydantic request / response models
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────
#  Upload
# ─────────────────────────────────────────────

class UploadResponse(BaseModel):
    status: str = Field(..., examples=["success"])
    file_id: str = Field(..., examples=["report_ab12cd34"])
    message: str = Field(..., examples=["File processed successfully"])
    chunks_created: int = Field(..., examples=[42])


# ─────────────────────────────────────────────
#  Query
# ─────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4096, examples=["What is the summary?"])
    file_id: Optional[str] = Field(
        None,
        description="If provided, restrict retrieval to this file's chunks.",
        examples=["report_ab12cd34"],
    )

    model_config = {"json_schema_extra": {"example": {"query": "Explain the main findings.", "file_id": None}}}


class QueryResponse(BaseModel):
    status: str = Field(..., examples=["success"])
    answer: str = Field(..., examples=["The main findings are ..."])
    sources: list[str] = Field(default_factory=list, description="Retrieved chunk snippets used as context.")


# ─────────────────────────────────────────────
#  Error
# ─────────────────────────────────────────────

class ErrorResponse(BaseModel):
    status: str = "error"
    message: str


# ─────────────────────────────────────────────
#  Health
# ─────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    services: dict[str, str] = Field(default_factory=dict)
