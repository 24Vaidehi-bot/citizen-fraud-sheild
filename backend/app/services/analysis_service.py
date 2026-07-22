"""
Orchestrates the detection engine + persistence into a single reusable
operation, so every entry point (text, url, screenshot, predict) produces
consistent, history-tracked results.
"""
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.db_models import AnalysisRecord
from app.models.schemas import AnalysisResult, InputType, ThreatIndicator
from app.services.analyzer import detect
from app.services.url_analyzer import analyse_url

EXCERPT_LIMIT = 200


def run_and_store_analysis(
    db: Session,
    raw_text: str,
    input_type: InputType,
    source_filename: Optional[str] = None,
    extracted_text: Optional[str] = None,
) -> AnalysisResult:
    """Run detection over `raw_text`, persist the record, and return the API model."""
    outcome = detect(raw_text)

    record = AnalysisRecord(
        input_type=input_type.value,
        input_excerpt=raw_text[:EXCERPT_LIMIT],
        source_filename=source_filename,
        extracted_text=extracted_text,
        score=outcome.score,
        threat_level=outcome.threat_level.value,
        label=outcome.label,
        summary=outcome.summary,
        recommendation=outcome.recommendation,
        indicators=[i.model_dump(mode="json") for i in outcome.indicators],
        red_flags=outcome.red_flags,
        safe_signals=outcome.safe_signals,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record_to_result(record)


def record_to_result(record: AnalysisRecord) -> AnalysisResult:
    """Map an ORM row back into the public API schema."""
    created_at = record.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    return AnalysisResult(
        id=record.id,
        timestamp=created_at,
        input=record.input_excerpt,
        input_type=InputType(record.input_type),
        score=record.score,
        threat_level=record.threat_level,
        label=record.label,
        summary=record.summary,
        indicators=[ThreatIndicator(**i) for i in (record.indicators or [])],
        red_flags=record.red_flags or [],
        safe_signals=record.safe_signals or [],
        recommendation=record.recommendation,
        source_filename=record.source_filename,
        extracted_text=record.extracted_text,
    )


# ---------------------------------------------------------------------------
# URL-specific analysis path
# ---------------------------------------------------------------------------

def run_and_store_url_analysis(
    db: Session,
    url: str,
) -> AnalysisResult:
    """
    Analyse a URL and persist the result.

    The URL is first inspected by the dedicated URL analyser (domain tricks,
    shorteners, phishing keywords, etc.) and then passed through the same
    text-based ``detect()`` engine so English keyword patterns in
    the URL path/query are also caught.  The two raw scores are *summed*
    (capped at 100) so both engines contribute to the final risk level.
    """
    # 1. URL-specific structural analysis.
    url_outcome = analyse_url(url)

    # 2. Text-engine pass over the diagnostic text (catches extra patterns).
    text_outcome = detect(url_outcome.diagnostic_text)

    # 3. Combine scores, indicators, red flags, and safe signals.
    combined_score = min(100.0, url_outcome.url_score + text_outcome.score)

    # Convert URL indicators to the shared ThreatIndicator schema so they
    # appear identically in the response alongside text-engine indicators.
    from app.models.schemas import ThreatLevel
    url_threat_indicators = [
        ThreatIndicator(
            type=ind.signal,
            description=ind.description,
            severity=(
                ThreatLevel.critical if ind.weight >= 35
                else ThreatLevel.high if ind.weight >= 25
                else ThreatLevel.medium if ind.weight >= 15
                else ThreatLevel.low
            ),
            found=[url],
        )
        for ind in url_outcome.indicators
    ]

    all_indicators = url_threat_indicators + text_outcome.indicators
    all_red_flags = (
        [f"{ind.signal}" for ind in url_outcome.indicators]
        + text_outcome.red_flags
    )
    all_safe_signals = text_outcome.safe_signals

    # Re-use the text engine's label/summary/recommendation lookup for the
    # combined score so we get consistent human-readable copy.
    from app.services.analyzer import (
        _threat_level_for_score, _LABELS, _SUMMARIES, _RECOMMENDATIONS,
    )
    level = _threat_level_for_score(combined_score)
    label = _LABELS[level]
    summary = _SUMMARIES[level]
    recommendation = _RECOMMENDATIONS[level]

    record = AnalysisRecord(
        input_type=InputType.url.value,
        input_excerpt=url[:EXCERPT_LIMIT],
        source_filename=None,
        extracted_text=None,
        score=combined_score,
        threat_level=level.value,
        label=label,
        summary=summary,
        recommendation=recommendation,
        indicators=[i.model_dump(mode="json") for i in all_indicators],
        red_flags=all_red_flags,
        safe_signals=all_safe_signals,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record_to_result(record)
