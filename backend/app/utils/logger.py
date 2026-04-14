"""
logger.py — Structured logging utility for Offline AI Assistant Backend
"""

import logging
import sys
import io
from logging.handlers import RotatingFileHandler
from app.config.config import LOG_LEVEL, LOG_FILE

_fmt = "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s"
_date_fmt = "%Y-%m-%d %H:%M:%S"


def get_logger(name: str) -> logging.Logger:
    """Return a named logger pre-configured with console + rotating file handlers."""
    logger = logging.getLogger(name)

    if logger.handlers:          # avoid duplicate handlers on re-import
        return logger

    logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))

    formatter = logging.Formatter(_fmt, datefmt=_date_fmt)

    # Console handler — force UTF-8 on Windows to avoid charmap errors
    try:
        utf8_stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    except AttributeError:
        utf8_stdout = sys.stdout   # fallback (already wrapped, e.g. in tests)

    ch = logging.StreamHandler(utf8_stdout)
    ch.setFormatter(formatter)
    logger.addHandler(ch)

    # Rotating file handler (5 MB × 3 backups)
    fh = RotatingFileHandler(LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8")
    fh.setFormatter(formatter)
    logger.addHandler(fh)

    logger.propagate = False
    return logger
