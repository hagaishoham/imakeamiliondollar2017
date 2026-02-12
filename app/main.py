from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import AUDIO_DIR
from app.database import init_db
from app.routers import channels, episodes, rss

app = FastAPI(
    title="YouTube to Podcast",
    description="מערכת להמרת סרטוני יוטיוב לפודקאסט אוטומטית",
    version="1.0.0",
)

# Include routers
app.include_router(channels.router)
app.include_router(episodes.router)
app.include_router(rss.router)

# Serve audio files
app.mount("/audio", StaticFiles(directory=str(AUDIO_DIR)), name="audio")

# Serve static frontend
STATIC_DIR = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def root():
    return FileResponse(STATIC_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn
    from app.config import APP_HOST, APP_PORT
    uvicorn.run("app.main:app", host=APP_HOST, port=APP_PORT, reload=True)
