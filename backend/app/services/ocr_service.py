"""
ocr_service.py — Image → text via Tesseract or EasyOCR
"""

from pathlib import Path

from app.config.config import OCR_ENGINE, TESSERACT_CMD
from app.utils.logger import get_logger

logger = get_logger(__name__)


def extract_text_from_image(image_path: Path) -> str:
    """
    Run OCR on *image_path* and return extracted text.

    Engine is selected by ``OCR_ENGINE`` config key:
    - ``"tesseract"``  — uses pytesseract (requires Tesseract binary)
    - ``"easyocr"``    — uses EasyOCR (GPU optional, slower first call)
    """
    engine = OCR_ENGINE.lower()
    logger.info("Running OCR (%s) on: %s", engine, image_path.name)

    if engine == "easyocr":
        return _easyocr(image_path)
    return _tesseract(image_path)


def _tesseract(image_path: Path) -> str:
    try:
        import pytesseract
        from PIL import Image

        pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
        img = Image.open(image_path)
        text: str = pytesseract.image_to_string(img)
        logger.debug("Tesseract returned %d characters", len(text))
        return text
    except ImportError:
        logger.error("pytesseract / Pillow not installed. Run: pip install pytesseract Pillow")
        raise
    except Exception as exc:
        logger.error("Tesseract OCR failed: %s", exc)
        raise


def _easyocr(image_path: Path) -> str:
    try:
        import easyocr

        reader = easyocr.Reader(["en"], gpu=False)
        results: list = reader.readtext(str(image_path), detail=0)
        text = "\n".join(results)
        logger.debug("EasyOCR returned %d characters", len(text))
        return text
    except ImportError:
        logger.error("easyocr not installed. Run: pip install easyocr")
        raise
    except Exception as exc:
        logger.error("EasyOCR failed: %s", exc)
        raise
