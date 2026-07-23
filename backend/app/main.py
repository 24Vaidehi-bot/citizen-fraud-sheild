"""
Citizen Fraud Shield API — application entrypoint.

Clean layout:
    app/api/routes/   -> HTTP layer (request/response only)
    app/services/      -> business logic (detection, OCR, explanations, history)
    app/models/         -> Pydantic schemas (API contract) + SQLAlchemy models (persistence)
    app/db/               -> database engine/session
    app/core/               -> config + shared exceptions
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import FraudShieldError
from app.db.session import init_db

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description=(
        "Backend API for Citizen Fraud Shield — text, URL, and screenshot scam "
        "analysis with OCR, explainable risk scoring, and scan history."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    import logging
    import os

    logger = logging.getLogger("app.main")
    init_db()

    # Log which cloud OCR providers are configured
    vision_key = os.environ.get("GOOGLE_CLOUD_VISION_API_KEY")
    ocr_space_key = os.environ.get("OCR_SPACE_API_KEY", "helloworld")

    if vision_key:
        logger.info("Cloud OCR: Google Cloud Vision API key is configured (preferred provider).")
    else:
        logger.info("Cloud OCR: Google Cloud Vision API key NOT set — OCR.Space will be used.")

    if ocr_space_key == "helloworld":
        logger.warning(
            "Cloud OCR: Using OCR.Space demo key (helloworld). "
            "Rate limit is 25 req/hour. Set OCR_SPACE_API_KEY for production."
        )
    else:
        logger.info("Cloud OCR: OCR.Space custom API key is configured.")


@app.exception_handler(FraudShieldError)
def handle_fraud_shield_error(request: Request, exc: FraudShieldError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})


@app.exception_handler(Exception)
def handle_general_exception(request: Request, exc: Exception) -> JSONResponse:
    import logging
    logging.getLogger("app.main").exception("Unhandled application exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )



app.include_router(api_router, prefix=settings.api_prefix)

# Serve uploaded screenshots (e.g. for admin/debug review) as static files.
app.mount("/uploads", StaticFiles(directory=str(settings.upload_path)), name="uploads")


@app.get("/", tags=["Health"], summary="Health check")
def root() -> dict:
    return {"status": "ok", "service": settings.app_name}


@app.get("/health", tags=["Health"], summary="Health check")
def health() -> dict:
    return {"status": "healthy"}
