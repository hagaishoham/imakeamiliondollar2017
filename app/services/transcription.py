from pathlib import Path

from openai import OpenAI

from app.config import OPENAI_API_KEY


def transcribe_audio(audio_path: Path) -> str:
    """Transcribe audio file using OpenAI Whisper API."""
    client = OpenAI(api_key=OPENAI_API_KEY)

    with open(audio_path, "rb") as audio_file:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language="he",
        )
    return response.text


def summarize_transcript(transcript: str) -> str:
    """
    Use GPT to create a podcast-style summary/explanation of the transcript.
    This replaces the NotebookLM functionality.
    """
    client = OpenAI(api_key=OPENAI_API_KEY)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "אתה מנחה פודקאסט מקצועי ומעניין. "
                    "קיבלת תמלול של סרטון מיוטיוב. "
                    "התפקיד שלך הוא ליצור סקריפט להסבר קולי מפורט ומעניין "
                    "שמסביר את התוכן בצורה נגישה ומרתקת. "
                    "כתוב את הסקריפט כאילו אתה מדבר ישירות למאזין. "
                    "התחל עם הקדמה קצרה, עבור על הנקודות העיקריות, "
                    "ותסיים עם סיכום. "
                    "כתוב בעברית. "
                    "אל תוסיף הוראות במה, רק את הטקסט שיוקרא."
                ),
            },
            {
                "role": "user",
                "content": f"הנה התמלול של הסרטון:\n\n{transcript}",
            },
        ],
        max_tokens=4096,
        temperature=0.7,
    )
    return response.choices[0].message.content
