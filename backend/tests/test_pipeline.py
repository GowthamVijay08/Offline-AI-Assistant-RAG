"""
test_pipeline.py — Unit tests for text utilities and chunking
"""

import pytest
from app.utils.text_utils import clean_text, chunk_text
from app.utils.file_utils import validate_extension, validate_file_size, generate_file_id


# ── clean_text ────────────────────────────────────────────

def test_clean_text_basic():
    raw = "Hello   World\n\n\n\nNext paragraph"
    result = clean_text(raw)
    assert "   " not in result
    assert result.count("\n") <= 2


def test_clean_text_strips():
    assert clean_text("  hello  ") == "hello"


# ── chunk_text ────────────────────────────────────────────

def test_chunk_text_produces_chunks():
    text = "A" * 1000
    chunks = chunk_text(text, chunk_size=100, overlap=10)
    assert len(chunks) > 1
    assert all(len(c) <= 100 for c in chunks)


def test_chunk_text_overlap():
    # With overlap, adjacent chunks should share characters
    text = "abcdefghijklmnopqrstuvwxyz" * 10
    chunks = chunk_text(text, chunk_size=10, overlap=3)
    for i in range(len(chunks) - 1):
        # The tail of chunk[i] should appear at the start of chunk[i+1]
        shared = chunks[i][-3:]
        assert chunks[i + 1].startswith(shared)


def test_chunk_text_short_input():
    text = "Hello world"
    chunks = chunk_text(text, chunk_size=512, overlap=64)
    assert len(chunks) == 1
    assert chunks[0] == text


# ── file_utils ────────────────────────────────────────────

def test_validate_extension_allowed():
    assert validate_extension("report.pdf")
    assert validate_extension("photo.png")
    assert validate_extension("audio.mp3")


def test_validate_extension_rejected():
    assert not validate_extension("malware.exe")
    assert not validate_extension("script.sh")


def test_validate_file_size():
    assert validate_file_size(1024)
    assert validate_file_size(50 * 1024 * 1024)          # exactly 50 MB
    assert not validate_file_size(50 * 1024 * 1024 + 1)  # 1 byte over


def test_generate_file_id_unique():
    id1 = generate_file_id("test.pdf")
    id2 = generate_file_id("test.pdf")
    assert id1 != id2
    assert "test" in id1
