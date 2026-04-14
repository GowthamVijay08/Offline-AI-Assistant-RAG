"""
file_service.py — File upload, validation, and local persistence
"""

import aiofiles
from pathlib import Path
from fastapi import UploadFile, HTTPException, status

from app.config.config import UPLOADS_DIR, MAX_FILE_SIZE_BYTES
from app.utils import (
    validate_extension,
    validate_file_size,
    generate_file_id,
    safe_filename,
    get_file_hash,
    get_logger,
)

logger = get_logger(__name__)


async def save_upload(file: UploadFile) -> tuple[str, Path]:
    """
    Validate, deduplicate, and persist an uploaded file.

    Returns:
        (file_id, saved_path) tuple.

    Raises:
        HTTPException 400/413 on validation failure.
    """
    # ── Extension validation ─────────────────────────────────
    if not validate_extension(file.filename or ""):
        logger.warning("Rejected file with unsupported extension: %s", file.filename)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: pdf, jpg, png, tiff, bmp, webp, mp3, wav.",
        )

    # ── Read content + size check ────────────────────────────
    content: bytes = await file.read()
    if not validate_file_size(len(content)):
        logger.warning(
            "File too large: %s bytes (max %s)", len(content), MAX_FILE_SIZE_BYTES
        )
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum size of 50 MB.",
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # ── Generate unique ID ───────────────────────────────────
    file_id = generate_file_id(file.filename or "unknown")
    filename = safe_filename(file.filename or "unknown")
    dest: Path = UPLOADS_DIR / f"{file_id}_{filename}"

    # ── Persist to disk ──────────────────────────────────────
    async with aiofiles.open(dest, "wb") as f:
        await f.write(content)

    logger.info("Saved upload → %s  (%.2f KB, hash=%s)", dest.name, len(content) / 1024, get_file_hash(content)[:12])
    return file_id, dest


def detect_file_type(path: Path) -> str:
    """Return a simple category: 'pdf' | 'image' | 'audio' | 'unknown'."""
    ext = path.suffix.lower()
    if ext == ".pdf":
        return "pdf"
    if ext in {".jpg", ".jpeg", ".png", ".tiff", ".bmp", ".webp"}:
        return "image"
    if ext in {".mp3", ".wav", ".ogg", ".m4a"}:
        return "audio"
    return "unknown"
