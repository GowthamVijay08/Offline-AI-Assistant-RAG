# Offline AI Assistant — Backend

A **production-ready, modular FastAPI backend** with Hybrid RAG (FAISS + GraphRAG), multimodal ingestion (PDF, image, optional audio), and offline LLM inference via llama.cpp.

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── config/
│   │   └── config.py          ← All settings (model paths, limits, …)
│   ├── models/
│   │   └── schemas.py         ← Pydantic request & response models
│   ├── routes/
│   │   ├── upload.py          ← POST /upload
│   │   ├── query.py           ← POST /query
│   │   └── health.py          ← GET  /health
│   ├── services/
│   │   ├── file_service.py    ← Validation & persistence
│   │   ├── ocr_service.py     ← Tesseract / EasyOCR
│   │   ├── speech_service.py  ← Whisper transcription
│   │   ├── embedding_service.py ← Sentence Transformers
│   │   ├── vector_service.py  ← FAISS CRUD
│   │   ├── graph_service.py   ← SQLite graph (nodes + edges)
│   │   ├── retrieval_service.py ← Hybrid retrieval + reranking
│   │   └── llm_service.py     ← llama.cpp inference
│   ├── pipeline/
│   │   └── pipeline.py        ← Full ingestion & query orchestrators
│   ├── utils/
│   │   ├── logger.py
│   │   ├── text_utils.py
│   │   └── file_utils.py
│   └── main.py                ← FastAPI app factory
├── data/
│   ├── uploads/               ← Raw uploaded files
│   ├── faiss_index/           ← FAISS index + metadata
│   └── graph.db               ← SQLite graph database
├── models/                    ← Place your GGUF model here
├── logs/                      ← Rotating log files
├── run.py                     ← Dev server entry point
├── requirements.txt
└── .env.example
```

---

## 🚀 Quick Start

### 1. Create & activate virtual environment

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> **llama-cpp-python** (LLM) requires a C++ build toolchain.  
> Windows: install [Build Tools for Visual Studio](https://visualstudio.microsoft.com/visual-cpp-build-tools/).  
> Then: `pip install llama-cpp-python`

> **Tesseract OCR** binary must be installed separately:  
> Windows: https://github.com/UB-Mannheim/tesseract/wiki

### 3. Set up environment

```bash
copy .env.example .env   # Windows
# or
cp .env.example .env     # Linux/macOS
```

Edit `.env` and set `LLM_MODEL_PATH` to your GGUF model file.

> **Download a free GGUF model** from Hugging Face, e.g.:  
> `Mistral-7B-Instruct-v0.2.Q4_K_M.gguf` — place it in `backend/models/`

### 4. Start the server

```bash
python run.py
```

API available at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

---

## 🔌 API Endpoints

| Method | Endpoint  | Description                          |
|--------|-----------|--------------------------------------|
| GET    | `/`       | Root info                            |
| GET    | `/health` | Liveness probe + FAISS / graph stats |
| POST   | `/upload` | Upload & ingest a file               |
| POST   | `/query`  | Ask a question about your documents  |

### Upload example (curl)

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@/path/to/document.pdf"
```

### Query example (curl)

```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the main conclusion?", "file_id": "document_ab12cd34"}'
```

---

## ⚙️ Configuration

All settings live in `app/config/config.py` and can be overridden via environment variables (`.env`):

| Variable              | Default                              | Description                    |
|-----------------------|--------------------------------------|--------------------------------|
| `LLM_MODEL_PATH`      | `models/llama-model.gguf`            | Path to GGUF model             |
| `EMBEDDING_MODEL_NAME`| `all-MiniLM-L6-v2`                   | Sentence Transformers model    |
| `WHISPER_MODEL_SIZE`  | `base`                               | Whisper model size             |
| `OCR_ENGINE`          | `tesseract`                          | `tesseract` or `easyocr`       |
| `CHUNK_SIZE`          | `512`                                | Characters per chunk           |
| `TOP_K_RETRIEVAL`     | `5`                                  | Vector search top-k            |
| `MAX_FILE_SIZE_BYTES` | `52428800` (50 MB)                   | Upload size limit              |
| `CORS_ORIGINS`        | `http://localhost:5173,...`          | Allowed frontend origins       |

---

## 🧠 AI Pipeline

```
File Upload
    │
    ▼
Text Extraction  ──PDF──►  PyMuPDF / pdfplumber
                 ──IMG──►  Tesseract / EasyOCR
                 ──AUD──►  Whisper (offline)
    │
    ▼
Clean & Chunk  (sliding window, configurable size + overlap)
    │
    ▼
Embed  (Sentence Transformers — all-MiniLM-L6-v2)
    │
    ├──► FAISS IndexFlatIP  (vector storage)
    └──► SQLite Graph       (nodes + sequential + semantic edges)

Query
    │
    ▼
Embed Query
    │
    ▼
Hybrid Retrieval
    ├── FAISS top-k
    └── Graph neighbour expansion
    │
    ▼
Rerank by combined score
    │
    ▼
Build Context
    │
    ▼
llama.cpp LLM → Answer
```

---

## 🛡️ Security & Performance

- File type validation (extension allow-list)
- 50 MB upload limit
- Input sanitisation via Pydantic
- Embedding cache (MD5-keyed, avoids re-embedding identical text)
- FAISS `IndexFlatIP` on L2-normalised vectors (cosine similarity)
- SQLite WAL mode for concurrent reads
- Rotating log files (5 MB × 3 backups)
