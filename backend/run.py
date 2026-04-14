"""
run.py — Server entry point for Offline AI Assistant Backend

NOTE: `reload=False` is intentional.
  Hot-reload wipes in-memory singletons (FAISS index, embedding model, LLM).
  Only turn reload=True during pure development when you do NOT need persistent data.
"""

import os
import uvicorn

# Force UTF-8 on Windows console to avoid charmap encoding errors
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=False,          # keep False — hot-reload wipes in-memory FAISS index
        log_level="info",
    )
