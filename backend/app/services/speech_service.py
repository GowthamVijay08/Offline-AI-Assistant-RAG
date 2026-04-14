"""
speech_service.py — Audio → text using OpenAI Whisper (offline)
"""

from pathlib import Path

from app.config.config import WHISPER_MODEL_SIZE
from app.utils.logger import get_logger

logger = get_logger(__name__)

_whisper_model = None   # lazy singleton


def _get_model():
    """Lazy-load the Whisper model (downloaded on first call)."""
    global _whisper_model
    if _whisper_model is None:
        try:
            import whisper

            logger.info("Loading Whisper model: %s", WHISPER_MODEL_SIZE)
            _whisper_model = whisper.load_model(WHISPER_MODEL_SIZE)
            logger.info("Whisper model loaded successfully")
        except ImportError:
            logger.error("openai-whisper not installed. Run: pip install openai-whisper")
            raise
    return _whisper_model


def transcribe_audio(audio_path: Path) -> str:
    """
    Transcribe *audio_path* to text using Whisper (100% offline).

    Returns:
        Transcribed text string.
    """
    logger.info("Transcribing audio: %s", audio_path.name)
    model = _get_model()
    result: dict = model.transcribe(str(audio_path), fp16=False)
    text: str = result.get("text", "").strip()
    logger.debug("Transcription length: %d characters", len(text))
    return text
