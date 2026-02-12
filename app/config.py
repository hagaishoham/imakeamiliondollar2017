import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
AUDIO_DIR = DATA_DIR / "audio"
TRANSCRIPTS_DIR = DATA_DIR / "transcripts"
DB_PATH = DATA_DIR / "podcast.db"

# Ensure directories exist
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
TRANSCRIPTS_DIR.mkdir(parents=True, exist_ok=True)

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# App
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

# Podcast defaults
PODCAST_TITLE = os.getenv("PODCAST_TITLE", "My YouTube Podcast")
PODCAST_DESCRIPTION = os.getenv("PODCAST_DESCRIPTION", "Automatically generated podcast from YouTube videos")
PODCAST_AUTHOR = os.getenv("PODCAST_AUTHOR", "Podcast Author")
PODCAST_EMAIL = os.getenv("PODCAST_EMAIL", "")
PODCAST_LANGUAGE = os.getenv("PODCAST_LANGUAGE", "he")

# TTS
TTS_MODEL = os.getenv("TTS_MODEL", "tts-1")
TTS_VOICE = os.getenv("TTS_VOICE", "alloy")
