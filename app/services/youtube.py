import re
import tempfile
from pathlib import Path

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi


def extract_video_id(url: str) -> str:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com/shorts/)([a-zA-Z0-9_-]{11})',
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError(f"Could not extract video ID from URL: {url}")


def get_video_info(url: str) -> dict:
    """Get video metadata without downloading."""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        return {
            'title': info.get('title', ''),
            'description': info.get('description', ''),
            'duration': info.get('duration', 0),
            'channel': info.get('channel', ''),
            'thumbnail': info.get('thumbnail', ''),
        }


def get_transcript_from_api(video_id: str, languages: list[str] | None = None) -> str:
    """Try to get transcript using YouTube's built-in captions."""
    if languages is None:
        languages = ['he', 'en', 'iw']
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
        return ' '.join(entry['text'] for entry in transcript_list)
    except Exception:
        return ""


def download_audio(url: str, output_dir: Path) -> Path:
    """Download audio from YouTube video for Whisper transcription."""
    output_template = str(output_dir / '%(id)s.%(ext)s')
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': output_template,
        'quiet': True,
        'no_warnings': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        video_id = info['id']
        audio_path = output_dir / f"{video_id}.mp3"
        return audio_path


def get_transcript(url: str, output_dir: Path) -> tuple[str, str]:
    """
    Get transcript for a YouTube video.
    First tries YouTube's built-in captions, then falls back to downloading audio
    for Whisper transcription.

    Returns: (transcript_text, method_used)
    """
    video_id = extract_video_id(url)

    # Try YouTube's built-in captions first
    transcript = get_transcript_from_api(video_id)
    if transcript:
        return transcript, "youtube_captions"

    # Fall back to downloading audio for Whisper
    audio_path = download_audio(url, output_dir)
    return str(audio_path), "whisper_needed"
