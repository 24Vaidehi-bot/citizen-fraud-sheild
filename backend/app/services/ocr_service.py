"""
OCR extraction service using lightweight ONNX / Tesseract engines.

Designed for low-memory cloud deployments (such as Render 512MB free tier).
Replaces memory-heavy EasyOCR/PyTorch (>1.5GB RAM) with RapidOCR-ONNX (~40MB RAM),
pytesseract, and PIL fallback engines.
"""

import io
import logging
import threading
from typing import List, Tuple

import numpy as np
from PIL import Image, ImageOps

from app.core.exceptions import OCRProcessingError
from app.models.schemas import OCRResult

logger = logging.getLogger(__name__)

# Singleton OCR engine instances
_rapidocr_engine = None
_engine_lock = threading.Lock()

# Image size thresholds to control RAM/CPU load and optimize speed
MAX_IMAGE_WIDTH = 1800
MAX_IMAGE_HEIGHT = 1800
MIN_IMAGE_WIDTH = 600


def _get_rapidocr_engine():
    """
    Lazily initialize RapidOCR (ONNX Runtime engine) on demand.
    Uses ~40MB RAM compared to 1.5GB+ for EasyOCR/PyTorch.
    """
    global _rapidocr_engine
    if _rapidocr_engine is not None:
        return _rapidocr_engine

    with _engine_lock:
        if _rapidocr_engine is not None:
            return _rapidocr_engine

        try:
            logger.info("Initializing lightweight RapidOCR-ONNX engine...")
            from rapidocr_onnxruntime import RapidOCR

            _rapidocr_engine = RapidOCR()
            logger.info("RapidOCR-ONNX engine initialized successfully.")
            return _rapidocr_engine
        except ImportError:
            logger.warning("rapidocr-onnxruntime package is not installed.")
            return None
        except Exception as exc:
            logger.warning("RapidOCR initialization failed: %s", exc)
            return None


def _preprocess(image: Image.Image) -> Image.Image:
    """
    Prepare image for OCR while controlling memory usage.
    """
    # Fix EXIF orientation
    image = ImageOps.exif_transpose(image)

    # Convert transparency (RGBA/LA/P) to white background RGB
    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        background = Image.new("RGB", image.size, (255, 255, 255))
        if image.mode in ("RGBA", "LA"):
            mask = image.getchannel("A")
            background.paste(image, mask=mask)
        else:
            rgba_img = image.convert("RGBA")
            background.paste(rgba_img, mask=rgba_img.getchannel("A"))
        image = background
    else:
        image = image.convert("RGB")

    width, height = image.size

    # Downscale oversized screenshots
    if width > MAX_IMAGE_WIDTH or height > MAX_IMAGE_HEIGHT:
        scale = min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height)
        new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
        logger.info("Downscaling image for OCR from %dx%d to %dx%d", width, height, new_size[0], new_size[1])
        image = image.resize(new_size, Image.LANCZOS)
    elif width < MIN_IMAGE_WIDTH:
        scale = MIN_IMAGE_WIDTH / width
        new_size = (int(width * scale), int(height * scale))
        logger.info("Upscaling small image for OCR from %dx%d to %dx%d", width, height, new_size[0], new_size[1])
        image = image.resize(new_size, Image.LANCZOS)

    return image


def _run_rapidocr(image_np: np.ndarray) -> Tuple[List[str], List[float]]:
    """Execute RapidOCR over numpy image array."""
    engine = _get_rapidocr_engine()
    if engine is None:
        return [], []

    results, _ = engine(image_np)
    if not results:
        return [], []

    extracted_lines: List[str] = []
    confidences: List[float] = []

    for item in results:
        if not item or len(item) < 2:
            continue
        text = str(item[1]).strip()
        confidence = 0.85
        if len(item) >= 3:
            try:
                confidence = float(item[2])
            except (TypeError, ValueError):
                confidence = 0.85

        if text:
            extracted_lines.append(text)
            confidences.append(confidence)

    return extracted_lines, confidences


def _run_tesseract(image: Image.Image) -> Tuple[List[str], List[float]]:
    """Fallback OCR using pytesseract if tesseract-ocr binary is installed."""
    try:
        import pytesseract

        raw_text = pytesseract.image_to_string(image, lang="eng")
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        confidences = [0.90] * len(lines)
        return lines, confidences
    except Exception as exc:
        logger.warning("Pytesseract OCR fallback attempted but failed: %s", exc)
        return [], []


def extract_text(file_bytes: bytes, filename: str) -> OCRResult:
    """
    Extract text from an image using lightweight OCR engines (RapidOCR / PyTesseract).
    Guarantees low memory usage and safe execution on Render.
    """
    if not file_bytes:
        raise OCRProcessingError("The uploaded image is empty.")

    # 1. Load image
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.load()
    except Exception as exc:
        logger.exception("Failed to open image bytes for %s", filename)
        raise OCRProcessingError("The uploaded file is not a valid or readable image.") from exc

    width, height = image.size
    logger.info("Starting OCR preprocessing for %s (%dx%d)", filename, width, height)

    # 2. Preprocess image
    try:
        processed_image = _preprocess(image)
        image_np = np.asarray(processed_image, dtype=np.uint8)
    except Exception as exc:
        logger.exception("Image preprocessing failed for %s", filename)
        raise OCRProcessingError("Failed to preprocess image for OCR.") from exc

    # 3. Perform OCR extraction
    extracted_lines: List[str] = []
    confidences: List[float] = []
    ocr_engine_used = "RapidOCR-ONNX"

    # Try RapidOCR
    try:
        extracted_lines, confidences = _run_rapidocr(image_np)
    except Exception as exc:
        logger.warning("RapidOCR execution failed: %s", exc)

    # Fallback to PyTesseract if RapidOCR returned nothing
    if not extracted_lines:
        logger.info("RapidOCR returned no text. Attempting PyTesseract fallback...")
        extracted_lines, confidences = _run_tesseract(processed_image)
        ocr_engine_used = "PyTesseract"

    extracted_text = "\n".join(extracted_lines).strip()

    if not extracted_text:
        logger.warning("No readable text found in image %s using %s", filename, ocr_engine_used)
        raise OCRProcessingError(
            "No readable text was found in this image. Please upload a clear screenshot containing legible text."
        )

    avg_confidence = sum(confidences) / len(confidences) if confidences else 0.85
    avg_confidence = round(min(1.0, max(0.0, avg_confidence)), 3)

    logger.info(
        "OCR successfully extracted %d characters using %s (confidence: %.2f)",
        len(extracted_text),
        ocr_engine_used,
        avg_confidence,
    )

    return OCRResult(
        extracted_text=extracted_text,
        confidence=avg_confidence,
        filename=filename,
        width=width,
        height=height,
        detected_language="en",
        detected_language_name="English",
    )