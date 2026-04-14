"""
embedding_service.py — Sentence-Transformer embedding generation with caching
"""

import hashlib
import threading
from functools import lru_cache
from typing import Optional

import numpy as np

from app.config.config import EMBEDDING_MODEL_NAME, EMBEDDING_DIM
from app.utils.logger import get_logger

logger = get_logger(__name__)

_model = None
_model_lock = threading.Lock()


def _get_model():
    """Thread-safe lazy loader for the SentenceTransformer model."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                try:
                    from sentence_transformers import SentenceTransformer

                    logger.info("Loading embedding model: %s", EMBEDDING_MODEL_NAME)
                    _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
                    logger.info("Embedding model loaded ✓")
                except ImportError:
                    logger.error("sentence-transformers not installed. Run: pip install sentence-transformers")
                    raise
    return _model


# Simple in-process cache keyed on text hash (avoid re-embedding identical chunks)
_embed_cache: dict[str, np.ndarray] = {}


def embed_texts(texts: list[str], batch_size: int = 32) -> np.ndarray:
    """
    Generate L2-normalised embeddings for a list of texts.

    Args:
        texts:      Input strings.
        batch_size: Encoding batch size for memory efficiency.

    Returns:
        np.ndarray of shape (N, EMBEDDING_DIM), dtype float32.
    """
    if not texts:
        return np.empty((0, EMBEDDING_DIM), dtype=np.float32)

    model = _get_model()
    logger.debug("Embedding %d texts (batch_size=%d)", len(texts), batch_size)

    # Check cache per-text
    results: list[Optional[np.ndarray]] = [None] * len(texts)
    uncached_idx: list[int] = []
    uncached_texts: list[str] = []

    for i, t in enumerate(texts):
        key = hashlib.md5(t.encode()).hexdigest()
        if key in _embed_cache:
            results[i] = _embed_cache[key]
        else:
            uncached_idx.append(i)
            uncached_texts.append(t)

    if uncached_texts:
        vectors = model.encode(
            uncached_texts,
            batch_size=batch_size,
            normalize_embeddings=True,
            show_progress_bar=False,
            convert_to_numpy=True,
        ).astype(np.float32)

        for j, idx in enumerate(uncached_idx):
            key = hashlib.md5(texts[idx].encode()).hexdigest()
            _embed_cache[key] = vectors[j]
            results[idx] = vectors[j]

    return np.stack(results)  # type: ignore[arg-type]


def embed_query(query: str) -> np.ndarray:
    """
    Embed a single query string.

    Returns:
        1-D np.ndarray of shape (EMBEDDING_DIM,).
    """
    return embed_texts([query])[0]
