"""Endpoints for browsing, fetching, and clearing past analysis history."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.schemas import AnalysisResult, HistoryListResponse, InputType, ThreatLevel
from app.services.history_service import (
    clear_history,
    delete_result,
    get_result,
    get_stats,
    list_history,
)

router = APIRouter(prefix="/history", tags=["History"])


@router.get("", response_model=HistoryListResponse, summary="List past scan results, most recent first")
def get_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    threat_level: Optional[ThreatLevel] = Query(None),
    input_type: Optional[InputType] = Query(None),
    db: Session = Depends(get_db),
) -> HistoryListResponse:
    items, total = list_history(
        db,
        page=page,
        page_size=page_size,
        threat_level=threat_level.value if threat_level else None,
        input_type=input_type,
    )
    return HistoryListResponse(total=total, page=page, page_size=page_size, items=items)


@router.get("/stats", summary="Aggregate stats across all stored scans (for dashboards)")
def history_stats(db: Session = Depends(get_db)) -> dict:
    return get_stats(db)


@router.get("/{result_id}", response_model=AnalysisResult, summary="Fetch a single past result by id")
def get_history_item(result_id: str, db: Session = Depends(get_db)) -> AnalysisResult:
    return get_result(db, result_id)


@router.delete("/{result_id}", summary="Delete a single result from history")
def delete_history_item(result_id: str, db: Session = Depends(get_db)) -> dict:
    delete_result(db, result_id)
    return {"deleted": result_id}


@router.delete("", summary="Clear all stored history")
def clear_all_history(db: Session = Depends(get_db)) -> dict:
    count = clear_history(db)
    return {"deleted_count": count}
