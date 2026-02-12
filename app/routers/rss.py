from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.database import get_db
from app.services.podcast import generate_rss_feed

router = APIRouter(tags=["rss"])


@router.get("/rss/{channel_id}")
def get_rss_feed(channel_id: int):
    """
    Get the RSS feed for a channel.
    Submit this URL to Spotify for Podcasters to distribute your podcast.
    """
    with get_db() as db:
        channel = db.execute("SELECT * FROM channels WHERE id = ?", (channel_id,)).fetchone()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")

        episodes = db.execute(
            "SELECT * FROM episodes WHERE channel_id = ? ORDER BY created_at DESC",
            (channel_id,),
        ).fetchall()

    rss_xml = generate_rss_feed(dict(channel), [dict(ep) for ep in episodes])
    return Response(content=rss_xml, media_type="application/rss+xml")
