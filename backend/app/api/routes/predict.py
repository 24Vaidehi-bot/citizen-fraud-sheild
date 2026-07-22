"""Lightweight scam-probability prediction endpoint (no persistence)."""
from fastapi import APIRouter

from app.models.schemas import PredictRequest, PredictResponse
from app.services.predict_service import predict

router = APIRouter(prefix="/predict", tags=["Scam Prediction"])


@router.post(
    "",
    response_model=PredictResponse,
    summary="Get a scam-probability prediction for a piece of text, without saving history",
)
def predict_scam(payload: PredictRequest) -> PredictResponse:
    return predict(payload.text)
