import sqlite3
from contextlib import contextmanager
from app.config import DB_PATH


def init_db():
    """Initialize the database with all required tables."""
    with get_db() as db:
        db.executescript("""
            CREATE TABLE IF NOT EXISTS channels (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                youtube_channel_url TEXT,
                podcast_title TEXT NOT NULL,
                podcast_description TEXT DEFAULT '',
                podcast_author TEXT DEFAULT '',
                podcast_email TEXT DEFAULT '',
                podcast_language TEXT DEFAULT 'he',
                podcast_image_url TEXT DEFAULT '',
                spotify_podcast_url TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS episodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                channel_id INTEGER NOT NULL,
                youtube_url TEXT NOT NULL,
                youtube_title TEXT DEFAULT '',
                transcript TEXT DEFAULT '',
                summary TEXT DEFAULT '',
                audio_filename TEXT DEFAULT '',
                audio_duration_seconds INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                error_message TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                processed_at TIMESTAMP,
                FOREIGN KEY (channel_id) REFERENCES channels(id)
            );
        """)


@contextmanager
def get_db():
    """Get a database connection as a context manager."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
