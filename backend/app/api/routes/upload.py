"""Endpoint for uploading a screenshot, running OCR, then scam analysis."""
from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.schemas import InputType, ScreenshotAnalysisResponse
from app.services.analysis_service import run_and_store_analysis
from app.services.ocr_service import extract_text
from app.utils.file_storage import save_upload
from app.utils.validation import validate_image_upload

router = APIRouter(prefix="/upload", tags=["Screenshot Upload & OCR"])


@router.post(
    "/screenshot",
    response_model=ScreenshotAnalysisResponse,
    summary="Upload a screenshot, extract its text via EasyOCR, and analyze it for scam indicators",
)
async def upload_screenshot(
    file: UploadFile = File(..., description="Screenshot image (PNG, JPG, or WEBP)"),
    db: Session = Depends(get_db),
) -> ScreenshotAnalysisResponse:
    file_bytes = await file.read()
    validate_image_upload(file, file_bytes)

    stored_filename = save_upload(file_bytes, file.filename or "upload.png")
    ocr_result = extract_text(file_bytes, file.filename or stored_filename)

    analysis = run_and_store_analysis(
        db,
        raw_text=ocr_result.extracted_text,
        input_type=InputType.image,
        source_filename=stored_filename,
        extracted_text=ocr_result.extracted_text,
    )

    return ScreenshotAnalysisResponse(ocr=ocr_result, analysis=analysis)
