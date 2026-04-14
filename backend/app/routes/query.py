"""
query.py — POST /query route
"""

from fastapi import APIRouter, HTTPException, status

from app.models.schemas import QueryRequest, QueryResponse, ErrorResponse
from app.pipeline.pipeline import query_pipeline
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/query", tags=["Query"])


@router.post(
    "",
    response_model=QueryResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Ask a question; receive an AI-generated answer from your documents",
)
async def query_documents(body: QueryRequest):
    """
    **Query endpoint**

    - Embeds the question
    - Performs hybrid retrieval (FAISS + graph)
    - Generates an answer via offline LLM
    - Returns answer + source chunk snippets
    """
    logger.info(
        "Query request: query='%s'  file_id=%s",
        body.query[:80],
        body.file_id,
    )

    try:
        answer, sources = query_pipeline(question=body.query, file_id=body.file_id)
        return QueryResponse(status="success", answer=answer, sources=sources)

    except RuntimeError as exc:
        logger.error("LLM error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error("Query pipeline error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query failed: {exc}",
        )
