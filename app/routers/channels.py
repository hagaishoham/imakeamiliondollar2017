from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import get_db

router = APIRouter(prefix="/api/channels", tags=["channels"])


class ChannelCreate(BaseModel):
    name: str
    youtube_channel_url: str = ""
    podcast_title: str
    podcast_description: str = ""
    podcast_author: str = ""
    podcast_email: str = ""
    podcast_language: str = "he"
    podcast_image_url: str = ""
    spotify_podcast_url: str = ""


class ChannelUpdate(BaseModel):
    name: str | None = None
    youtube_channel_url: str | None = None
    podcast_title: str | None = None
    podcast_description: str | None = None
    podcast_author: str | None = None
    podcast_email: str | None = None
    podcast_language: str | None = None
    podcast_image_url: str | None = None
    spotify_podcast_url: str | None = None


@router.get("")
def list_channels():
    with get_db() as db:
        rows = db.execute("SELECT * FROM channels ORDER BY created_at DESC").fetchall()
        return [dict(row) for row in rows]


@router.post("")
def create_channel(channel: ChannelCreate):
    with get_db() as db:
        cursor = db.execute(
            """INSERT INTO channels
               (name, youtube_channel_url, podcast_title, podcast_description,
                podcast_author, podcast_email, podcast_language, podcast_image_url,
                spotify_podcast_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (channel.name, channel.youtube_channel_url, channel.podcast_title,
             channel.podcast_description, channel.podcast_author, channel.podcast_email,
             channel.podcast_language, channel.podcast_image_url, channel.spotify_podcast_url),
        )
        channel_id = cursor.lastrowid
        row = db.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()
        return dict(row)


@router.get("/{channel_id}")
def get_channel(channel_id: int):
    with get_db() as db:
        row = db.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Channel not found")
        return dict(row)


@router.put("/{channel_id}")
def update_channel(channel_id: int, update: ChannelUpdate):
    with get_db() as db:
        existing = db.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Channel not found")

        updates = {k: v for k, v in update.model_dump().items() if v is not None}
        if not updates:
            return dict(existing)

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [channel_id]
        db.execute(f"UPDATE channels SET {set_clause} WHERE id = ?", values)

        row = db.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()
        return dict(row)


@router.delete("/{channel_id}")
def delete_channel(channel_id: int):
    with get_db() as db:
        existing = db.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Channel not found")
        db.execute("DELETE FROM episodes WHERE channel_id = ?", (channel_id,))
        db.execute("DELETE FROM channels WHERE id = ?", (channel_id,))
        return {"message": "Channel deleted"}
