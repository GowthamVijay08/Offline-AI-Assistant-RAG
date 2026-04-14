"""
graph_service.py — SQLite-backed graph of chunk nodes and semantic edges.

Schema
------
nodes  (chunk_id TEXT PK, file_id TEXT, text TEXT, created_at TEXT)
edges  (src TEXT, dst TEXT, weight REAL, PRIMARY KEY(src, dst))
"""

import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional

from app.config.config import GRAPH_DB_PATH, GRAPH_TOP_K
from app.utils.logger import get_logger

logger = get_logger(__name__)

_local = threading.local()   # per-thread SQLite connections


# ─────────────────────────────────────────────
# Connection management
# ─────────────────────────────────────────────

def _get_conn() -> sqlite3.Connection:
    """Return a thread-local SQLite connection, creating it if needed."""
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(str(GRAPH_DB_PATH), check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA synchronous=NORMAL")
        _init_schema(_local.conn)
    return _local.conn


@contextmanager
def _cursor():
    conn = _get_conn()
    cur = conn.cursor()
    try:
        yield cur
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def _init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS nodes (
            chunk_id   TEXT PRIMARY KEY,
            file_id    TEXT NOT NULL,
            text       TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS edges (
            src    TEXT NOT NULL,
            dst    TEXT NOT NULL,
            weight REAL NOT NULL DEFAULT 1.0,
            PRIMARY KEY (src, dst),
            FOREIGN KEY (src) REFERENCES nodes(chunk_id),
            FOREIGN KEY (dst) REFERENCES nodes(chunk_id)
        );

        CREATE INDEX IF NOT EXISTS idx_nodes_file ON nodes (file_id);
        CREATE INDEX IF NOT EXISTS idx_edges_src   ON edges (src);
        CREATE INDEX IF NOT EXISTS idx_edges_dst   ON edges (dst);
        """
    )
    conn.commit()
    logger.debug("Graph schema initialised")


# ─────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────

def add_nodes(file_id: str, chunk_ids: list[str], texts: list[str]) -> None:
    """Insert chunk nodes for a given file."""
    now = datetime.now(timezone.utc).isoformat()
    rows = [(cid, file_id, text, now) for cid, text in zip(chunk_ids, texts)]
    with _cursor() as cur:
        cur.executemany(
            "INSERT OR REPLACE INTO nodes (chunk_id, file_id, text, created_at) VALUES (?,?,?,?)",
            rows,
        )
    logger.debug("Inserted %d nodes for file_id=%s", len(rows), file_id)


def add_edges(chunk_ids: list[str], similarities: Optional[list[tuple[int, int, float]]] = None) -> None:
    """
    Add edges between consecutive chunks (and optionally high-similarity pairs).

    Args:
        chunk_ids:    Ordered list of chunk IDs for the file.
        similarities: Optional list of (i, j, weight) tuples for semantic edges.
    """
    rows: list[tuple] = []

    # Sequential edges (prev → next)
    for i in range(len(chunk_ids) - 1):
        rows.append((chunk_ids[i], chunk_ids[i + 1], 1.0))
        rows.append((chunk_ids[i + 1], chunk_ids[i], 1.0))  # bidirectional

    # Semantic similarity edges
    if similarities:
        for i, j, w in similarities:
            if i != j:
                rows.append((chunk_ids[i], chunk_ids[j], float(w)))

    with _cursor() as cur:
        cur.executemany(
            "INSERT OR REPLACE INTO edges (src, dst, weight) VALUES (?,?,?)",
            rows,
        )
    logger.debug("Inserted %d edges", len(rows))


def get_neighbours(chunk_id: str, top_k: int = GRAPH_TOP_K) -> list[dict]:
    """
    Return the top-k graph neighbours of *chunk_id* sorted by edge weight.

    Returns:
        List of dicts: {chunk_id, file_id, text, weight}.
    """
    sql = """
        SELECT n.chunk_id, n.file_id, n.text, e.weight
        FROM   edges e
        JOIN   nodes n ON n.chunk_id = e.dst
        WHERE  e.src = ?
        ORDER BY e.weight DESC
        LIMIT  ?
    """
    with _cursor() as cur:
        cur.execute(sql, (chunk_id, top_k))
        rows = cur.fetchall()

    return [dict(r) for r in rows]


def get_chunks_by_file(file_id: str) -> list[dict]:
    """Return all chunk nodes for a given file."""
    with _cursor() as cur:
        cur.execute(
            "SELECT chunk_id, file_id, text FROM nodes WHERE file_id = ? ORDER BY created_at",
            (file_id,),
        )
        return [dict(r) for r in cur.fetchall()]


def get_graph_stats() -> dict:
    with _cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM nodes")
        n_nodes = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM edges")
        n_edges = cur.fetchone()[0]
        cur.execute("SELECT COUNT(DISTINCT file_id) FROM nodes")
        n_files = cur.fetchone()[0]
    return {"nodes": n_nodes, "edges": n_edges, "files": n_files}
