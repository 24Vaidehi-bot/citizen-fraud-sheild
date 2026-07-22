"""Query layer for retrieving and managing past analysis records."""
from typing import Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import ResultNotFoundError
from app.models.db_models import AnalysisRecord
from app.models.schemas import AnalysisResult, InputType
from app.services.analysis_service import record_to_result


def list_history(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    threat_level: Optional[str] = None,
    input_type: Optional[InputType] = None,
) -> Tuple[list[AnalysisResult], int]:
    query = select(AnalysisRecord)
    count_query = select(func.count()).select_from(AnalysisRecord)

    if threat_level:
        query = query.where(AnalysisRecord.threat_level == threat_level)
        count_query = count_query.where(AnalysisRecord.threat_level == threat_level)
    if input_type:
        query = query.where(AnalysisRecord.input_type == input_type.value)
        count_query = count_query.where(AnalysisRecord.input_type == input_type.value)

    total = db.execute(count_query).scalar_one()

    query = (
        query.order_by(AnalysisRecord.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    records = db.execute(query).scalars().all()

    return [record_to_result(r) for r in records], total


def get_result(db: Session, result_id: str) -> AnalysisResult:
    record = db.get(AnalysisRecord, result_id)
    if record is None:
        raise ResultNotFoundError(f"No analysis found with id '{result_id}'.")
    return record_to_result(record)


def get_record(db: Session, result_id: str) -> AnalysisRecord:
    record = db.get(AnalysisRecord, result_id)
    if record is None:
        raise ResultNotFoundError(f"No analysis found with id '{result_id}'.")
    return record


def delete_result(db: Session, result_id: str) -> None:
    record = get_record(db, result_id)
    db.delete(record)
    db.commit()


def clear_history(db: Session) -> int:
    count = db.query(AnalysisRecord).delete()
    db.commit()
    return count


def get_stats(db: Session) -> dict:
    total = db.execute(select(func.count()).select_from(AnalysisRecord)).scalar_one()
    by_level_rows = db.execute(
        select(AnalysisRecord.threat_level, func.count()).group_by(AnalysisRecord.threat_level)
    ).all()
    avg_score = db.execute(select(func.avg(AnalysisRecord.score))).scalar_one() or 0.0

    return {
        "total_scans": total,
        "by_threat_level": {level: count for level, count in by_level_rows},
        "average_score": round(float(avg_score), 2),
    }
