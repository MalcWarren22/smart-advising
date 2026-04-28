import os
import sys

# Add the api-server directory to path so imports resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware
from database import engine
from models import Base
from sqlalchemy import text

Base.metadata.create_all(bind=engine)

# Run column migrations for new fields that may not exist on older installs
def run_migrations():
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE students
            ADD COLUMN IF NOT EXISTS curriculum_id INTEGER
        """))
        conn.commit()

run_migrations()

app = FastAPI()

from routers import auth, students, courses, progress, plans, dashboard

SESSION_SECRET = os.environ.get("SESSION_SECRET", "smart-advisor-dev-secret-key-change-in-prod")

app = FastAPI(title="Smart Advisor API", root_path="/api")

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    session_cookie="smart_advisor_session",
    same_site="lax",
    https_only=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(students.router)
app.include_router(courses.router)
app.include_router(progress.router)
app.include_router(plans.router)
app.include_router(dashboard.router)


@app.get("/healthz")
def health_check():
    return {"status": "ok"}


# Serve static frontend in production
_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist", "public")
if os.path.isdir(_frontend_dist):
    app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="static")
