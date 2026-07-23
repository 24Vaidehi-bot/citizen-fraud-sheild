"""
Cloud-based OCR extraction service.

Replaces the local Tesseract dependency with two cloud providers:
  1. OCR.Space API (primary) -- free up to 25,000 req/month,
     works via plain HTTP, requires no system packages whatsoever.
  2. Google Cloud Vision API (optional secondary) -- used when the env var
     GOOGLE_CLOUD_VISION_API_KEY is set. Falls back gracefully if absent.

Environment variables
---------------------
OCR_SPACE_API_KEY
    Your OCR.Space API key. Defaults to the "helloworld" demo key
    (25 req/hour). Register free at https://ocr.space/ocrapi for
    a 25,000 req/month key.

GOOGLE_CLOUD_VISION_API_KEY
    (optional) Google Cloud Vision API key. When provided, this
    becomes the preferred provider and OCR.Space acts as fallback.
"""

from __future__ import annotations

import base64
import io
import json
import logging
import os
import re
from typing import Optional, Tuple

import requests
from PIL import Image, ImageOps

from app.core.exceptions import OCRProcessingError
from app.models.schemas import OCRResult

logger = logging.getLogger(__name__)

MAX_IMAGE_WIDTH = 2500
MAX_IMAGE_HEIGHT = 2500
MAX_SEND_BYTES = 800_000

_OCR_SPACE_API_KEY: str = os.environ.get("OCR_SPACE_API_KEY", "helloworld")
_GOOGLE_VISION_API_KEY: Optional[str] = os.environ.get("GOOGLE_CLOUD_VISION_API_KEY")
_OCR_SPACE_URL = "https://api.ocr.space/parse/image"
_GOOGLE_VISION_URL = "https://vision.googleapis.com/v1/images:annotate?key={key}"
_API_TIMEOUT = 30


def _preprocess(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    if image.mode in ("RGBA", "LA") or (
        image.mode == "P" and "transparency" in image.info
    ):
        bg = Image.new("RGB", image.size, (255, 255, 255))
        if image.mode in ("RGBA", "LA"):
            bg.paste(image, mask=image.getchannel("A"))
        else:
            rgba = image.convert("RGBA")
            bg.paste(rgba, mask=rgba.getchannel("A"))
        image = bg
    elif image.mode != "RGB":
        image = image.convert("RGB")
    w, h = image.size
    if w > MAX_IMAGE_WIDTH or h > MAX_IMAGE_HEIGHT:
        scale = min(MAX_IMAGE_WIDTH / w, MAX_IMAGE_HEIGHT / h)
        nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
        logger.info("Downscaling image for OCR from %dx%d to %dx%d", w, h, nw, nh)
        resample = getattr(Image, "Resampling", Image).LANCZOS
        image = image.resize((nw, nh), resample)
    return image


def _image_to_jpeg_bytes(image: Image.Image, quality: int = 85) -> bytes:
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=quality, optimize=True)
    return buf.getvalue()


def _shrink_if_needed(jpeg_bytes: bytes) -> bytes:
    if len(jpeg_bytes) <= MAX_SEND_BYTES:
        return jpeg_bytes
    img = Image.open(io.BytesIO(jpeg_bytes))
    for quality in (70, 55, 40, 25):
        candidate = _image_to_jpeg_bytes(img, quality=quality)
        if len(candidate) <= MAX_SEND_BYTES:
            logger.info(
                "Reduced JPEG to quality=%d (%d bytes) to fit API limit",
                quality, len(candidate),
            )
            return candidate
    w, h = img.size
    img = img.resize((w // 2, h // 2), Image.LANCZOS)
    result = _image_to_jpeg_bytes(img, quality=50)
    logger.warning("Resized image to 50pct (%d bytes) to meet API limit", len(result))
    return result


def _ocr_via_ocrspace(jpeg_bytes: bytes) -> str:
    """Call the OCR.Space REST API and return extracted text."""
    b64 = base64.b64encode(jpeg_bytes).decode("utf-8")
    payload = {
        "base64Image": "data:image/jpeg;base64," + b64,
        "language": "eng",
        "isOverlayRequired": "false",
        "detectOrientation": "true",
        "scale": "true",
        "OCREngine": "2",
        "isTable": "false",
        "filetype": "JPG",
    }
    headers = {"apikey": _OCR_SPACE_API_KEY}
    try:
        logger.info("Calling OCR.Space API (payload=%.1f KB)", len(jpeg_bytes) / 1024)
        response = requests.post(
            _OCR_SPACE_URL, data=payload, headers=headers, timeout=_API_TIMEOUT
        )
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise OCRProcessingError("OCR.Space API request timed out. Please try again.")
    except requests.exceptions.ConnectionError as exc:
        raise OCRProcessingError("Cannot reach OCR.Space API: " + str(exc)) from exc
    except requests.exceptions.HTTPError as exc:
        raise OCRProcessingError(
            "OCR.Space API returned HTTP " + str(response.status_code) + "."
        ) from exc
    try:
        data = response.json()
    except ValueError as exc:
        raise OCRProcessingError("OCR.Space returned an invalid JSON response.") from exc
    if data.get("IsErroredOnProcessing"):
        err_msg = data.get("ErrorMessage", ["Unknown OCR error"])
        if isinstance(err_msg, list):
            err_msg = " ".join(str(m) for m in err_msg)
        raise OCRProcessingError("OCR.Space processing error: " + str(err_msg))
    parsed_results = data.get("ParsedResults") or []
    if not parsed_results:
        raise OCRProcessingError("OCR.Space returned no parsed results for this image.")
    texts = [
        r.get("ParsedText", "").strip()
        for r in parsed_results
        if r.get("ParsedText", "").strip()
    ]
    extracted = "\n".join(texts).strip()
    logger.info(
        "OCR.Space returned %d characters (exit code %s)",
        len(extracted), data.get("OCRExitCode"),
    )
    return extracted


def _ocr_via_google_vision(jpeg_bytes: bytes) -> str:
    """Call the Google Cloud Vision REST API for text detection."""
    if not _GOOGLE_VISION_API_KEY:
        raise OCRProcessingError("Google Cloud Vision API key not configured.")
    b64 = base64.b64encode(jpeg_bytes).decode("utf-8")
    request_body = {
        "requests": [
            {
                "image": {"content": b64},
                "features": [{"type": "TEXT_DETECTION", "maxResults": 1}],
            }
        ]
    }
    url = _GOOGLE_VISION_URL.format(key=_GOOGLE_VISION_API_KEY)
    try:
        logger.info("Calling Google Cloud Vision API (payload=%.1f KB)", len(jpeg_bytes) / 1024)
        response = requests.post(
            url,
            data=json.dumps(request_body),
            headers={"Content-Type": "application/json"},
            timeout=_API_TIMEOUT,
        )
        response.raise_for_status()
    except requests.exceptions.Timeout:
        raise OCRProcessingError("Google Vision API request timed out.")
    except requests.exceptions.ConnectionError as exc:
        raise OCRProcessingError("Cannot reach Google Vision API: " + str(exc)) from exc
    except requests.exceptions.HTTPError as exc:
        raise OCRProcessingError(
            "Google Vision API returned HTTP " + str(response.status_code) + "."
        ) from exc
    try:
        data = response.json()
    except ValueError as exc:
        raise OCRProcessingError("Google Vision returned an invalid JSON response.") from exc
    responses = data.get("responses", [{}])
    if not responses:
        raise OCRProcessingError("Google Vision returned an empty response list.")
    first = responses[0]
    if "error" in first:
        code = first["error"].get("code", "?")
        msg = first["error"].get("message", "Unknown error")
        raise OCRProcessingError("Google Vision API error " + str(code) + ": " + msg)
    full_annotation = first.get("fullTextAnnotation", {})
    extracted = full_annotation.get("text", "").strip()
    logger.info("Google Vision returned %d characters", len(extracted))
    return extracted


def _detect_language(text: str) -> Tuple[str, str]:
    has_devanagari = bool(re.search(r"[\u0900-\u097F]", text))
    if has_devanagari:
        return "hi", "Hindi"
    return "en", "English"


def extract_text(file_bytes: bytes, filename: str) -> OCRResult:
    """
    Extract text from an image using cloud-based OCR.

    Provider order:
      1. Google Cloud Vision (if GOOGLE_CLOUD_VISION_API_KEY is set)
      2. OCR.Space (always available; uses helloworld key by default)

    No system packages, no Tesseract binary, no Docker required.
    Works on any standard Python Render deployment.

    Raises OCRProcessingError on failure.
    """
    if not file_bytes:
        raise OCRProcessingError("The uploaded image is empty.")

    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.load()
    except Exception as exc:
        logger.exception("Failed to open image bytes for %s", filename)
        raise OCRProcessingError(
            "The uploaded file is not a valid or readable image."
        ) from exc

    original_width, original_height = image.size
    logger.info(
        "Starting cloud OCR preprocessing for %s (%dx%d)",
        filename, original_width, original_height,
    )

    try:
        processed = _preprocess(image)
    except Exception as exc:
        logger.exception("Image preprocessing failed for %s", filename)
        raise OCRProcessingError("Failed to preprocess image for OCR.") from exc

    try:
        jpeg_bytes = _image_to_jpeg_bytes(processed)
        jpeg_bytes = _shrink_if_needed(jpeg_bytes)
    except Exception as exc:
        logger.exception("JPEG encoding failed for %s", filename)
        raise OCRProcessingError("Failed to encode image for OCR submission.") from exc

    extracted_text: Optional[str] = None
    last_error: Optional[str] = None

    if _GOOGLE_VISION_API_KEY:
        try:
            extracted_text = _ocr_via_google_vision(jpeg_bytes)
            logger.info("Google Cloud Vision OCR succeeded for %s", filename)
        except OCRProcessingError as exc:
            last_error = str(exc)
            logger.warning(
                "Google Vision OCR failed for %s, falling back to OCR.Space: %s",
                filename, last_error,
            )

    if extracted_text is None:
        try:
            extracted_text = _ocr_via_ocrspace(jpeg_bytes)
            logger.info("OCR.Space OCR succeeded for %s", filename)
        except OCRProcessingError as exc:
            last_error = str(exc)
            logger.error("OCR.Space OCR also failed for %s: %s", filename, last_error)

    if not extracted_text:
        raise OCRProcessingError(
            ("OCR failed for this image. Details: " + last_error)
            if last_error
            else "No text was returned by the OCR service for this image."
        )

    lines = [line.strip() for line in extracted_text.splitlines() if line.strip()]
    final_text = "\n".join(lines).strip()

    has_valid_chars = bool(re.search(r"[a-zA-Z0-9\u0900-\u097F]", final_text))
    if not final_text or not has_valid_chars:
        raise OCRProcessingError(
            "No readable text was found in this screenshot. "
            "Please upload a clear screenshot containing legible English or Hindi text."
        )

    lang_code, lang_name = _detect_language(final_text)
    confidence = round(min(1.0, 0.92 if len(final_text) > 20 else 0.75), 3)

    logger.info(
        "Cloud OCR successfully extracted %d characters from %s (lang=%s, confidence=%.2f)",
        len(final_text), filename, lang_name, confidence,
    )

    return OCRResult(
        extracted_text=final_text,
        confidence=confidence,
        filename=filename,
        width=original_width,
        height=original_height,
        detected_language=lang_code,
        detected_language_name=lang_name,
    )
