"""
file_utils.py — File validation and identifier helpers
"""

import hashlib
import uuid
from pathlib import Path

from app.config.config import MAX_FILE_SIZE_BYTES, ALLOWED_EXTENSIONS
from app.utils.logger import get_logger

logger = get_logger(__name__)


def generate_file_id(filename: str) -> str:
    """Return a unique file identifier (UUID4 + sanitised stem)."""
    stem = Path(filename).stem[:32].replace(" ", "_")
    return f"{stem}_{uuid.uuid4().hex[:8]}"


def validate_extension(filename: str) -> bool:
    """Return True if the file extension is in the allow-list."""
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS


def validate_file_size(size_bytes: int) -> bool:
    """Return True if the file size is within the configured limit."""
    return size_bytes <= MAX_FILE_SIZE_BYTES


def get_file_hash(file_bytes: bytes) -> str:
    """Return SHA-256 hex digest of file content (for deduplication)."""
    return hashlib.sha256(file_bytes).hexdigest()


def safe_filename(filename: str) -> str:
    """Sanitise a filename — strip directories and replace spaces."""
    name = Path(filename).name
    return name.replace(" ", "_")
