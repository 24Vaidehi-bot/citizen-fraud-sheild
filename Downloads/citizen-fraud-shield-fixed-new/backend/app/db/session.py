"""
SQLAlchemy engine, session factory and declarative base.
SQLite is used by default (zero-config, file-based), but DATABASE_URL can be
pointed at Postgres/MySQL in production without touching any other code.
"""
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# Ensure the storage directory exists for file-based SQLite databases.
if settings.database_url.startswith("sqlite"):
    try:
        Path("storage").mkdir(parents=True, exist_ok=True)
    except Exception:
        Path("/tmp/storage").mkdir(parents=True, exist_ok=True)

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Session:
    """FastAPI dependency that yields a DB session and guarantees closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Called once on application startup."""
    from app.models import db_models  # noqa: F401  (ensures models are registered)

    Base.metadata.create_all(bind=engine)
