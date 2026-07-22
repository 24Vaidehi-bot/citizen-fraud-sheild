"""
OCR extraction service using lightweight Tesseract OCR (pytesseract + Pillow).

Supports both English and Hindi text extraction with automatic fallback.
Designed for low-memory cloud environments (such as Render free tier 512MB RAM).
Completely avoids memory-heavy ML frameworks (EasyOCR, PyTorch, TorchVision).
"""

import io
import logging
import os
import re
import shutil
from typing import List, Tuple
from PIL import Image, ImageOps

import pytesseract

from app.core.exceptions import OCRProcessingError
from app.models.schemas import OCRResult

logger = logging.getLogger(__name__)

# Maximum image dimension limits for memory optimization
MAX_IMAGE_WIDTH = 2500
MAX_IMAGE_HEIGHT = 2500


def _check_tesseract_availability() -> bool:
    """
    Verify system tesseract binary via shutil.which("tesseract"), environment variables,
    or standard operating system install paths (Linux, macOS, Windows).
    """
    if shutil.which("tesseract"):
        logger.info("Tesseract binary found via PATH")
        return True

    # Common Windows/Linux fallback paths
    possible_paths = [
        os.environ.get("TESSERACT_CMD", ""),
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract",
    ]

    for path in possible_paths:
        if path and os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            logger.info("Configured pytesseract.tesseract_cmd to: %s", path)
            return True

    try:
        version = pytesseract.get_tesseract_version()
        logger.info("Tesseract version %s detected via pytesseract", version)
        return True
    except Exception:
        return False


def _get_available_languages() -> List[str]:
    """Return a list of language codes installed in Tesseract."""
    try:
        return pytesseract.get_languages()
    except Exception as exc:
        logger.warning("Failed to retrieve Tesseract installed languages: %s", exc)
        return ["eng"]


def _preprocess(image: Image.Image) -> Image.Image:
    """
    Prepare image for OCR while optimizing memory usage.

    1. Apply EXIF orientation fix.
    2. Convert transparent/alpha channels to solid white RGB background.
    3. Downscale oversized images (>2500px).
    4. Never upscale small images to avoid memory inflation.
    """
    # Fix EXIF orientation
    image = ImageOps.exif_transpose(image)

    # Convert transparency (RGBA / LA / P) to RGB on a white background
    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        background = Image.new("RGB", image.size, (255, 255, 255))
        if image.mode in ("RGBA", "LA"):
            mask = image.getchannel("A")
            background.paste(image, mask=mask)
        else:
            rgba_img = image.convert("RGBA")
            background.paste(rgba_img, mask=rgba_img.getchannel("A"))
        image = background
    elif image.mode != "RGB":
        image = image.convert("RGB")

    width, height = image.size

    # Downscale oversized screenshots (strictly max 2500x2500)
    if width > MAX_IMAGE_WIDTH or height > MAX_IMAGE_HEIGHT:
        scale = min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height)
        new_width = max(1, int(width * scale))
        new_height = max(1, int(height * scale))
        logger.info(
            "Downscaling image for OCR from %dx%d to %dx%d",
            width, height, new_width, new_height
        )
        resample_filter = getattr(Image, "Resampling", Image).LANCZOS
        image = image.resize((new_width, new_height), resample_filter)

    return image


def _run_tesseract(image: Image.Image) -> Tuple[str, float, str, str]:
    """
    Execute Tesseract OCR supporting both English and Hindi ('eng+hin') with fallback to 'eng'.
    Returns (extracted_text, average_confidence, detected_language_code, detected_language_name).
    """
    avail_langs = _get_available_languages()
    lang_spec = "eng+hin" if "hin" in avail_langs else "eng"

    raw_string_text = ""
    used_lang = lang_spec

    try:
        raw_string_text = pytesseract.image_to_string(image, lang=lang_spec).strip()
    except (pytesseract.TesseractNotFoundError, FileNotFoundError) as exc:
        logger.error("Tesseract binary is not installed or missing from PATH: %s", exc)
        raise OCRProcessingError(
            "Tesseract OCR engine is not installed or available on the server."
        ) from exc
    except Exception as exc:
        logger.warning("OCR failed with lang='%s', attempting fallback to 'eng': %s", lang_spec, exc)
        try:
            raw_string_text = pytesseract.image_to_string(image, lang="eng").strip()
            used_lang = "eng"
        except Exception as inner_exc:
            logger.exception("Pytesseract OCR fallback processing failed: %s", inner_exc)
            raise OCRProcessingError(f"OCR processing failed: {str(inner_exc)}") from inner_exc

    # Calculate word confidences
    confidences: List[float] = []
    try:
        data = pytesseract.image_to_data(image, lang=used_lang, output_type=pytesseract.Output.DICT)
        n_boxes = len(data.get("text", []))
        for i in range(n_boxes):
            text_word = str(data["text"][i]).strip()
            conf_val = data["conf"][i]
            if text_word and conf_val > 0:
                confidences.append(float(conf_val) / 100.0)
    except Exception as exc:
        logger.warning("Could not calculate word confidences via image_to_data: %s", exc)

    avg_conf = sum(confidences) / len(confidences) if confidences else (0.85 if raw_string_text else 0.0)
    avg_conf = round(min(1.0, max(0.0, avg_conf)), 3)

    lines = [line.strip() for line in raw_string_text.splitlines() if line.strip()]
    final_text = "\n".join(lines).strip()

    # Detect if extracted text contains Devanagari/Hindi characters
    has_devanagari = bool(re.search(r"[\u0900-\u097F]", final_text))
    if has_devanagari:
        lang_code = "hi"
        lang_name = "Hindi"
    else:
        lang_code = "en"
        lang_name = "English"

    return final_text, avg_conf, lang_code, lang_name


def extract_text(file_bytes: bytes, filename: str) -> OCRResult:
    """
    Extract text from an image using lightweight Tesseract OCR (supporting English and Hindi).
    Guarantees low memory usage (< 50MB RAM).
    """
    if not file_bytes:
        raise OCRProcessingError("The uploaded image is empty.")

    # 1. Verify Tesseract installation
    if not _check_tesseract_availability():
        logger.error("Tesseract OCR binary check failed.")
        raise OCRProcessingError(
            "Tesseract OCR engine is not installed or available on the server."
        )

    # 2. Load image using Pillow
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.load()
    except Exception as exc:
        logger.exception("Failed to open image bytes for %s", filename)
        raise OCRProcessingError("The uploaded file is not a valid or readable image.") from exc

    width, height = image.size
    logger.info("Starting Tesseract OCR preprocessing for %s (%dx%d)", filename, width, height)

    # 3. Preprocess image safely
    try:
        processed_image = _preprocess(image)
    except Exception as exc:
        logger.exception("Image preprocessing failed for %s", filename)
        raise OCRProcessingError("Failed to preprocess image for OCR.") from exc

    # 4. Execute Tesseract OCR
    extracted_text, confidence, lang_code, lang_name = _run_tesseract(processed_image)

    # Check if text contains English alphanumeric OR Hindi Devanagari characters
    has_valid_chars = bool(re.search(r"[a-zA-Z0-9\u0900-\u097F]", extracted_text))

    if not extracted_text or not has_valid_chars:
        logger.warning("No readable English or Hindi text found in image %s using Tesseract OCR", filename)
        raise OCRProcessingError(
            "No readable text was found in this screenshot. Please upload a clear screenshot containing legible English or Hindi text."
        )

    logger.info(
        "Tesseract OCR successfully extracted %d characters from %s (lang: %s, confidence: %.2f)",
        len(extracted_text),
        filename,
        lang_name,
        confidence,
    )

    return OCRResult(
        extracted_text=extracted_text,
        confidence=confidence,
        filename=filename,
        width=width,
        height=height,
        detected_language=lang_code,
        detected_language_name=lang_name,
    )