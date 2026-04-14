# 🚀 Offline AI Assistant (Hybrid Graph RAG)

A **privacy-first offline AI assistant** that allows users to upload documents and ask intelligent questions using **Hybrid Retrieval-Augmented Generation (RAG)**.

This system combines **vector search (FAISS)** and **graph-based retrieval** to improve answer accuracy and provide **explainable AI with source references**.

---

## 🔥 Key Features

* 📄 Upload PDF / document files
* 🤖 Ask questions in natural language
* 🧠 Hybrid RAG (Vector + Graph Retrieval)
* 🔍 Explainable AI (shows source chunks)
* ⚡ Fast local inference using Ollama
* 🎯 Context-aware accurate answers
* 🧾 Clean formatted responses
* 🔄 Auto reset chat on new file upload
* 🚫 Fully offline (no external API)

---

## 🏗️ Architecture

```
Frontend (React + Tailwind)
        ↓
FastAPI Backend
        ↓
Embedding (MiniLM)
        ↓
FAISS Vector DB  +  Graph DB (NetworkX)
        ↓
Hybrid Retrieval (Vector + Graph)
        ↓
Ollama LLM (Local)
        ↓
Final Answer + Sources
```

---

## 🧠 How It Works

1. User uploads a document
2. Text is extracted (OCR fallback if needed)
3. Text is split into semantic chunks
4. Chunks are converted into embeddings
5. Stored in FAISS (vector index)
6. Graph relationships are built between chunks
7. Query is processed using:

   * Vector similarity search
   * Graph-based expansion
8. Retrieved context is passed to LLM
9. Final answer is generated with sources

---

## 🛠️ Tech Stack

### Frontend

* React
* Tailwind CSS
* Zustand (state management)

### Backend

* FastAPI
* FAISS (vector database)
* NetworkX (graph database)
* Sentence Transformers (embeddings)
* Ollama (local LLM)

---

## 📸 Screenshots


Example:

```
![Home](screenshots/home.png)
![Upload](screenshots/upload.png)
![Chat](screenshots/chat.png)
```

---

## ⚙️ Setup Instructions

### 1️⃣ Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

### 2️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Example Workflow

* Upload a PDF
* Ask: "What is primary key?"
* System retrieves relevant chunks
* Graph expands context
* LLM generates accurate answer
* Sources are displayed below response

---

## 🚀 Future Improvements

* 🎤 Voice input (speech-to-text)
* 📚 Multi-document querying
* 🔐 Authentication system
* 🐳 Docker deployment
* ⚡ Streaming responses

---

## 👨‍💻 Author

**Gowtham V**
Final Year Student | Full Stack AI Developer

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!

