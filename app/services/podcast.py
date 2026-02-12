import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import formatdate
from pathlib import Path
from xml.dom import minidom

from app.config import BASE_URL


def _xml_escape(text: str) -> str:
    """Escape special XML characters."""
    if not text:
        return ""
    return (text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&apos;"))


def _format_duration(seconds: int) -> str:
    """Format seconds as HH:MM:SS."""
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


def _to_rfc2822(dt_str: str) -> str:
    """Convert ISO datetime string to RFC 2822 format for RSS."""
    try:
        dt = datetime.fromisoformat(dt_str).replace(tzinfo=timezone.utc)
        return formatdate(dt.timestamp(), usegmt=True)
    except (ValueError, TypeError):
        return formatdate(usegmt=True)


def generate_rss_feed(channel: dict, episodes: list[dict]) -> str:
    """
    Generate a podcast RSS feed that Spotify and other platforms can index.

    Args:
        channel: Channel info dict with keys: podcast_title, podcast_description,
                 podcast_author, podcast_email, podcast_language, podcast_image_url
        episodes: List of episode dicts with keys: id, youtube_title, summary,
                  audio_filename, audio_duration_seconds, created_at
    """
    title = _xml_escape(channel.get('podcast_title', ''))
    description = _xml_escape(channel.get('podcast_description', '') or 'YouTube to Podcast')
    author = _xml_escape(channel.get('podcast_author', ''))
    email = _xml_escape(channel.get('podcast_email', ''))
    language = _xml_escape(channel.get('podcast_language', 'he'))
    image_url = _xml_escape(channel.get('podcast_image_url', ''))
    channel_id = channel.get('id', 0)

    items_xml = []
    for ep in episodes:
        if ep.get('status') != 'completed' or not ep.get('audio_filename'):
            continue

        ep_title = _xml_escape(ep.get('youtube_title', f"Episode {ep['id']}"))
        ep_summary = _xml_escape(ep.get('summary', ''))
        audio_url = f"{BASE_URL}/audio/{ep['audio_filename']}"
        audio_path = Path(__file__).resolve().parent.parent.parent / "data" / "audio" / ep['audio_filename']
        audio_size = audio_path.stat().st_size if audio_path.exists() else 0
        duration = _format_duration(ep.get('audio_duration_seconds', 0))
        pub_date = _to_rfc2822(ep.get('created_at', ''))

        items_xml.append(f"""
        <item>
            <title>{ep_title}</title>
            <description><![CDATA[{ep.get('summary', '')}]]></description>
            <guid isPermaLink="false">{BASE_URL}/episodes/{ep['id']}</guid>
            <pubDate>{pub_date}</pubDate>
            <enclosure url="{_xml_escape(audio_url)}" length="{audio_size}" type="audio/mpeg"/>
            <itunes:duration>{duration}</itunes:duration>
            <itunes:summary>{ep_summary[:4000]}</itunes:summary>
            <itunes:explicit>no</itunes:explicit>
        </item>""")

    owner_xml = ""
    if email:
        owner_xml = f"""
        <itunes:owner>
            <itunes:name>{author}</itunes:name>
            <itunes:email>{email}</itunes:email>
        </itunes:owner>"""

    image_xml = ""
    if image_url:
        image_xml = f'\n        <itunes:image href="{image_url}"/>'

    rss_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>{title}</title>
        <description>{description}</description>
        <language>{language}</language>
        <generator>YouTube-to-Podcast</generator>
        <atom:link href="{BASE_URL}/rss/{channel_id}" rel="self" type="application/rss+xml"/>
        <link>{BASE_URL}</link>
        <itunes:author>{author}</itunes:author>
        <itunes:summary>{description}</itunes:summary>
        <itunes:category text="Technology"/>
        <itunes:explicit>no</itunes:explicit>{owner_xml}{image_xml}
{"".join(items_xml)}
    </channel>
</rss>"""

    return rss_xml
