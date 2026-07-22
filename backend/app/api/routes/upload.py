"""Endpoint for uploading a screenshot, running OCR, then scam analysis."""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.exceptions import FraudShieldError
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
        # STEP 1: Request received
        # ---------------------------------------------------------
        if not file or not file.filename:
            logger.error("STEP 1 FAILED: No file provided")
            raise HTTPException(
                status_code=400,
                detail="No file was provided.",
            )

        logger.info(
            "STEP 1: Request received | filename=%s | content_type=%s",
            file.filename,
            file.content_type,
        )

        # ---------------------------------------------------------
        # STEP 2: File read
        # ---------------------------------------------------------
        file_bytes = await file.read()

        if not file_bytes:
            logger.error("STEP 2 FAILED: Uploaded file is empty | filename=%s", file.filename)
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty.",
            )

        logger.info(
            "STEP 2: File read successfully | filename=%s | size=%d bytes",
            file.filename,
            len(file_bytes),
        )

        # ---------------------------------------------------------
        # STEP 3: Image validation
        # ---------------------------------------------------------
        validate_image_upload(file, file_bytes)
        logger.info("STEP 3: Image validation complete | filename=%s", file.filename)

        # ---------------------------------------------------------
        # STEP 4: File saved
        # ---------------------------------------------------------
        stored_filename = save_upload(
            file_bytes,
            file.filename,
        )
        logger.info("STEP 4: File saved successfully | stored_filename=%s", stored_filename)

        # ---------------------------------------------------------
        # STEP 5 & 6: OCR execution
        # ---------------------------------------------------------
        logger.info("STEP 5: OCR started | filename=%s", stored_filename)
        ocr_result = extract_text(
            file_bytes,
            file.filename,
        )
        logger.info(
            "STEP 6: OCR completed | extracted_text_length=%d | confidence=%.2f",
            len(ocr_result.extracted_text or ""),
            ocr_result.confidence,
        )

        # ---------------------------------------------------------
        # STEP 7 & 8: Scam detection & DB commit
        # ---------------------------------------------------------
        logger.info("STEP 7: Scam detection starting...")
        analysis = run_and_store_analysis(
            db,
            raw_text=ocr_result.extracted_text or "",
            input_type=InputType.image,
            source_filename=stored_filename,
            extracted_text=ocr_result.extracted_text or "",
        )
        logger.info("STEP 7: Detection completed | score=%.1f | threat=%s", analysis.score, analysis.threat_level)
        logger.info("STEP 8: Database commit completed | record_id=%s", analysis.id)

        # ---------------------------------------------------------
        # STEP 9: Response returned
        # ---------------------------------------------------------
        response = ScreenshotAnalysisResponse(
            ocr=ocr_result,
            analysis=analysis,
        )
        logger.info("STEP 9: Response returned successfully | filename=%s", stored_filename)
        return response

    except FraudShieldError as exc:
        logger.warning(
            "Application error during screenshot upload | status=%d | detail=%s",
            exc.status_code,
            exc.message,
        )
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:
        logger.exception(
            "Unhandled server exception during screenshot processing | filename=%s",
            file.filename if file else "unknown",
        )
        raise HTTPException(
            status_code=500,
            detail=f"Screenshot processing failed: {str(exc)}",
        ) from exc