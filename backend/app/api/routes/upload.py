"""Endpoint for uploading a screenshot, running OCR, then scam analysis."""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.schemas import InputType, ScreenshotAnalysisResponse
from app.services.analysis_service import run_and_store_analysis
from app.services.ocr_service import extract_text
from app.utils.file_storage import save_upload
from app.utils.validation import validate_image_upload

router = APIRouter(
    prefix="/upload",
    tags=["Screenshot Upload & OCR"],
)

logger = logging.getLogger(__name__)


@router.post(
    "/screenshot",
    response_model=ScreenshotAnalysisResponse,
    summary="Upload a screenshot, extract its text via OCR, and analyze it for scam indicators",
)
async def upload_screenshot(
    file: UploadFile = File(
        ...,
        description="Screenshot image (PNG, JPG, or WEBP)",
    ),
    db: Session = Depends(get_db),
) -> ScreenshotAnalysisResponse:

    try:
        # ---------------------------------------------------------
        # 1. Validate file exists
        # ---------------------------------------------------------
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No file was provided.",
            )

        logger.info(
            "Screenshot upload started: filename=%s, content_type=%s",
            file.filename,
            file.content_type,
        )

        # ---------------------------------------------------------
        # 2. Read file
        # ---------------------------------------------------------
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty.",
            )

        logger.info(
            "File read successfully: filename=%s, size=%d bytes",
            file.filename,
            len(file_bytes),
        )

        # ---------------------------------------------------------
        # 3. Validate image
        # ---------------------------------------------------------
        validate_image_upload(file, file_bytes)

        logger.info("Image validation successful: %s", file.filename)

        # ---------------------------------------------------------
        # 4. Save uploaded file
        # ---------------------------------------------------------
        stored_filename = save_upload(
            file_bytes,
            file.filename,
        )

        logger.info(
            "File saved successfully: %s",
            stored_filename,
        )

        # ---------------------------------------------------------
        # 5. OCR
        # ---------------------------------------------------------
        ocr_result = extract_text(
            file_bytes,
            file.filename,
        )

        logger.info(
            "OCR completed: extracted_text_length=%d",
            len(ocr_result.extracted_text or ""),
        )

        # ---------------------------------------------------------
        # 6. Scam analysis
        # ---------------------------------------------------------
        analysis = run_and_store_analysis(
            db,
            raw_text=ocr_result.extracted_text or "",
            input_type=InputType.image,
            source_filename=stored_filename,
            extracted_text=ocr_result.extracted_text or "",
        )

        logger.info(
            "Scam analysis completed successfully: %s",
            stored_filename,
        )

        # ---------------------------------------------------------
        # 7. Return response
        # ---------------------------------------------------------
        return ScreenshotAnalysisResponse(
            ocr=ocr_result,
            analysis=analysis,
        )

    except HTTPException:
        # Keep FastAPI HTTP errors unchanged
        raise

    except Exception as exc:
        # Log the COMPLETE traceback on Render
        logger.exception(
            "Screenshot processing failed: filename=%s",
            file.filename if file else "unknown",
        )

        raise HTTPException(
            status_code=500,
            detail=f"Screenshot processing failed: {str(exc)}",
        ) from exc