"""
config.py — Central configuration for Offline AI Assistant Backend
Loads .env automatically so all settings can be changed without code edits.
"""

import os
from pathlib import Path

# ── Auto-load .env (must happen before any os.getenv calls) ──────────────────
try:
    from dotenv import load_dotenv
    _env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(_env_path, override=False)   # real env vars win over .env
except ImportError:
    pass   # python-dotenv not installed — os.environ still works


# ─────────────────────────────────────────────
# Base Paths
# ─────────────────────────────────────────────
BASE_DIR       = Path(__file__).resolve().parent.parent.parent   # /backend
DATA_DIR       = BASE_DIR / "data"
UPLOADS_DIR    = DATA_DIR / "uploads"
FAISS_INDEX_DIR= DATA_DIR / "faiss_index"
GRAPH_DB_PATH  = DATA_DIR / "graph.db"

# Ensure directories exist at import time
for _d in (UPLOADS_DIR, FAISS_INDEX_DIR, DATA_DIR):
    _d.mkdir(parents=True, exist_ok=True)


# ─────────────────────────────────────────────
# File Upload Settings
# ─────────────────────────────────────────────
MAX_FILE_SIZE_BYTES: int = int(os.getenv("MAX_FILE_SIZE_MB", "50")) * 1024 * 1024

ALLOWED_EXTENSIONS: set[str] = {
    ".pdf",
    ".jpg", ".jpeg", ".png", ".tiff", ".bmp", ".webp",
    ".mp3", ".wav", ".ogg", ".m4a",
}


# ─────────────────────────────────────────────
# Chunking
# ─────────────────────────────────────────────
CHUNK_SIZE:    int = int(os.getenv("CHUNK_SIZE", "800"))    # chars per chunk
CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "120")) # overlap chars


# ─────────────────────────────────────────────
# Embedding Model
# ─────────────────────────────────────────────
EMBEDDING_MODEL_NAME: str = os.getenv(
    "EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"
)
EMBEDDING_DIM: int = 384   # for all-MiniLM-L6-v2


# ─────────────────────────────────────────────
# FAISS
# ─────────────────────────────────────────────
FAISS_INDEX_FILE: Path = FAISS_INDEX_DIR / "index.faiss"
FAISS_META_FILE:  Path = FAISS_INDEX_DIR / "metadata.json"
TOP_K_RETRIEVAL:  int  = int(os.getenv("TOP_K_RETRIEVAL", "5"))


# ─────────────────────────────────────────────
# Graph / SQLite
# ─────────────────────────────────────────────
GRAPH_TOP_K: int = int(os.getenv("GRAPH_TOP_K", "3"))


# ─────────────────────────────────────────────
# LLM — Ollama
# ─────────────────────────────────────────────
OLLAMA_BASE_URL: str   = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL:    str   = os.getenv("OLLAMA_MODEL", "llama3")
LLM_MAX_TOKENS:  int   = int(os.getenv("LLM_MAX_TOKENS", "512"))
LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))


# ─────────────────────────────────────────────
# Whisper (audio uploads)
# ─────────────────────────────────────────────
WHISPER_MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "base")


# ─────────────────────────────────────────────
# OCR (image uploads + scanned PDFs)
# ─────────────────────────────────────────────
OCR_ENGINE:    str = os.getenv("OCR_ENGINE", "tesseract")
TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", "tesseract")


# ─────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────
LOG_LEVEL: str  = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE:  Path = BASE_DIR / "logs" / "app.log"
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)


# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
CORS_ORIGINS: list[str] = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")
