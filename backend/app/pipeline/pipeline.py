"""
pipeline.py — AI Pipeline Orchestrator (universal — works for ANY uploaded PDF)

Ingestion stages:
  1. File-type detection
  2. Text extraction  → PDF (text + OCR fallback) | Image → OCR | Audio → Whisper
  3. Text cleaning & sentence-aware chunking
  4. Embedding generation (Sentence Transformers)
  5. FAISS vector index storage
  6. SQLite graph construction (sequential + semantic edges)

Query stages:
  7. Query embedding
  8. Hybrid retrieval (FAISS + graph traversal)
  9. Context assembly
  10. LLM / fallback answer generation
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

import numpy as np

from app.utils.logger import get_logger
from app.utils.text_utils import clean_text, chunk_text
from app.services import (
    detect_file_type,
    extract_text_from_image,
    transcribe_audio,
    embed_texts,
    embed_query,
    add_embeddings,
    add_nodes,
    add_edges,
    hybrid_retrieve,
    build_context,
    generate_answer,
)

logger = get_logger(__name__)


# ─────────────────────────────────────────────
# PDF text extraction
# ─────────────────────────────────────────────

def _pdf_direct_text(path: Path) -> str:
    """
    Use PyMuPDF (preferred) or pdfplumber (fallback) to extract embedded text.
    Returns an empty string if neither library is available or the PDF has no
    selectable text (i.e. it is a scanned image-only PDF).
    """
    # ── PyMuPDF ──────────────────────────────────────────────
    try:
        import fitz  # PyMuPDF

        doc  = fitz.open(str(path))
        pages = [page.get_text("text") for page in doc]
        doc.close()
        result = "\n\n".join(pages)
        logger.debug("PyMuPDF: %d chars from %s", len(result), path.name)
        return result
    except ImportError:
        pass
    except Exception as exc:
        logger.warning("PyMuPDF error on %s: %s", path.name, exc)

    # ── pdfplumber ───────────────────────────────────────────
    try:
        import pdfplumber

        with pdfplumber.open(str(path)) as pdf:
            pages = [p.extract_text() or "" for p in pdf.pages]
        result = "\n\n".join(pages)
        logger.debug("pdfplumber: %d chars from %s", len(result), path.name)
        return result
    except ImportError:
        logger.error("No PDF parser installed. Run: pip install pymupdf")
        raise RuntimeError("No PDF parser available — install PyMuPDF: pip install pymupdf")
    except Exception as exc:
        logger.warning("pdfplumber error on %s: %s", path.name, exc)
        return ""


def _pdf_ocr_fallback(path: Path) -> str:
    """
    Render each PDF page as an image and OCR it.
    Used automatically when direct text extraction yields < 80 useful chars
    (typical of scanned or image-only PDFs).
    """
    try:
        import fitz
        from PIL import Image
        import io

        doc    = fitz.open(str(path))
        pages: list[str] = []

        for page_num, page in enumerate(doc):
            # 150 DPI: fast and accurate for most OCR engines
            mat  = fitz.Matrix(150 / 72, 150 / 72)
            pix  = page.get_pixmap(matrix=mat, alpha=False)
            img  = Image.open(io.BytesIO(pix.tobytes("png")))

            # Write to a temp file that OCR service can read
            tmp = path.parent / f"_ocr_{path.stem}_p{page_num}.png"
            img.save(tmp)
            try:
                pages.append(extract_text_from_image(tmp))
            finally:
                tmp.unlink(missing_ok=True)

        doc.close()
        result = "\n\n".join(pages)
        logger.info("OCR fallback: %d chars from %d pages of %s", len(result), len(pages), path.name)
        return result

    except Exception as exc:
        logger.error("PDF OCR fallback failed for %s: %s", path.name, exc)
        raise RuntimeError(
            f"Could not extract text from '{path.name}' (tried text + OCR). "
            f"Detail: {exc}"
        ) from exc


def _extract_pdf(path: Path) -> str:
    """
    Full PDF extraction strategy:
      1. Try embedded-text extraction (fast, zero quality loss).
      2. If result is < 80 chars, assume scanned PDF → OCR every page.
    This makes the pipeline work for ANY PDF — digital or scanned.
    """
    MIN_TEXT_CHARS = 80

    text = _pdf_direct_text(path)
    if len(text.strip()) >= MIN_TEXT_CHARS:
        return text

    logger.info(
        "Direct extraction returned only %d chars for '%s' — switching to OCR",
        len(text.strip()), path.name,
    )
    return _pdf_ocr_fallback(path)


# ─────────────────────────────────────────────
# Generic extraction dispatcher
# ─────────────────────────────────────────────

def _extract_text(file_path: Path, file_type: str) -> str:
    """Stage 2 — Dispatch extraction based on file type."""
    if file_type == "pdf":
        return _extract_pdf(file_path)
    if file_type == "image":
        return extract_text_from_image(file_path)
    if file_type == "audio":
        return transcribe_audio(file_path)
    raise ValueError(
        f"Unsupported file type '{file_type}' for '{file_path.name}'. "
        "Supported: PDF, JPG/PNG/TIFF/BMP/WebP images, MP3/WAV audio."
    )


# ─────────────────────────────────────────────
# Helper utilities
# ─────────────────────────────────────────────

def _make_chunk_ids(file_id: str, n: int) -> list[str]:
    return [f"{file_id}_chunk_{i:04d}" for i in range(n)]


def _semantic_edges(
    embeddings: np.ndarray,
    threshold: float = 0.85,
) -> list[tuple[int, int, float]]:
    """
    Compute cosine-similarity edges between chunk pairs. 
    Reduced complexity (n=150) for faster ingestion.
    """
    n = len(embeddings)
    if n > 150:
        return []   # rely on sequential edges for large docs

    sim_matrix = embeddings @ embeddings.T
    pairs: list[tuple[int, int, float]] = []
    for i in range(n):
        for j in range(i + 1, n):
            s = float(sim_matrix[i, j])
            if s > threshold:
                pairs.append((i, j, s))
    return pairs


# ─────────────────────────────────────────────
# INGESTION PIPELINE
# ─────────────────────────────────────────────

def ingest_file(file_id: str, file_path: Path) -> int:
    """
    Process any uploaded file end-to-end and store it in the vector/graph DB.

    This is the ONLY function that gets called per upload — it handles any
    PDF (scanned or digital), any image, or any audio file.

    Args:
        file_id:   Unique ID generated at upload time.
        file_path: Path to the saved file on disk.

    Returns:
        Number of text chunks indexed.

    Raises:
        ValueError   — file is empty / yields no text after cleaning.
        RuntimeError — unrecoverable extraction or storage failure.
    """
    logger.info("━━━ INGEST START  file_id=%s  file=%s", file_id, file_path.name)

    # ── Stage 1: Detect file type ─────────────────────────────────────────────
    file_type = detect_file_type(file_path)
    logger.info("Stage 1 ✓  type=%s", file_type)

    # ── Stage 2: Extract raw text ─────────────────────────────────────────────
    try:
        raw_text = _extract_text(file_path, file_type)
    except (ValueError, RuntimeError):
        raise
    except Exception as exc:
        raise RuntimeError(
            f"Text extraction failed for '{file_path.name}': {exc}"
        ) from exc

    if not raw_text or not raw_text.strip():
        raise ValueError(
            f"No text could be extracted from '{file_path.name}'. "
            "The file may be blank, password-protected, or in an unsupported encoding."
        )
    logger.info("Stage 2 ✓  raw_text=%d chars", len(raw_text))

    # ── Stage 3: Clean & chunk ────────────────────────────────────────────────
    cleaned = clean_text(raw_text)
    if not cleaned.strip():
        raise ValueError("Document text was empty after cleaning.")

    chunks = chunk_text(cleaned)
    if not chunks:
        raise ValueError(
            f"Document '{file_path.name}' produced no chunks. "
            "It may be too short or contain only non-textual content."
        )

    chunk_ids = _make_chunk_ids(file_id, len(chunks))
    avg_len   = sum(len(c) for c in chunks) / len(chunks)
    logger.info("Stage 3 ✓  chunks=%d  avg_len=%.0f chars", len(chunks), avg_len)

    # ── Stage 4: Generate embeddings ──────────────────────────────────────────
    try:
        embeddings = embed_texts(chunks)
    except Exception as exc:
        raise RuntimeError(f"Embedding generation failed: {exc}") from exc
    logger.info("Stage 4 ✓  embeddings shape=%s", embeddings.shape)

    # ── Stage 5: Store in FAISS vector index ──────────────────────────────────
    try:
        add_embeddings(embeddings, file_id=file_id, chunk_ids=chunk_ids, texts=chunks)
    except Exception as exc:
        raise RuntimeError(f"FAISS storage failed: {exc}") from exc
    logger.info("Stage 5 ✓  stored in FAISS")

    # ── Stage 6: Build knowledge graph ────────────────────────────────────────
    try:
        add_nodes(file_id=file_id, chunk_ids=chunk_ids, texts=chunks)
        sem_edges = _semantic_edges(embeddings)
        add_edges(chunk_ids=chunk_ids, similarities=sem_edges)
        logger.info("Stage 6 ✓  graph nodes=%d  semantic_edges=%d", len(chunks), len(sem_edges))
    except Exception as exc:
        # Graph failure is non-fatal — FAISS retrieval still works alone
        logger.warning("Stage 6 ⚠ graph build failed (non-fatal): %s", exc)

    logger.info("━━━ INGEST DONE   file_id=%s  chunks=%d", file_id, len(chunks))
    return len(chunks)


# ─────────────────────────────────────────────
# QUERY PIPELINE
# ─────────────────────────────────────────────

def query_pipeline(
    question: str,
    file_id: Optional[str] = None,
) -> tuple[str, list[str]]:
    """
    Answer a question by retrieving relevant chunks from ALL indexed documents
    (or a specific one if file_id is given) and passing them to the LLM.

    Args:
        question: Natural-language question from the user.
        file_id:  If provided, search only within this document.
                  If None, search across ALL uploaded documents.

    Returns:
        (answer_string, list_of_source_snippet_strings)
    """
    question = question.strip()
    if not question:
        return "Please enter a question.", []

    logger.info("━━━ QUERY START  question='%s'  file_id=%s", question[:80], file_id)

    # Stage 7 — embed the question
    try:
        q_emb = embed_query(question)
    except Exception as exc:
        raise RuntimeError(f"Query embedding failed: {exc}") from exc

    # Stage 8 — hybrid retrieval
    retrieved = hybrid_retrieve(q_emb, file_id=file_id)

    if not retrieved:
        msg = (
            "I could not find relevant information to answer your question. "
            "Please upload a relevant document first."
            if file_id is None
            else f"No relevant information found in document '{file_id}'. "
                 "Try querying without a file_id to search all documents."
        )
        logger.warning("No chunks retrieved for query")
        return msg, []

    # Stage 9 — build context string
    context, sources = build_context(retrieved)

    # Stage 10 — generate answer
    try:
        answer = generate_answer(context=context, question=question)
    except Exception as exc:
        logger.error("Answer generation failed: %s", exc)
        answer = (
            f"Answer generation encountered an error: {exc}. "
            f"Most relevant passage: {sources[0] if sources else 'none'}"
        )

    logger.info("━━━ QUERY DONE   answer=%d chars  sources=%d", len(answer), len(sources))
    return answer, sources
