"""
Analysis service.

Runs the scam detection engine and stores the result
in the database.
"""

import logging
from datetime import timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.db_models import AnalysisRecord
from app.models.schemas import (
    AnalysisResult,
    InputType,
    ThreatIndicator,
)
from app.services.analyzer import detect
from app.services.url_analyzer import analyse_url


logger = logging.getLogger(__name__)


EXCERPT_LIMIT = 200


# ============================================================
# Text / Screenshot Analysis
# ============================================================

def run_and_store_analysis(
    db: Session,
    raw_text: str,
    input_type: InputType,
    source_filename: Optional[str] = None,
    extracted_text: Optional[str] = None,
) -> AnalysisResult:
    """
    Run scam detection, save the result to the database,
    and return the public API response.
    """

    # ========================================================
    # Validate input
    # ========================================================

    if not raw_text or not raw_text.strip():

        raise ValueError(
            "Cannot analyze empty text."
        )

    try:

        logger.info(
            "Starting analysis | type=%s | text_length=%d",
            input_type.value,
            len(raw_text),
        )

        # ====================================================
        # STEP 1: Run detection
        # ====================================================

        outcome = detect(
            raw_text
        )

        logger.info(
            "Detection completed | score=%s | threat=%s",
            outcome.score,
            outcome.threat_level.value,
        )

        # ====================================================
        # STEP 2: Create database record
        # ====================================================

        record = AnalysisRecord(

            input_type=input_type.value,

            input_excerpt=(
                raw_text[
                    :EXCERPT_LIMIT
                ]
            ),

            source_filename=source_filename,

            extracted_text=extracted_text,

            score=outcome.score,

            threat_level=(
                outcome
                .threat_level
                .value
            ),

            label=outcome.label,

            summary=outcome.summary,

            recommendation=(
                outcome
                .recommendation
            ),

            indicators=[
                i.model_dump(
                    mode="json"
                )
                for i in outcome.indicators
            ],

            red_flags=(
                outcome.red_flags
            ),

            safe_signals=(
                outcome.safe_signals
            ),
        )

        # ====================================================
        # STEP 3: Save database record
        # ====================================================

        db.add(
            record
        )

        db.commit()

        db.refresh(
            record
        )

        logger.info(
            "Analysis saved successfully | id=%s",
            record.id,
        )

        # ====================================================
        # STEP 4: Return API result
        # ====================================================

        return record_to_result(
            record
        )

    except Exception as exc:

        logger.exception(
            "Analysis failed."
        )

        # Always rollback failed transactions
        try:

            db.rollback()

        except Exception:

            logger.exception(
                "Database rollback failed."
            )

        raise exc


# ============================================================
# ORM -> API response
# ============================================================

def record_to_result(
    record: AnalysisRecord,
) -> AnalysisResult:
    """
    Convert SQLAlchemy ORM record into API schema.
    """

    created_at = (
        record.created_at
    )

    if created_at.tzinfo is None:

        created_at = (
            created_at.replace(
                tzinfo=timezone.utc
            )
        )

    return AnalysisResult(

        id=record.id,

        timestamp=created_at,

        input=(
            record.input_excerpt
        ),

        input_type=InputType(
            record.input_type
        ),

        score=record.score,

        threat_level=(
            record.threat_level
        ),

        label=record.label,

        summary=record.summary,

        indicators=[
            ThreatIndicator(
                **i
            )
            for i in (
                record.indicators
                or []
            )
        ],

        red_flags=(
            record.red_flags
            or []
        ),

        safe_signals=(
            record.safe_signals
            or []
        ),

        recommendation=(
            record.recommendation
        ),

        source_filename=(
            record.source_filename
        ),

        extracted_text=(
            record.extracted_text
        ),
    )


# ============================================================
# URL Analysis
# ============================================================

def run_and_store_url_analysis(
    db: Session,
    url: str,
) -> AnalysisResult:
    """
    Analyze a URL and save the result.
    """

    if not url or not url.strip():

        raise ValueError(
            "URL cannot be empty."
        )

    try:

        # ====================================================
        # 1. URL-specific analysis
        # ====================================================

        url_outcome = analyse_url(
            url
        )

        # ====================================================
        # 2. Text-engine analysis
        # ====================================================

        text_outcome = detect(
            url_outcome
            .diagnostic_text
        )

        # ====================================================
        # 3. Combine scores
        # ====================================================

        combined_score = min(
            100.0,
            (
                url_outcome.url_score
                + text_outcome.score
            ),
        )

        # Enforce non-SAFE baseline for unverified external domains
        from app.services.url_analyzer import _extract_hostname, _is_trusted_domain, _normalize_url
        _, parsed = _normalize_url(url)
        hostname = _extract_hostname(parsed)
        if hostname and not _is_trusted_domain(hostname):
            combined_score = max(15.0, combined_score)


        # ====================================================
        # 4. Convert URL indicators
        # ====================================================

        from app.models.schemas import (
            ThreatLevel,
        )

        url_threat_indicators = [

            ThreatIndicator(

                type=ind.signal,

                description=(
                    ind.description
                ),

                severity=(

                    ThreatLevel.critical
                    if ind.weight >= 35

                    else ThreatLevel.high
                    if ind.weight >= 25

                    else ThreatLevel.medium
                    if ind.weight >= 15

                    else ThreatLevel.low
                ),

                found=[
                    url
                ],
            )

            for ind
            in url_outcome.indicators
        ]

        # ====================================================
        # 5. Combine indicators
        # ====================================================

        all_indicators = (
            url_threat_indicators
            + text_outcome.indicators
        )

        all_red_flags = (

            [
                f"{ind.signal}"
                for ind
                in url_outcome.indicators
            ]

            + text_outcome.red_flags
        )

        all_safe_signals = (
            text_outcome.safe_signals
        )

        # ====================================================
        # 6. Determine final threat level
        # ====================================================

        from app.services.analyzer import (
            _LABELS,
            _RECOMMENDATIONS,
            _SUMMARIES,
            _threat_level_for_score,
        )

        level = (
            _threat_level_for_score(
                combined_score
            )
        )

        label = (
            _LABELS[level]
        )

        summary = (
            _SUMMARIES[level]
        )

        recommendation = (
            _RECOMMENDATIONS[level]
        )

        # ====================================================
        # 7. Create database record
        # ====================================================

        record = AnalysisRecord(

            input_type=(
                InputType.url.value
            ),

            input_excerpt=(
                url[
                    :EXCERPT_LIMIT
                ]
            ),

            source_filename=None,

            extracted_text=None,

            score=combined_score,

            threat_level=(
                level.value
            ),

            label=label,

            summary=summary,

            recommendation=(
                recommendation
            ),

            indicators=[

                i.model_dump(
                    mode="json"
                )

                for i
                in all_indicators
            ],

            red_flags=(
                all_red_flags
            ),

            safe_signals=(
                all_safe_signals
            ),
        )

        # ====================================================
        # 8. Save database record
        # ====================================================

        db.add(
            record
        )

        db.commit()

        db.refresh(
            record
        )

        return record_to_result(
            record
        )

    except Exception as exc:

        logger.exception(
            "URL analysis failed."
        )

        try:

            db.rollback()

        except Exception:

            logger.exception(
                "Database rollback failed."
            )

        raise exc