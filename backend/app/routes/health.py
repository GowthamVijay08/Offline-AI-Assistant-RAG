"""
health.py — GET /health route (liveness probe + service status)
"""

from fastapi import APIRouter

from app.models.schemas import HealthResponse
from app.services.vector_service import get_index_stats
from app.services.graph_service import get_graph_stats
from app.services.llm_service import llm_status
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse, summary="Check API health and service statuses")
async def health_check():
    """
    Returns:
    - API version
    - FAISS vector index stats (how many docs / vectors indexed)
    - SQLite graph DB stats
    - LLM mode (ollama | smart-fallback)
    """
    try:
        v = get_index_stats()
        g = get_graph_stats()
        lm = llm_status()

        services = {
            "faiss": (
                f"ok — {v['total_vectors']} vectors, "
                f"{v['unique_files']} document(s) indexed"
            ),
            "graph_db": f"ok — {g['nodes']} nodes / {g['edges']} edges",
            "llm": (
                f"mode={lm['mode']}  "
                f"ollama_url={lm['ollama_url']}  "
                f"model={lm['ollama_model']}"
            ),
        }
    except Exception as exc:
        logger.warning("Health check partial failure: %s", exc)
        services = {
            "faiss": "unavailable",
            "graph_db": "unavailable",
            "llm": "unavailable",
        }

    return HealthResponse(status="ok", services=services)
