"""
main.py — FastAPI application factory for Offline AI Assistant Backend
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config.config import CORS_ORIGINS
from app.routes import upload_router, query_router, health_router
from app.utils.logger import get_logger

logger = get_logger(__name__)


# ─────────────────────────────────────────────
# Lifespan (startup / shutdown hooks)
# ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 60)
    logger.info("  Offline AI Assistant Backend --- Starting up")
    logger.info("=" * 60)

    # Pre-warm FAISS index & graph DB on startup so first request is fast
    try:
        from app.services.vector_service import get_index_stats
        stats = get_index_stats()
        logger.info("FAISS index ready --- %d vectors", stats["total_vectors"])
    except Exception as exc:
        logger.warning("FAISS pre-warm skipped: %s", exc)

    try:
        from app.services.graph_service import get_graph_stats
        g = get_graph_stats()
        logger.info("Graph DB ready --- nodes=%d, edges=%d", g["nodes"], g["edges"])
    except Exception as exc:
        logger.warning("Graph DB pre-warm skipped: %s", exc)

    yield  # — application is running —

    logger.info("Offline AI Assistant Backend — Shutting down")


# ─────────────────────────────────────────────
# Application factory
# ─────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title="Offline AI Assistant API",
        description=(
            "A privacy-first, fully offline AI backend with Hybrid RAG (FAISS + GraphRAG), "
            "multimodal ingestion (PDF, image, audio), and llama.cpp LLM inference."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # ── CORS ──────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Global exception handler ───────────────
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error("Unhandled exception on %s %s: %s", request.method, request.url, exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "An unexpected server error occurred."},
        )

    # ── Request logging middleware ─────────────
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logger.info(">> %s %s", request.method, request.url.path)
        response = await call_next(request)
        logger.info("<< %s %s  [%d]", request.method, request.url.path, response.status_code)
        return response

    # ── Routers ───────────────────────────────
    app.include_router(upload_router)
    app.include_router(query_router)
    app.include_router(health_router)

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "message": "Offline AI Assistant API",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health",
        }

    return app


app = create_app()
