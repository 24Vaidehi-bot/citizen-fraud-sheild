"""ORM models — the persistence layer's view of the domain."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Float, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def _uuid() -> str:
    return uuid.uuid4().hex[:12]


def _now() -> datetime:
    return datetime.now(timezone.utc)


class AnalysisRecord(Base):
    """A single scam-analysis result, persisted for the history/dashboard view."""

    __tablename__ = "analysis_records"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, index=True)

    input_type: Mapped[str] = mapped_column(String(16))          # text | image | url
    input_excerpt: Mapped[str] = mapped_column(Text)             # truncated raw input, for display
    source_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)  # OCR output, if any

    score: Mapped[float] = mapped_column(Float)
    threat_level: Mapped[str] = mapped_column(String(16))
    label: Mapped[str] = mapped_column(String(128))
    summary: Mapped[str] = mapped_column(Text)
    recommendation: Mapped[str] = mapped_column(Text)

    indicators: Mapped[list] = mapped_column(JSON, default=list)
    red_flags: Mapped[list] = mapped_column(JSON, default=list)
    safe_signals: Mapped[list] = mapped_column(JSON, default=list)
    explanation: Mapped[dict | None] = mapped_column(JSON, nullable=True)
