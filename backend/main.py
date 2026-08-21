import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .db.database import engine, Base
from .routers import auth, verification, upload, history, dashboard, report, agent_chat, compare

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FakeSense API",
    description="Agentic AI-Based Media Verification System API (v2.0)",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development and demonstration
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(verification.router)
app.include_router(upload.router)
app.include_router(history.router)
app.include_router(dashboard.router)
app.include_router(report.router)
app.include_router(agent_chat.router)
app.include_router(compare.router)



# Static samples directory for demo assets
SAMPLES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "samples")
os.makedirs(SAMPLES_DIR, exist_ok=True)
app.mount("/static/samples", StaticFiles(directory=SAMPLES_DIR), name="samples")


@app.get("/")
def root():
    return {
        "service": "FakeSense Media Verification Engine & AI Agent API",
        "version": "2.0.0",
        "frontend_url": "http://127.0.0.1:5173",
        "interactive_docs": "http://127.0.0.1:8000/docs",
        "health_endpoint": "http://127.0.0.1:8000/health",
        "message": "Welcome to FakeSense API! Open http://127.0.0.1:5173 in your browser to access the FakeSense Web Interface."
    }


@app.get("/health")
def health_check():

    return {
        "status": "healthy",
        "service": "FakeSense Media Verification Engine",
        "version": "2.0.0",
        "database": "connected"
    }


@app.get("/samples/list")
def list_demo_samples():
    """Lists pre-packaged demo samples for rapid testing."""
    sample_files = []
    if os.path.exists(SAMPLES_DIR):
        for f in os.listdir(SAMPLES_DIR):
            if f.endswith(('.jpg', '.jpeg', '.png', '.mp4')):
                sample_files.append({
                    "name": f,
                    "url": f"/static/samples/{f}",
                    "type": "video" if f.endswith('.mp4') else "image"
                })
    return {"samples": sample_files}
