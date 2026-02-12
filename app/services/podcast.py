from datetime import datetime, timezone
from pathlib import Path

from feedgen.feed import FeedGenerator

from app.config import BASE_URL


def generate_rss_feed(channel: dict, episodes: list[dict]) -> str:
    """
    Generate a podcast RSS feed that Spotify and other platforms can index.

    Args:
        channel: Channel info dict with keys: podcast_title, podcast_description,
                 podcast_author, podcast_email, podcast_language, podcast_image_url
        episodes: List of episode dicts with keys: id, youtube_title, summary,
                  audio_filename, audio_duration_seconds, created_at
    """
    fg = FeedGenerator()
    fg.load_extension('podcast')

    # Channel metadata
    fg.title(channel['podcast_title'])
    fg.description(channel['podcast_description'] or 'YouTube to Podcast')
    fg.link(href=f"{BASE_URL}/rss/{channel['id']}", rel='self')
    fg.link(href=BASE_URL, rel='alternate')
    fg.language(channel.get('podcast_language', 'he'))
    fg.generator('YouTube-to-Podcast')

    # Podcast-specific metadata
    fg.podcast.itunes_category('Technology')
    fg.podcast.itunes_author(channel.get('podcast_author', ''))
    fg.podcast.itunes_summary(channel.get('podcast_description', ''))
    fg.podcast.itunes_explicit('no')

    if channel.get('podcast_image_url'):
        fg.podcast.itunes_image(channel['podcast_image_url'])

    if channel.get('podcast_email'):
        fg.podcast.itunes_owner(
            name=channel.get('podcast_author', ''),
            email=channel['podcast_email'],
        )

    # Add episodes
    for ep in episodes:
        if ep.get('status') != 'completed' or not ep.get('audio_filename'):
            continue

        fe = fg.add_entry()
        fe.id(f"{BASE_URL}/episodes/{ep['id']}")
        fe.title(ep.get('youtube_title', f"Episode {ep['id']}"))
        fe.description(ep.get('summary', ''))
        fe.published(
            datetime.fromisoformat(ep['created_at']).replace(tzinfo=timezone.utc)
            if isinstance(ep['created_at'], str)
            else ep['created_at']
        )

        # Audio enclosure
        audio_url = f"{BASE_URL}/audio/{ep['audio_filename']}"
        audio_path = Path(__file__).resolve().parent.parent.parent / "data" / "audio" / ep['audio_filename']
        audio_size = audio_path.stat().st_size if audio_path.exists() else 0

        fe.enclosure(audio_url, str(audio_size), 'audio/mpeg')

        # Podcast-specific episode metadata
        fe.podcast.itunes_duration(ep.get('audio_duration_seconds', 0))
        fe.podcast.itunes_summary(ep.get('summary', '')[:4000])

    return fg.rss_str(pretty=True).decode('utf-8')
