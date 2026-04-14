"""
retrieval_service.py — Hybrid Retrieval: Vector (FAISS) + Graph (SQLite) with reranking
"""

from typing import Optional

import numpy as np

from app.config.config import TOP_K_RETRIEVAL, GRAPH_TOP_K
from app.services import vector_service, graph_service
from app.utils.logger import get_logger

logger = get_logger(__name__)


def hybrid_retrieve(
    query_embedding: np.ndarray,
    top_k: int = TOP_K_RETRIEVAL,
    file_id: Optional[str] = None,
) -> list[dict]:
    """
    Perform hybrid retrieval combining FAISS vector search and graph traversal.

    Strategy:
    1. Vector search → top-k candidates.
    2. For each candidate, fetch graph neighbours.
    3. Merge and deduplicate all candidates.
    4. Rerank by combined score (vector score + graph weight bonus).

    Returns:
        Sorted list of unique chunk dicts with a ``final_score`` key.
    """
    # ── Step 1: Vector search ────────────────────────────────
    vector_hits = vector_service.search(query_embedding, top_k=top_k, file_id=file_id)
    logger.debug("Vector hits: %d", len(vector_hits))

    seen: dict[str, dict] = {}   # chunk_id → enriched dict

    for hit in vector_hits:
        cid = hit["chunk_id"]
        seen[cid] = {**hit, "final_score": hit["score"], "source": "vector"}

    # ── Step 2: Graph expansion ──────────────────────────────
    for hit in vector_hits:
        neighbours = graph_service.get_neighbours(hit["chunk_id"], top_k=GRAPH_TOP_K)
        for nb in neighbours:
            cid = nb["chunk_id"]
            if cid not in seen:
                # Assign a graph-derived score scaled down vs vector hits
                graph_score = hit["score"] * nb["weight"] * 0.7
                seen[cid] = {
                    "file_id": nb["file_id"],
                    "chunk_id": cid,
                    "text": nb["text"],
                    "score": graph_score,
                    "final_score": graph_score,
                    "source": "graph",
                }
            else:
                # Bonus for appearing in both paths
                seen[cid]["final_score"] += nb["weight"] * 0.1

    # ── Step 3: Filter by file_id (if requested) ─────────────
    candidates = list(seen.values())
    if file_id:
        candidates = [c for c in candidates if c["file_id"] == file_id]

    # ── Step 4: Rerank ───────────────────────────────────────
    candidates.sort(key=lambda x: x["final_score"], reverse=True)
    top_results = candidates[:top_k]

    logger.info(
        "Hybrid retrieval: %d results (vector=%d, graph_expanded=%d)",
        len(top_results),
        len(vector_hits),
        len(seen) - len(vector_hits),
    )
    return top_results


def build_context(chunks: list[dict], max_chars: int = 3000) -> tuple[str, list[str]]:
    """
    Concatenate retrieved chunks into an LLM context string.

    Returns:
        (context_string, list_of_source_snippets)
    """
    context_parts: list[str] = []
    sources: list[str] = []
    total_len = 0

    for i, chunk in enumerate(chunks, start=1):
        text: str = chunk.get("text", "")
        snippet = text[:200].replace("\n", " ")
        entry = f"[{i}] {text}"
        if total_len + len(entry) > max_chars:
            break
        context_parts.append(entry)
        sources.append(snippet)
        total_len += len(entry)

    return "\n\n".join(context_parts), sources
