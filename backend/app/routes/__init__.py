from .upload import router as upload_router
from .query import router as query_router
from .health import router as health_router

__all__ = ["upload_router", "query_router", "health_router"]
