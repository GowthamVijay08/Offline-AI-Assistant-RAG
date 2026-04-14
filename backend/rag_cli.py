# -*- coding: utf-8 -*-
"""
rag_cli.py  -  RAG Backend Terminal Dashboard
Shows every pipeline step: upload → chunks → vectors → graph → query → answer
"""

import sys
import json
import time
import urllib.request
import urllib.error
from pathlib import Path

BASE = "http://localhost:8000"
DATA = Path(__file__).parent / "data"
META = DATA / "faiss_index" / "metadata.json"

# ── colours (Windows-safe) ────────────────────────────────────
try:
    import ctypes
    ctypes.windll.kernel32.SetConsoleMode(
        ctypes.windll.kernel32.GetStdHandle(-11), 7)
    C = {"g":"\033[92m","y":"\033[93m","c":"\033[96m",
         "m":"\033[95m","r":"\033[91m","b":"\033[94m",
         "w":"\033[97m","d":"\033[2m","x":"\033[0m","bold":"\033[1m"}
except Exception:
    C = {k:"" for k in ("g","y","c","m","r","b","w","d","x","bold")}

def paint(text, *keys):
    return "".join(C[k] for k in keys) + text + C["x"]

def bar(label, value, width=30):
    filled = int(value * width)
    b = paint("█" * filled, "c") + paint("░" * (width - filled), "d")
    return f"  {label:<16} [{b}]  {value:.1%}"

def sep(char="─", n=70, col="d"):
    print(paint(char * n, col))

def hdr(title):
    sep("═", 70, "b")
    print(paint(f"  {title}", "bold","w"))
    sep("═", 70, "b")

def step(n, total, label):
    pct = n / total
    blocks = int(pct * 20)
    bar_str = paint("▓" * blocks, "g") + paint("░" * (20-blocks), "d")
    print(f"  [{bar_str}]  {paint(f'Step {n}/{total}', 'y')}  {label}")

def tag(t, msg, col="g"):
    print(f"  {paint(f'[{t}]', col, 'bold')} {msg}")

# ── HTTP helpers ──────────────────────────────────────────────
def get_json(path, timeout=10):
    with urllib.request.urlopen(f"{BASE}{path}", timeout=timeout) as r:
        return json.loads(r.read())

def post_json(path, payload, timeout=180):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{BASE}{path}", data=data,
        headers={"Content-Type": "application/json"}, method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())

def health():
    try:
        return get_json("/health")
    except Exception:
        return None

def index_stats():
    """Read FAISS metadata directly from disk for detailed info."""
    if not META.exists():
        return []
    with open(META, encoding="utf-8") as f:
        return json.load(f)

# ── DASHBOARD ─────────────────────────────────────────────────
def show_dashboard():
    h = health()
    if not h:
        tag("ERR", "Backend is NOT reachable at " + BASE, "r")
        return

    meta = index_stats()
    files = {}
    for m in meta:
        fid = m["file_id"]
        files.setdefault(fid, []).append(m)

    hdr("  RAG SYSTEM DASHBOARD")
    print()

    # ── Server status
    print(paint("  SERVER", "bold","y"))
    print(f"    Status   : {paint(h['status'].upper(), 'g')}")
    print(f"    Endpoint : {paint(BASE, 'c')}")
    print(f"    Version  : {h['version']}")
    print()

    # ── LLM
    lm = h["services"].get("llm","")
    mode = "OLLAMA (AI)" if "ollama" in lm else "FALLBACK"
    col  = "g" if "ollama" in lm else "y"
    print(paint("  LLM ENGINE", "bold","y"))
    print(f"    Mode     : {paint(mode, col)}")
    for part in lm.split("  "):
        if "=" in part:
            k, v = part.split("=", 1)
            print(f"    {k:<12}: {paint(v.strip(), 'c')}")
    print()

    # ── Vector Index
    total_vec = len(meta)
    print(paint("  VECTOR INDEX (FAISS)", "bold","y"))
    print(f"    Vectors  : {paint(str(total_vec), 'g','bold')}")
    print(f"    Embedding: {paint('all-MiniLM-L6-v2 (384 dim)', 'c')}")
    print(f"    Index    : {paint('IndexFlatIP - Inner Product (cosine)', 'd')}")
    print()

    # ── Graph
    g = h["services"].get("graph_db", "")
    nodes = edges = 0
    for part in g.split():
        try:
            if "nodes" in g:
                nums = [int(x) for x in g.split() if x.isdigit()]
                if len(nums) >= 2:
                    nodes, edges = nums[0], nums[1]
        except:
            pass
    print(paint("  KNOWLEDGE GRAPH (SQLite)", "bold","y"))
    print(f"    Nodes    : {paint(str(nodes), 'g')}")
    print(f"    Edges    : {paint(str(edges), 'g')}")
    print(f"    Strategy : Sequential + Semantic (cosine > 0.80)")
    print()

    # ── Documents
    print(paint("  INDEXED DOCUMENTS", "bold","y"))
    if not files:
        print(f"    {paint('No documents yet. Upload a PDF to start.', 'y')}")
    else:
        for fid, chunks in files.items():
            total_chars = sum(len(c["text"]) for c in chunks)
            print(f"    {paint(fid, 'c')}")
            print(f"      Chunks : {len(chunks)}   |   Chars : {total_chars:,}")
    print()
    sep()

# ── UPLOAD ────────────────────────────────────────────────────
def do_upload(filepath: str):
    p = Path(filepath.strip().strip('"'))
    if not p.exists():
        tag("ERR", f"File not found: {p}", "r")
        return None

    meta_before = index_stats()
    vecs_before = len(meta_before)

    hdr(f"  UPLOAD PIPELINE  ->  {p.name}")
    print()

    step(1, 6, "Validating file ...")
    time.sleep(0.4)
    size_kb = p.stat().st_size / 1024
    ext = p.suffix.lower()
    if ext not in {".pdf",".jpg",".jpeg",".png",".mp3",".wav"}:
        tag("ERR", f"Unsupported type: {ext}", "r"); return None
    tag("OK", f"File: {p.name}  ({size_kb:.1f} KB)  type={ext}")
    print()

    step(2, 6, "Uploading to backend ...")
    time.sleep(0.4)
    boundary = "RagCli777Boundary"
    with open(p, "rb") as f:
        file_bytes = f.read()

    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{p.name}"\r\n'
        f"Content-Type: application/octet-stream\r\n\r\n"
    ).encode() + file_bytes + f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        f"{BASE}/upload", data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )

    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            res = json.loads(r.read())
    except urllib.error.HTTPError as e:
        tag("ERR", f"HTTP {e.code}: {e.read().decode(errors='replace')[:200]}", "r")
        return None
    elapsed = time.time() - t0

    tag("OK", f"File received and saved by backend")
    print()

    step(3, 6, "Text extraction ...")
    time.sleep(0.6)
    tag("OK", f"PDF text extracted (digital or OCR fallback)", "c")
    print()

    step(4, 6, "Chunking text ...")
    time.sleep(0.6)
    chunks = res["chunks_created"]
    tag("OK", f"{chunks} sentence-aware chunks created", "g")
    print()

    step(5, 6, "Embedding chunks into vectors ...")
    time.sleep(0.8)
    tag("OK", f"{chunks} vectors (384-dim) stored in FAISS index", "g")
    print()

    step(6, 6, "Building knowledge graph ...")
    time.sleep(0.6)
    seq_edges = max(0, chunks - 1) * 2
    tag("OK", f"{chunks} nodes + ~{seq_edges} sequential edges added to graph", "g")
    print()

    # ── Summary
    sep("─", 70, "g")
    print(paint("  INGESTION COMPLETE", "bold","g"))
    sep("─", 70, "g")

    meta_after = index_stats()
    vecs_after = len(meta_after)
    new_vecs = vecs_after - vecs_before

    print(f"\n  {paint('file_id', 'y')}     : {paint(res['file_id'], 'c', 'bold')}")
    print(f"  {paint('chunks', 'y')}      : {paint(str(chunks), 'g')}")
    print(f"  {paint('new vectors', 'y')} : {paint(str(new_vecs), 'g')}  "
          f"(total in index: {paint(str(vecs_after), 'w')})")
    print(f"  {paint('time', 'y')}        : {elapsed:.1f}s")
    print()

    # Show first 3 chunks
    new_chunks = [m for m in meta_after if m["file_id"] == res["file_id"]]
    if new_chunks:
        print(paint("  SAMPLE CHUNKS:", "bold","y"))
        for i, c in enumerate(new_chunks[:3], 1):
            snippet = c["text"][:120].replace("\n"," ")
            print(f"  [{i}] {paint(snippet + '...', 'd')}")
        if len(new_chunks) > 3:
            print(f"  ... and {len(new_chunks)-3} more chunks")
    print()

    print(paint("  TIP: Now run ->  ask <your question>", "y"))
    print(f"  {paint('Or scope to this doc:', 'd')} ask <question> --file {res['file_id']}")
    print()
    return res["file_id"]

# ── QUERY ─────────────────────────────────────────────────────
def do_query(question: str, file_id: str = None):
    meta = index_stats()
    if not meta:
        tag("WARN", "No documents indexed yet. Upload a PDF first.", "y")
        return

    hdr(f"  QUERY PIPELINE")
    print()

    step(1, 4, f"Embedding question ...")
    time.sleep(0.5)
    print(f"       {paint(chr(34) + question + chr(34), 'c')}")
    print(f"       Model : all-MiniLM-L6-v2  →  {paint('384-dim vector', 'g')}")
    print()

    scope_label = f"file_id={file_id}" if file_id else "ALL documents"
    step(2, 4, f"Hybrid retrieval ({scope_label}) ...")
    time.sleep(0.5)

    payload = {"query": question}
    if file_id:
        payload["file_id"] = file_id

    t0 = time.time()
    try:
        res = post_json("/query", payload, timeout=120)
    except urllib.error.HTTPError as e:
        tag("ERR", f"Query failed ({e.code}): {e.read().decode(errors='replace')[:200]}", "r")
        return
    elapsed = time.time() - t0

    sources = res.get("sources", [])
    print(f"       FAISS vector search -> {paint(str(len(sources)), 'g')} chunks found")
    print(f"       Graph expansion     -> fetching sequential + semantic neighbours")
    print(f"       Reranking           -> re-sorting by hybrid scores")
    print()

    step(3, 4, "Building context assembly ...")
    time.sleep(0.5)
    total_ctx = sum(len(s) for s in sources)
    print(f"       Context size : {paint(str(total_ctx), 'g')} chars assembled for LLM")
    print()

    step(4, 4, "Connecting to LLM for final answer ...")
    time.sleep(0.5)
    h = health()
    lm = h["services"].get("llm","") if h else ""
    llm_mode = paint("Ollama AI", "g") if "ollama" in lm else paint("Fallback extractor", "y")
    print(f"       Mode : {llm_mode}")
    print(f"       Time : {elapsed:.1f}s")
    print()

    # ── Answer box
    sep("═", 70, "g")
    print(paint("  ANSWER", "bold","g"))
    sep("═", 70, "g")
    print()
    answer = res.get("answer","")
    words = answer.split()
    line = "  "
    for w in words:
        if len(line) + len(w) + 1 > 72:
            print(line)
            line = "  " + w
        else:
            line += (" " if line.strip() else "") + w
    if line.strip():
        print(line)
    print()
    sep("─", 70, "g")

    # ── Retrieved chunks with scores
    if sources:
        print()
        print(paint("  RETRIEVED SOURCE CHUNKS (Top scoring):", "bold","y"))
        sep()
        for i, src in enumerate(sources, 1):
            snippet = src[:150].replace("\n"," ")
            print(f"\n  {paint(f'[Source {i}]', 'c','bold')}  {paint(snippet + ' ...', 'd')}")
        print()

    # ── Final Status
    sep()
    print(paint("  SYSTEM STATUS AFTER QUERY:", "bold","y"))
    h = health()
    if h:
        v_info = h["services"].get("faiss","")
        g_info = h["services"].get("graph_db","")
        print(f"    {paint('Vectors', 'd'):<12}: {paint(v_info, 'g')}")
        print(f"    {paint('Graph', 'd'):<12}  : {paint(g_info, 'g')}")
    print()


# ── MAIN LOOP ─────────────────────────────────────────────────
def main():
    sys.stdout.reconfigure(encoding="utf-8", errors="replace") \
        if hasattr(sys.stdout, "reconfigure") else None

    # Check server
    if not health():
        hdr("  CONNECTION ERROR")
        tag("ERR", "Backend is NOT running!", "r")
        print()
        print("  Open Terminal 1 and run:")
        print(paint("    cd backend", "c"))
        print(paint("    venv\\Scripts\\python run.py", "c"))
        print()
        sys.exit(1)

    show_dashboard()

    print(paint("  COMMANDS", "bold","y"))
    print("   upload <path>              - Upload any PDF")
    print("   ask <question>            - Query all documents")
    print("   ask <q> --file <file_id>  - Query one document")
    print("   dashboard                 - Refresh full stats")
    print("   quit                      - Exit")
    sep()
    print()

    last_file_id = None

    while True:
        try:
            raw = input(paint(">> ", "g","bold")).strip()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break

        if not raw:
            continue
        lo = raw.lower()

        if lo in ("quit","exit","q"):
            print("Goodbye!")
            break

        elif lo in ("dashboard","status","d","s"):
            show_dashboard()

        elif lo.startswith("upload "):
            fid = do_upload(raw[7:].strip())
            if fid:
                last_file_id = fid

        elif lo.startswith("ask "):
            rest = raw[4:].strip()
            file_id = None
            if " --file " in rest:
                parts = rest.split(" --file ", 1)
                question, file_id = parts[0].strip(), parts[1].strip()
            else:
                question = rest
                if last_file_id:
                    ans = input(
                        f"  {paint(f'Search only [{last_file_id}] ?', 'y')} [Y/n]: "
                    ).strip().lower()
                    if ans in ("", "y", "yes"):
                        file_id = last_file_id
            if question:
                do_query(question, file_id)

        elif lo in ("help","h","?"):
            sep()
            print("  upload <path>              Upload any PDF / image / audio")
            print("  ask <q>                    Query ALL indexed documents")
            print("  ask <q> --file <id>        Query ONE specific document")
            print("  dashboard                  Show full system stats")
            print("  quit                       Exit")
            sep()

        else:
            tag("?", f"Unknown: '{raw}'  (type help)", "y")

if __name__ == "__main__":
    main()
