import asyncio
import traceback
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.config import AUDIO_DIR, TRANSCRIPTS_DIR
from app.database import get_db
from app.services.youtube import extract_video_id, get_video_info, get_transcript
from app.services.transcription import transcribe_audio, summarize_transcript
from app.services.tts import generate_audio

router = APIRouter(prefix="/api/episodes", tags=["episodes"])


class EpisodeCreate(BaseModel):
    channel_id: int
    youtube_url: str


def _process_episode(episode_id: int):
    """
    Background task: full pipeline from YouTube URL to podcast audio.
    1. Get video info
    2. Transcribe (YouTube captions or Whisper)
    3. Generate podcast summary script
    4. Generate TTS audio
    """
    try:
        # Get episode from DB
        with get_db() as db:
            episode = db.execute("SELECT * FROM episodes WHERE id = ?", (episode_id,)).fetchone()
            if not episode:
                return

            youtube_url = episode['youtube_url']

            # Update status
            db.execute(
                "UPDATE episodes SET status = 'processing' WHERE id = ?",
                (episode_id,),
            )

        # Step 1: Get video info
        video_info = get_video_info(youtube_url)
        with get_db() as db:
            db.execute(
                "UPDATE episodes SET youtube_title = ? WHERE id = ?",
                (video_info['title'], episode_id),
            )

        # Step 2: Get transcript
        transcript_result, method = get_transcript(youtube_url, AUDIO_DIR)

        if method == "whisper_needed":
            # transcript_result is a file path - transcribe with Whisper
            audio_path = Path(transcript_result)
            transcript_text = transcribe_audio(audio_path)
            # Clean up downloaded audio
            audio_path.unlink(missing_ok=True)
        else:
            transcript_text = transcript_result

        # Save transcript
        transcript_file = TRANSCRIPTS_DIR / f"episode_{episode_id}.txt"
        transcript_file.write_text(transcript_text, encoding='utf-8')

        with get_db() as db:
            db.execute(
                "UPDATE episodes SET transcript = ?, status = 'summarizing' WHERE id = ?",
                (transcript_text, episode_id),
            )

        # Step 3: Generate podcast-style summary/explanation
        summary = summarize_transcript(transcript_text)

        with get_db() as db:
            db.execute(
                "UPDATE episodes SET summary = ?, status = 'generating_audio' WHERE id = ?",
                (summary, episode_id),
            )

        # Step 4: Generate TTS audio
        audio_filename = f"episode_{episode_id}.mp3"
        audio_path = AUDIO_DIR / audio_filename
        generate_audio(summary, audio_path)

        # Get audio duration (approximate from file size for MP3 at ~192kbps)
        audio_size = audio_path.stat().st_size
        estimated_duration = int(audio_size / (192 * 1000 / 8))  # rough estimate

        # Mark as completed
        with get_db() as db:
            db.execute(
                """UPDATE episodes SET
                    audio_filename = ?,
                    audio_duration_seconds = ?,
                    status = 'completed',
                    processed_at = ?
                   WHERE id = ?""",
                (audio_filename, estimated_duration, datetime.utcnow().isoformat(), episode_id),
            )

    except Exception as e:
        with get_db() as db:
            db.execute(
                "UPDATE episodes SET status = 'error', error_message = ? WHERE id = ?",
                (f"{type(e).__name__}: {str(e)}", episode_id),
            )


@router.post("")
def create_episode(episode: EpisodeCreate, background_tasks: BackgroundTasks):
    """Submit a YouTube URL to be processed into a podcast episode."""
    # Validate channel exists
    with get_db() as db:
        channel = db.execute(
            "SELECT * FROM channels WHERE id = ?", (episode.channel_id,)
        ).fetchone()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")

    # Validate YouTube URL
    try:
        extract_video_id(episode.youtube_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Create episode record
    with get_db() as db:
        cursor = db.execute(
            "INSERT INTO episodes (channel_id, youtube_url, status) VALUES (?, ?, 'pending')",
            (episode.channel_id, episode.youtube_url),
        )
        episode_id = cursor.lastrowid
        row = db.execute("SELECT * FROM episodes WHERE id = ?", (episode_id,)).fetchone()

    # Start background processing
    background_tasks.add_task(_process_episode, episode_id)

    return dict(row)


@router.get("")
def list_episodes(channel_id: int | None = None):
    with get_db() as db:
        if channel_id:
            rows = db.execute(
                "SELECT * FROM episodes WHERE channel_id = ? ORDER BY created_at DESC",
                (channel_id,),
            ).fetchall()
        else:
            rows = db.execute(
                "SELECT * FROM episodes ORDER BY created_at DESC"
            ).fetchall()
        return [dict(row) for row in rows]


@router.get("/{episode_id}")
def get_episode(episode_id: int):
    with get_db() as db:
        row = db.execute("SELECT * FROM episodes WHERE id = ?", (episode_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Episode not found")
        return dict(row)


@router.delete("/{episode_id}")
def delete_episode(episode_id: int):
    with get_db() as db:
        existing = db.execute("SELECT * FROM episodes WHERE id = ?", (episode_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Episode not found")

        # Delete audio file if exists
        if existing['audio_filename']:
            audio_path = AUDIO_DIR / existing['audio_filename']
            audio_path.unlink(missing_ok=True)

        # Delete transcript file if exists
        transcript_path = TRANSCRIPTS_DIR / f"episode_{episode_id}.txt"
        transcript_path.unlink(missing_ok=True)

        db.execute("DELETE FROM episodes WHERE id = ?", (episode_id,))
        return {"message": "Episode deleted"}


@router.post("/{episode_id}/retry")
def retry_episode(episode_id: int, background_tasks: BackgroundTasks):
    """Retry processing a failed episode."""
    with get_db() as db:
        existing = db.execute("SELECT * FROM episodes WHERE id = ?", (episode_id,)).fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Episode not found")
        if existing['status'] not in ('error', 'pending'):
            raise HTTPException(status_code=400, detail="Can only retry failed or pending episodes")

        db.execute(
            "UPDATE episodes SET status = 'pending', error_message = '' WHERE id = ?",
            (episode_id,),
        )

    background_tasks.add_task(_process_episode, episode_id)
    return {"message": "Episode retry started"}
