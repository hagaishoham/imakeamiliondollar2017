"""Quick start script for YouTube to Podcast system."""
import uvicorn
from app.config import APP_HOST, APP_PORT

if __name__ == "__main__":
    print(f"\n🎙️  YouTube to Podcast System")
    print(f"   Server: http://localhost:{APP_PORT}")
    print(f"   API Docs: http://localhost:{APP_PORT}/docs\n")
    uvicorn.run("app.main:app", host=APP_HOST, port=APP_PORT, reload=True)
