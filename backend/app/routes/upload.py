"""
upload.py — POST /upload route

CPU-heavy ingestion runs in a thread-pool executor so FastAPI stays
responsive while large PDFs are being processed.
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, UploadFile, File, HTTPException, status

from app.models.schemas import UploadResponse, ErrorResponse
from app.services.file_service import save_upload
from app.pipeline.pipeline import ingest_file
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/upload", tags=["Upload"])

# Dedicated pool for CPU-bound ingestion (embedding, FAISS, graph building)
_executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="ingest")


@router.post(
    "",
    response_model=UploadResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid file or extraction error"},
        413: {"model": ErrorResponse, "description": "File too large (max 50 MB)"},
        500: {"model": ErrorResponse, "description": "Server-side processing error"},
    },
    summary="Upload any PDF, image, or audio file and ingest it",
)
async def upload_file(
    file: UploadFile = File(..., description="PDF, image, or audio (max 50 MB)"),
):
    """
    **Upload & Ingest — supports ANY PDF (digital or scanned)**

    Steps:
    1. Validate file type and size.
    2. Save to disk and generate a unique `file_id`.
    3. Extract text:
       - **PDF** → embedded text first; OCR every page if text is sparse.
       - **Image** → Tesseract / EasyOCR.
       - **Audio** → Whisper speech-to-text.
    4. Clean, chunk (sentence-aware), embed, and index into FAISS + graph DB.

    Returns the `file_id` you can use to scope `/query` to this document.
    Leave `file_id` blank in `/query` to search all uploaded documents.
    """
    logger.info("Upload: filename=%s  content_type=%s", file.filename, file.content_type)

    try:
        # Save & validate
        file_id, file_path = await save_upload(file)

        # Run ingestion in thread-pool (never blocks the event loop)
        loop   = asyncio.get_event_loop()
        chunks = await loop.run_in_executor(_executor, ingest_file, file_id, file_path)

        logger.info("Ingest complete: file_id=%s  chunks=%d", file_id, chunks)
        return UploadResponse(
            status="success",
            file_id=file_id,
            message=(
                f"'{file.filename}' processed — {chunks} chunks indexed. "
                f"Use file_id='{file_id}' to query only this document, "
                "or omit file_id to search all documents."
            ),
            chunks_created=chunks,
        )

    except HTTPException:
        raise
    except ValueError as exc:
        logger.warning("Validation/extraction error: %s", exc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except RuntimeError as exc:
        logger.error("Runtime ingestion error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        )
    except Exception as exc:
        logger.error("Unexpected upload error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload processing failed: {exc}",
        )
