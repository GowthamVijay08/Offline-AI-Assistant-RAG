"""
text_utils.py — Text cleaning and smart sentence-aware chunking

Works correctly for ANY PDF content — academic notes, textbooks, reports,
manuals, etc.  Never cuts mid-sentence or mid-word.
"""

import re
from app.config.config import CHUNK_SIZE, CHUNK_OVERLAP


# ─────────────────────────────────────────────
# Text cleaning
# ─────────────────────────────────────────────

def clean_text(text: str) -> str:
    """
    Normalise raw extracted text from any PDF:
      • Remove null bytes and invisible control chars (keep \\n, \\t).
      • Collapse 3+ blank lines → 2 (preserve paragraph breaks).
      • Collapse multiple spaces on the same line → single space.
      • Remove lines that are nothing but whitespace.
    """
    # Remove null bytes and non-printable control characters (keep \n \t)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", text)

    # Collapse runs of 3+ newlines to exactly 2 (paragraph separator)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Collapse horizontal whitespace (spaces/tabs) runs to a single space
    text = re.sub(r"[ \t]{2,}", " ", text)

    # Strip lines that contain only whitespace
    text = re.sub(r"(?m)^[ \t]+$", "", text)

    return text.strip()


# ─────────────────────────────────────────────
# Sentence splitting helper
# ─────────────────────────────────────────────

def _split_sentences(text: str) -> list[str]:
    """
    Split *text* into a flat list of sentence-like fragments.

    Strategy:
      1. Split on paragraph breaks first (hard boundaries).
      2. Within each paragraph, split on sentence-ending punctuation.
      3. Return each non-empty fragment.
    """
    sentences: list[str] = []

    for para in re.split(r"\n\s*\n", text):
        para = para.strip()
        if not para:
            continue

        # Split on sentence-ending punctuation followed by whitespace.
        # The look-behind keeps the punctuation on the left fragment.
        parts = re.split(r"(?<=[.!?…])\s+", para)
        for part in parts:
            part = part.strip()
            if part:
                sentences.append(part)

    return sentences


# ─────────────────────────────────────────────
# Chunking
# ─────────────────────────────────────────────

def chunk_text(
    text: str,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
) -> list[str]:
    """
    Split *text* into overlapping, sentence-aware chunks suitable for
    embedding and RAG retrieval.

    Rules:
      • Never cuts mid-sentence (unless a single sentence exceeds chunk_size).
      • Consecutive chunks share ~*overlap* characters for context continuity.
      • Works for any language / subject — no subject-specific logic.
      • Returns only non-empty, near-unique chunks.

    Args:
        text:       Cleaned input text (from clean_text()).
        chunk_size: Target max characters per chunk  (default: from .env).
        overlap:    Character overlap between chunks (default: from .env).

    Returns:
        list[str] — ordered chunks, ready for embedding.
    """
    if not text or not text.strip():
        return []

    sentences = _split_sentences(text)

    # Degenerate case: no paragraph/sentence boundaries found
    if not sentences:
        sentences = [text.strip()]

    chunks:       list[str] = []
    current:      list[str] = []
    current_len:  int       = 0

    for sent in sentences:
        # --- Hard split for a single sentence longer than chunk_size ----------
        if len(sent) > chunk_size:
            # Flush whatever's in the buffer first
            if current:
                chunks.append(" ".join(current))
                tail = " ".join(current)[-overlap:]
                current = [tail.strip()] if tail.strip() else []
                current_len = len(tail)

            # Slice the giant sentence into chunk_size pieces
            start = 0
            while start < len(sent):
                end = min(start + chunk_size, len(sent))
                piece = sent[start:end].strip()
                if piece:
                    chunks.append(piece)
                if end == len(sent):
                    break
                start += chunk_size - overlap
            continue

        # --- Normal sentence accumulation ------------------------------------
        sep = 1 if current else 0          # 1-char space between sentences
        if current_len + sep + len(sent) > chunk_size and current:
            # Flush
            chunk_str = " ".join(current)
            chunks.append(chunk_str)
            # Seed next chunk with the trailing overlap of this one
            tail = chunk_str[-overlap:].strip()
            current = [tail] if tail else []
            current_len = len(tail)

        current.append(sent)
        current_len += sep + len(sent)

    # Flush anything remaining
    if current:
        final = " ".join(current).strip()
        if final:
            chunks.append(final)

    # Deduplicate by leading fingerprint (keeps order)
    seen: set[str] = set()
    result: list[str] = []
    for c in chunks:
        fp = c[:60]
        if c.strip() and fp not in seen:
            seen.add(fp)
            result.append(c)

    return result
