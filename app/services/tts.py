from pathlib import Path

from openai import OpenAI

from app.config import OPENAI_API_KEY, TTS_MODEL, TTS_VOICE


def generate_audio(text: str, output_path: Path, voice: str | None = None) -> Path:
    """
    Generate audio from text using OpenAI TTS API.
    This replaces NotebookLM's Audio Overview feature.
    """
    client = OpenAI(api_key=OPENAI_API_KEY)

    selected_voice = voice or TTS_VOICE

    # OpenAI TTS has a max of ~4096 chars per request, so we chunk if needed
    chunks = _split_text(text, max_chars=4000)

    if len(chunks) == 1:
        response = client.audio.speech.create(
            model=TTS_MODEL,
            voice=selected_voice,
            input=chunks[0],
        )
        response.stream_to_file(str(output_path))
    else:
        # For long texts, generate chunks and concatenate
        _generate_chunked_audio(client, chunks, output_path, selected_voice)

    return output_path


def _split_text(text: str, max_chars: int = 4000) -> list[str]:
    """Split text into chunks at sentence boundaries."""
    if len(text) <= max_chars:
        return [text]

    chunks = []
    current_chunk = ""

    sentences = text.replace('。', '.').replace('!', '!.').replace('?', '?.').split('.')

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        if len(current_chunk) + len(sentence) + 2 > max_chars:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence + ". "
        else:
            current_chunk += sentence + ". "

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks if chunks else [text[:max_chars]]


def _generate_chunked_audio(
    client: OpenAI,
    chunks: list[str],
    output_path: Path,
    voice: str,
) -> None:
    """Generate audio for multiple chunks and combine them."""
    import subprocess
    import tempfile

    temp_files = []
    try:
        for i, chunk in enumerate(chunks):
            temp_path = output_path.parent / f"_chunk_{i}.mp3"
            response = client.audio.speech.create(
                model=TTS_MODEL,
                voice=voice,
                input=chunk,
            )
            response.stream_to_file(str(temp_path))
            temp_files.append(temp_path)

        # Concatenate using ffmpeg if available, otherwise use simple file concat
        _concatenate_mp3_files(temp_files, output_path)
    finally:
        for f in temp_files:
            f.unlink(missing_ok=True)


def _concatenate_mp3_files(input_files: list[Path], output_path: Path) -> None:
    """Concatenate MP3 files using ffmpeg."""
    import subprocess
    import tempfile

    # Create a file list for ffmpeg
    list_file = output_path.parent / "_filelist.txt"
    try:
        with open(list_file, 'w') as f:
            for path in input_files:
                f.write(f"file '{path}'\n")

        result = subprocess.run(
            ['ffmpeg', '-f', 'concat', '-safe', '0', '-i', str(list_file),
             '-c', 'copy', str(output_path), '-y'],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            # Fallback: simple binary concatenation (works for MP3)
            _simple_concat(input_files, output_path)
    except FileNotFoundError:
        # ffmpeg not available, use simple concat
        _simple_concat(input_files, output_path)
    finally:
        list_file.unlink(missing_ok=True)


def _simple_concat(input_files: list[Path], output_path: Path) -> None:
    """Simple binary concatenation of MP3 files."""
    with open(output_path, 'wb') as outfile:
        for path in input_files:
            with open(path, 'rb') as infile:
                outfile.write(infile.read())
