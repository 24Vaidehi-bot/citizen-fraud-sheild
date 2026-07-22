"""Endpoints for analyzing raw text or a URL."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.schemas import AnalysisResult, InputType, TextAnalysisRequest, UrlAnalysisRequest
from app.services.analysis_service import run_and_store_analysis, run_and_store_url_analysis

router = APIRouter(prefix="/analyze", tags=["Analysis"])


@router.post("/text", response_model=AnalysisResult, summary="Analyze a raw text message or email")
def analyze_text(payload: TextAnalysisRequest, db: Session = Depends(get_db)) -> AnalysisResult:
    return run_and_store_analysis(db, raw_text=payload.text, input_type=InputType.text)


@router.post("/url", response_model=AnalysisResult, summary="Analyze a URL for scam indicators")
def analyze_url(payload: UrlAnalysisRequest, db: Session = Depends(get_db)) -> AnalysisResult:
    # Delegate to the dedicated URL analysis pipeline which inspects domain
    # structure, shorteners, fake banking domains, KYC/payment scam keywords,
    # phishing patterns, and government impersonation before also running
    # the full text-pattern engine over diagnostic text.
    return run_and_store_url_analysis(db, url=str(payload.url))
