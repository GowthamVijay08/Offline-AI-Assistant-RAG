"""
llm_service.py — Offline LLM inference via Ollama

Modes:
  1. OLLAMA:    Ollama local API → real AI generation (http://localhost:11434)
  2. FALLBACK:  Ollama not running → smart keyword-based context extractor

Setup:
  1. Install Ollama:  https://ollama.com/download
  2. Run server:      ollama serve
  3. Pull a model:    ollama pull phi3:mini   (already installed)
  4. Set in .env:     OLLAMA_MODEL=phi3:mini
"""

import re
import threading
import urllib.request
import urllib.error
import json as _json

from app.config.config import (
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    LLM_MAX_TOKENS,
    LLM_TEMPERATURE,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

_ollama_ok: bool | None = None      # None = not yet probed
_probe_lock = threading.Lock()

_SYSTEM_PROMPT = "Answer briefly using only the provided context. If unknown, say: 'Information not found in document.'"\


# ─────────────────────────────────────────────
# Ollama connectivity probe
# ─────────────────────────────────────────────

def _probe_ollama() -> bool:
    """Return True if Ollama API is reachable (cached per-process)."""
    global _ollama_ok
    if _ollama_ok is not None:
        return _ollama_ok
    with _probe_lock:
        if _ollama_ok is not None:
            return _ollama_ok
        try:
            url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/tags"
            with urllib.request.urlopen(url, timeout=3) as r:
                _ollama_ok = r.status == 200
                if _ollama_ok:
                    logger.info("Ollama reachable at %s — model=%s", OLLAMA_BASE_URL, OLLAMA_MODEL)
        except Exception as exc:
            logger.warning("Ollama not reachable (%s) — using fallback extractor", exc)
            _ollama_ok = False
    return _ollama_ok


def _invalidate_probe() -> None:
    """Reset probe so next request re-checks Ollama (useful after failures)."""
    global _ollama_ok
    _ollama_ok = None


# ─────────────────────────────────────────────
# Ollama HTTP call
# ─────────────────────────────────────────────

def _call_ollama(context: str, question: str) -> str:
    """POST to Ollama /api/chat and return the response text."""
    url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/chat"
    payload = _json.dumps({
        "model": OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion:\n{question}"}
        ],
        "stream": False,
        "options": {
            "num_predict": LLM_MAX_TOKENS,
            "temperature": LLM_TEMPERATURE,
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = _json.loads(resp.read().decode("utf-8"))
            text = data.get("message", {}).get("content", "").strip()
            logger.debug("Ollama response: %d chars", len(text))
            return text
    except urllib.error.HTTPError as exc:
        err = exc.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError(f"Ollama HTTP {exc.code}: {err}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Ollama connection failed: {exc.reason}") from exc


# ─────────────────────────────────────────────
# Smart fallback extractor (zero dependencies)
# ─────────────────────────────────────────────

def _fallback_answer(context: str, question: str) -> str:
    """
    Keyword-overlap sentence ranker — works for ANY uploaded PDF without a LLM.
    Returns the top sentences from the retrieved context that best match the
    query, so users always get a useful answer even offline.
    """
    # Strip the [N] numbering added by build_context
    sections = re.split(r"\[\d+\]\s*", context)
    sections = [s.strip() for s in sections if s.strip()]

    if not sections:
        return "No relevant content was found for your question."

    q_words = set(re.findall(r"\w{3,}", question.lower()))

    scored: list[tuple[float, str]] = []
    for section in sections:
        sentences = re.split(r"(?<=[.!?])\s+", section)
        for sent in sentences:
            sent = sent.strip()
            if len(sent) < 20:
                continue
            s_words = set(re.findall(r"\w{3,}", sent.lower()))
            overlap = len(q_words & s_words)
            if overlap > 0:
                scored.append((overlap / max(len(q_words), 1), sent))

    scored.sort(key=lambda x: -x[0])
    top = [s for _, s in scored[:5]]

    if not top:
        # No keyword overlap — just return the start of the first section
        all_sents = re.split(r"(?<=[.!?])\s+", sections[0])
        top = [s for s in all_sents[:3] if len(s) > 20]

    if not top:
        return sections[0][:500]

    answer = " ".join(top)
    answer = re.sub(r"\s+", " ", answer).strip()
    note = (
        f"\n\n[ℹ️ Extracted directly from document. "
        f"For full AI answers, run `ollama serve` and `ollama pull {OLLAMA_MODEL}`.]"
    )
    return answer + note


# ─────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────

def generate_answer(context: str, question: str) -> str:
    """
    Generate an answer from retrieved document context.

    - If Ollama is running → real LLM answer.
    - Otherwise          → smart keyword extractor (always works).
    """
    if _probe_ollama():
        try:
            logger.debug("Calling Ollama (model=%s)", OLLAMA_MODEL)
            return _call_ollama(context, question)
        except Exception as exc:
            logger.error("Ollama inference error: %s — switching to fallback", exc)
            _invalidate_probe()
            return _fallback_answer(context, question)

    logger.info("Ollama offline — using keyword extractor fallback")
    return _fallback_answer(context, question)


def llm_status() -> dict:
    """Return current LLM mode status (used by /health endpoint)."""
    available = _probe_ollama()
    return {
        "ollama_url": OLLAMA_BASE_URL,
        "ollama_model": OLLAMA_MODEL,
        "ollama_available": available,
        "mode": "ollama" if available else "smart-fallback",
    }
