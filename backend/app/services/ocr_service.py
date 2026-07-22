"""
OCR extraction service using Tesseract OCR.

Wraps Tesseract (via pytesseract) to extract English text from screenshot
images. If Tesseract is not installed or processing fails, clear, actionable
errors are raised instead of unhandled exceptions.
"""
import io
import logging
import os
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageOps

from app.core.config import get_settings
from app.core.exceptions import OCRProcessingError
from app.models.schemas import OCRResult

logger = logging.getLogger(__name__)
settings = get_settings()

_LANG_ENGLISH = "eng"

# Tesseract page-segmentation mode 6 = "Assume a single uniform block of text."
_TESSERACT_CONFIG = "--psm 6"


def _get_pytesseract():
    """Lazily import + configure pytesseract.

    Probes PATH and standard Windows/Unix installation paths so Tesseract is found
    even if it was not explicitly added to system PATH during installation.
    """
    try:
        import pytesseract
    except ImportError as exc:  # pragma: no cover
        raise OCRProcessingError(
            "pytesseract library is not installed. Run `pip install pytesseract` and "
            "install the Tesseract OCR engine on the host."
        ) from exc

    # 1. Honour the configured command name or absolute path if it exists / resolves.
    if Path(settings.tesseract_cmd).is_file():
        resolved = settings.tesseract_cmd
    else:
        resolved = shutil.which(settings.tesseract_cmd)

    # 2. Fallback: probe standard Windows install locations when not on PATH.
    if resolved is None and sys.platform == "win32":
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        candidates = [
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ]
        if local_app_data:
            candidates.append(str(Path(local_app_data) / "Programs" / "Tesseract-OCR" / "tesseract.exe"))
        candidates.append(str(Path.home() / "AppData" / "Local" / "Programs" / "Tesseract-OCR" / "tesseract.exe"))

        for candidate in candidates:
            if Path(candidate).is_file():
                resolved = candidate
                break

    # 3. Fallback: probe standard Linux/Unix install locations when not on PATH.
    if resolved is None and sys.platform != "win32":
        unix_candidates = [
            "/usr/bin/tesseract",
            "/usr/local/bin/tesseract",
            "/opt/homebrew/bin/tesseract",
        ]
        for candidate in unix_candidates:
            if Path(candidate).is_file():
                resolved = candidate
                break

    if resolved:
        pytesseract.pytesseract.tesseract_cmd = resolved
    else:
        raise OCRProcessingError(
            "Tesseract OCR engine not found. "
            "Please install Tesseract OCR (e.g. from https://github.com/UB-Mannheim/tesseract/wiki on Windows "
            "or via `apt-get install tesseract-ocr` / `brew install tesseract`) and ensure 'tesseract' is accessible on your system PATH."
        )

    return pytesseract


def _preprocess(image: Image.Image) -> Image.Image:
    """Preprocess image to improve OCR accuracy on screenshot crops:
    transpose orientation, flatten alpha channel to white background,
    convert to grayscale, and upscale small images."""
    image = ImageOps.exif_transpose(image)
    if image.mode in ("RGBA", "LA") or (image.mode == "P" and "transparency" in image.info):
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image, mask=image.split()[-1] if image.mode in ("RGBA", "LA") else None)
        image = background
    image = image.convert("L")
    if image.width < 900:
        scale = 900 / image.width
        image = image.resize((int(image.width * scale), int(image.height * scale)), Image.LANCZOS)
    return image


def extract_text(file_bytes: bytes, filename: str) -> OCRResult:
    """Run OCR over raw image bytes and return extracted English text + metadata."""
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.load()
    except Exception as exc:
        raise OCRProcessingError("The uploaded file is not a valid, readable image.") from exc

    width, height = image.size
    processed = _preprocess(image)

    pytesseract = _get_pytesseract()

    # 1. Extract text preserving layout & punctuation
    try:
        raw_extracted = pytesseract.image_to_string(processed, lang=_LANG_ENGLISH).strip()
    except getattr(pytesseract, "TesseractNotFoundError", Exception) as exc:
        raise OCRProcessingError(
            "Tesseract OCR engine not found on host system. Please install Tesseract OCR."
        ) from exc
    except getattr(pytesseract, "TesseractError", Exception) as exc:
        raise OCRProcessingError(
            f"Tesseract OCR engine failed to process the image. Details: {exc}"
        ) from exc
    except Exception as exc:
        raise OCRProcessingError(
            f"OCR engine error during text extraction. Details: {exc}"
        ) from exc

    # 2. Extract word confidences for confidence score
    confidences: list[float] = []
    try:
        data = pytesseract.image_to_data(
            processed,
            lang=_LANG_ENGLISH,
            output_type=pytesseract.Output.DICT,
        )
        for conf in data.get("conf", []):
            try:
                c = float(conf)
                if c >= 0:
                    confidences.append(c)
            except (TypeError, ValueError):
                continue
    except Exception:
        pass

    extracted_text = raw_extracted.strip()
    avg_confidence = (sum(confidences) / len(confidences) / 100) if confidences else (0.85 if extracted_text else 0.0)

    if not extracted_text:
        raise OCRProcessingError(
            "No readable English text was found in this image. "
            "Please try a clearer, higher-resolution screenshot containing English text."
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


