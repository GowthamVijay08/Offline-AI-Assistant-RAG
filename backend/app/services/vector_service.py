"""
vector_service.py — FAISS vector index management (add, search, persist)
"""

import json
import threading
from pathlib import Path
from typing import Optional

import numpy as np

from app.config.config import (
    FAISS_INDEX_FILE,
    FAISS_META_FILE,
    EMBEDDING_DIM,
    TOP_K_RETRIEVAL,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

_index = None
_metadata: list[dict] = []   # parallel list — index i ↔ metadata[i]
_lock = threading.Lock()


# ─────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────

def _load_or_create_index():
    """Load existing FAISS index from disk or create a fresh one."""
    global _index, _metadata
    import faiss

    if FAISS_INDEX_FILE.exists() and FAISS_META_FILE.exists():
        logger.info("Loading existing FAISS index from %s", FAISS_INDEX_FILE)
        _index = faiss.read_index(str(FAISS_INDEX_FILE))
        with open(FAISS_META_FILE, "r", encoding="utf-8") as f:
            _metadata = json.load(f)
        logger.info("FAISS index loaded OK --- %d vectors", _index.ntotal)
    else:
        logger.info("Creating new FAISS IndexFlatIP (dim=%d)", EMBEDDING_DIM)
        _index = faiss.IndexFlatIP(EMBEDDING_DIM)   # Inner product ≈ cosine on normalised vecs
        _metadata = []


def _get_index():
    global _index
    if _index is None:
        with _lock:
            if _index is None:
                _load_or_create_index()
    return _index


def _save_index():
    import faiss

    faiss.write_index(_index, str(FAISS_INDEX_FILE))
    with open(FAISS_META_FILE, "w", encoding="utf-8") as f:
        json.dump(_metadata, f, ensure_ascii=False, indent=2)
    logger.debug("FAISS index persisted — %d vectors", _index.ntotal)


# ─────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────

def add_embeddings(
    embeddings: np.ndarray,
    file_id: str,
    chunk_ids: list[str],
    texts: list[str],
) -> None:
    """
    Add a batch of embeddings to the FAISS index and persist metadata.

    Args:
        embeddings: (N × EMBEDDING_DIM) float32 array.
        file_id:    Source document identifier.
        chunk_ids:  Per-chunk identifiers.
        texts:      Raw chunk texts (stored in metadata for retrieval).
    """
    index = _get_index()
    with _lock:
        index.add(embeddings)
        for i, (cid, text) in enumerate(zip(chunk_ids, texts)):
            _metadata.append({"file_id": file_id, "chunk_id": cid, "text": text})
        _save_index()
    logger.info("Added %d vectors for file_id=%s", len(embeddings), file_id)


def search(
    query_embedding: np.ndarray,
    top_k: int = TOP_K_RETRIEVAL,
    file_id: Optional[str] = None,
) -> list[dict]:
    """
    Search the FAISS index and return top-k matching chunks.

    Args:
        query_embedding: 1-D float32 array.
        top_k:           Number of results to return.
        file_id:         If provided, filter results to this document.

    Returns:
        List of dicts: {file_id, chunk_id, text, score}.
    """
    index = _get_index()
    if index.ntotal == 0:
        logger.warning("FAISS index is empty — no results")
        return []

    vec = query_embedding.reshape(1, -1).astype(np.float32)
    # Increase fetch count when filtering by file_id to significantly improve recall for specific documents
    fetch_k = min(200 if file_id else top_k, index.ntotal)
    scores, indices = index.search(vec, fetch_k)

    results: list[dict] = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(_metadata):
            continue
        meta = _metadata[idx]
        if file_id and meta["file_id"] != file_id:
            continue
        results.append({**meta, "score": float(score)})
        if len(results) >= top_k:
            break

    logger.debug("FAISS search returned %d results (file_id_filter=%s)", len(results), file_id)
    return results


def get_index_stats() -> dict:
    """Return basic statistics about the current index."""
    index = _get_index()
    unique_files = len({m["file_id"] for m in _metadata})
    return {
        "total_vectors": index.ntotal,
        "unique_files": unique_files,
        "embedding_dim": EMBEDDING_DIM,
    }
