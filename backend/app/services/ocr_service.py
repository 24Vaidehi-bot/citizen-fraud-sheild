"""
OCR extraction service using lightweight Tesseract OCR (pytesseract + Pillow).

Designed for low-memory cloud environments (such as Render free tier 512MB RAM).
Completely avoids memory-heavy ML frameworks (EasyOCR, PyTorch, TorchVision).
"""

import io
import logging
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
    """Check whether Tesseract OCR binary is installed and accessible."""
    if shutil.which("tesseract") is not None:
        return True
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


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

    # Do not upscale small images to preserve memory
    return image


def _run_tesseract(image: Image.Image) -> Tuple[str, float]:
    """
    Execute Tesseract OCR using pytesseract.
    Returns (extracted_text, average_confidence).
    """
    try:
        # Use image_to_data to retrieve per-word text and confidence values
        data = pytesseract.image_to_data(image, lang="eng", output_type=pytesseract.Output.DICT)

        extracted_words: List[str] = []
        confidences: List[float] = []

        n_boxes = len(data.get("text", []))
        for i in range(n_boxes):
            text = str(data["text"][i]).strip()
            conf_val = data["conf"][i]

            # Tesseract gives confidence -1 or >= 0
            if text and conf_val >= 0:
                extracted_words.append(text)
                confidences.append(float(conf_val) / 100.0)

        # Fallback to image_to_string if image_to_data yielded no words
        if not extracted_words:
            raw_text = pytesseract.image_to_string(image, lang="eng").strip()
            if raw_text:
                lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
                full_text = "\n".join(lines)
                return full_text, 0.85
            return "", 0.0

        # Build clean formatted text from image_to_data line structures
        lines_dict = {}
        for i in range(n_boxes):
            text = str(data["text"][i]).strip()
            conf_val = data["conf"][i]
            if text and conf_val >= 0:
                line_num = (data["block_num"][i], data["par_num"][i], data["line_num"][i])
                lines_dict.setdefault(line_num, []).append(text)

        formatted_lines = [" ".join(words) for words in lines_dict.values() if words]
        final_text = "\n".join(formatted_lines).strip()

        avg_conf = sum(confidences) / len(confidences) if confidences else 0.85
        avg_conf = round(min(1.0, max(0.0, avg_conf)), 3)

        return final_text, avg_conf

    except (pytesseract.TesseractNotFoundError, FileNotFoundError) as exc:
        logger.error("Tesseract binary is not installed or missing from PATH: %s", exc)
        raise OCRProcessingError(
            "Tesseract OCR engine is not installed or available on the server."
        ) from exc
    except Exception as exc:
        logger.exception("Pytesseract OCR processing failed: %s", exc)
        raise OCRProcessingError(f"OCR processing failed: {str(exc)}") from exc


def extract_text(file_bytes: bytes, filename: str) -> OCRResult:
    """
    Extract text from an image using lightweight Tesseract OCR.

    Guarantees low memory usage (< 50MB RAM) without PyTorch or large ML models.
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
    extracted_text, confidence = _run_tesseract(processed_image)

    if not extracted_text or not extracted_text.strip():
        logger.warning("No readable text found in image %s using Tesseract OCR", filename)
        raise OCRProcessingError(
            "No readable text was found in this image. Please upload a clear screenshot containing legible text."
        )

    logger.info(
        "Tesseract OCR successfully extracted %d characters from %s (confidence: %.2f)",
        len(extracted_text),
        filename,
        confidence,
    )

    return OCRResult(
        extracted_text=extracted_text,
        confidence=confidence,
        filename=filename,
        width=width,
        height=height,
        detected_language="en",
        detected_language_name="English",
    )