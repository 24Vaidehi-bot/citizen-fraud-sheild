"""
OCR extraction service using EasyOCR.

Extracts English text from screenshot images using EasyOCR (PyTorch / pure Python).
Does not require any system-installed binary executables (such as Tesseract), making it
fully compatible with Vercel and serverless environments.
"""
import io
import logging
from typing import List

import numpy as np
from PIL import Image, ImageOps

from app.core.exceptions import OCRProcessingError
from app.models.schemas import OCRResult

logger = logging.getLogger(__name__)

# Module-level singleton for EasyOCR Reader to avoid reloading models on every invocation
_easyocr_reader = None


def _get_easyocr_reader():
    """Lazily import and initialize the EasyOCR reader singleton.

    Runs in CPU mode (gpu=False) for serverless and cloud compatibility.
    """
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr

            logger.info("Initializing EasyOCR reader engine for English...")
            _easyocr_reader = easyocr.Reader(["en"], gpu=False)
        except ImportError as exc:
            raise OCRProcessingError(
                "EasyOCR library is not installed. Run `pip install easyocr`."
            ) from exc
        except Exception as exc:
            logger.error("EasyOCR initialization failed: %s", exc)
            raise OCRProcessingError(
                f"EasyOCR engine initialization failed. Details: {exc}"
            ) from exc
    return _easyocr_reader


def _preprocess(image: Image.Image) -> Image.Image:
    """Preprocess image to improve OCR accuracy on screenshot crops:
    transpose orientation, flatten alpha channel to white background,
    convert to RGB, and upscale small images."""
    image = ImageOps.exif_transpose(image)
    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        background = Image.new("RGB", image.size, (255, 255, 255))
        mask = image.split()[-1] if image.mode in ("RGBA", "LA") else None
        background.paste(image, mask=mask)
        image = background
    else:
        image = image.convert("RGB")

    if image.width < 900:
        scale = 900 / image.width
        image = image.resize((int(image.width * scale), int(image.height * scale)), Image.LANCZOS)
    return image


def extract_text(file_bytes: bytes, filename: str) -> OCRResult:
    """Run OCR over raw image bytes using EasyOCR and return extracted text + metadata."""
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.load()
    except Exception as exc:
        raise OCRProcessingError("The uploaded file is not a valid, readable image.") from exc

    width, height = image.size
    processed = _preprocess(image)
    image_np = np.array(processed)

    reader = _get_easyocr_reader()

    try:
        results = reader.readtext(image_np, detail=1)
    except Exception as exc:
        logger.error("OCR extraction failed: %s", exc)
        raise OCRProcessingError(
            f"OCR engine failed to process the image. Details: {exc}"
        ) from exc

    extracted_lines: List[str] = []
    confidences: List[float] = []

    for item in results:
        # EasyOCR item shape with detail=1: (bbox, text, confidence)
        if len(item) >= 3:
            text = str(item[1]).strip()
            confidence = float(item[2])
            if text:
                extracted_lines.append(text)
                confidences.append(confidence)
        elif len(item) == 2:
            text = str(item[1]).strip()
            if text:
                extracted_lines.append(text)

    extracted_text = "\n".join(extracted_lines).strip()
    avg_confidence = (sum(confidences) / len(confidences)) if confidences else (0.85 if extracted_text else 0.0)

    if not extracted_text:
        raise OCRProcessingError(
            "No readable English text was found in this image. "
            "Please try a clearer, higher-resolution screenshot containing text."
        )

    return OCRResult(
        extracted_text=extracted_text,
        confidence=round(avg_confidence, 3),
        filename=filename,
        width=width,
        height=height,
        detected_language="en",
        detected_language_name="English",
    )
