"""
test_upload.py — Integration tests for POST /upload
"""

import io
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture()
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_upload_missing_file(client):
    response = await client.post("/upload")
    assert response.status_code == 422   # unprocessable entity — no file


@pytest.mark.asyncio
async def test_upload_invalid_extension(client):
    file_data = io.BytesIO(b"dummy content")
    response = await client.post(
        "/upload",
        files={"file": ("test.exe", file_data, "application/octet-stream")},
    )
    assert response.status_code == 400
    assert response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_empty_file(client):
    file_data = io.BytesIO(b"")
    response = await client.post(
        "/upload",
        files={"file": ("empty.pdf", file_data, "application/pdf")},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "services" in data


@pytest.mark.asyncio
async def test_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json()["version"] == "1.0.0"
