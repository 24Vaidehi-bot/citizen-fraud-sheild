"""
OCR extraction service using EasyOCR.

Designed for cloud/server deployments such as Render.
"""

import io
import logging
import threading
from typing import List

import numpy as np
from PIL import Image, ImageOps

from app.core.exceptions import OCRProcessingError
from app.models.schemas import OCRResult

logger = logging.getLogger(__name__)

# Singleton EasyOCR reader
_easyocr_reader = None

# Prevent multiple simultaneous initializations
_reader_lock = threading.Lock()

# Image limits to avoid excessive memory usage
MAX_IMAGE_WIDTH = 2500
MAX_IMAGE_HEIGHT = 2500
MIN_IMAGE_WIDTH = 700


def _get_easyocr_reader():
    """
    Lazily initialize EasyOCR only when OCR is actually requested.
    """

    global _easyocr_reader

    if _easyocr_reader is not None:
        return _easyocr_reader

    with _reader_lock:

        # Another request may have initialized it
        if _easyocr_reader is not None:
            return _easyocr_reader

        try:
            logger.info("Loading EasyOCR...")

            import easyocr

            _easyocr_reader = easyocr.Reader(
                ["en"],
                gpu=False,
                verbose=False,
            )

            logger.info("EasyOCR initialized successfully.")

            return _easyocr_reader

        except ImportError as exc:

            logger.exception("EasyOCR is not installed.")

            raise OCRProcessingError(
                "EasyOCR is not installed on the server. "
                "Add 'easyocr' to requirements.txt."
            ) from exc

        except Exception as exc:

            logger.exception(
                "EasyOCR initialization failed."
            )

            raise OCRProcessingError(
                "Failed to initialize the OCR engine."
            ) from exc


def _preprocess(image: Image.Image) -> Image.Image:
    """
    Prepare image for OCR while controlling memory usage.
    """

    # Fix EXIF orientation
    image = ImageOps.exif_transpose(image)

    # Convert transparency to white background
    if (
        image.mode in ("RGBA", "LA")
        or (
            image.mode == "P"
            and "transparency" in image.info
        )
    ):
        background = Image.new(
            "RGB",
            image.size,
            (255, 255, 255),
        )

        if image.mode in ("RGBA", "LA"):
            mask = image.getchannel("A")
            background.paste(
                image,
                mask=mask,
            )
        else:
            image = image.convert("RGBA")
            background.paste(
                image,
                mask=image.getchannel("A"),
            )

        image = background

    else:
        image = image.convert("RGB")

    width, height = image.size

    # Downscale extremely large screenshots
    if width > MAX_IMAGE_WIDTH or height > MAX_IMAGE_HEIGHT:

        scale = min(
            MAX_IMAGE_WIDTH / width,
            MAX_IMAGE_HEIGHT / height,
        )

        new_size = (
            max(1, int(width * scale)),
            max(1, int(height * scale)),
        )

        logger.info(
            "Downscaling large image from %sx%s to %sx%s",
            width,
            height,
            new_size[0],
            new_size[1],
        )

        image = image.resize(
            new_size,
            Image.LANCZOS,
        )

    # Upscale small images
    elif width < MIN_IMAGE_WIDTH:

        scale = MIN_IMAGE_WIDTH / width

        new_size = (
            int(width * scale),
            int(height * scale),
        )

        logger.info(
            "Upscaling small image from %sx%s to %sx%s",
            width,
            height,
            new_size[0],
            new_size[1],
        )

        image = image.resize(
            new_size,
            Image.LANCZOS,
        )

    return image


def extract_text(
    file_bytes: bytes,
    filename: str,
) -> OCRResult:
    """
    Extract English text from an image using EasyOCR.
    """

    if not file_bytes:
        raise OCRProcessingError(
            "The uploaded image is empty."
        )

    # ---------------------------------------------------------
    # Load image
    # ---------------------------------------------------------

    try:

        image = Image.open(
            io.BytesIO(file_bytes)
        )

        image.load()

    except Exception as exc:

        logger.exception(
            "Failed to open image: %s",
            filename,
        )

        raise OCRProcessingError(
            "The uploaded file is not a valid "
            "or readable image."
        ) from exc

    width, height = image.size

    logger.info(
        "Processing image: %s (%sx%s)",
        filename,
        width,
        height,
    )

    # ---------------------------------------------------------
    # Preprocess
    # ---------------------------------------------------------

    try:

        processed = _preprocess(image)

        image_np = np.asarray(
            processed,
            dtype=np.uint8,
        )

    except Exception as exc:

        logger.exception(
            "Image preprocessing failed."
        )

        raise OCRProcessingError(
            "Failed to preprocess the uploaded image."
        ) from exc

    # ---------------------------------------------------------
    # Initialize OCR
    # ---------------------------------------------------------

    reader = _get_easyocr_reader()

    # ---------------------------------------------------------
    # Run OCR
    # ---------------------------------------------------------

    try:

        logger.info(
            "Starting OCR for %s",
            filename,
        )

        results = reader.readtext(
            image_np,
            detail=1,
            paragraph=False,
        )

        logger.info(
            "OCR completed. Detected %d text regions.",
            len(results),
        )

    except Exception as exc:

        logger.exception(
            "OCR extraction failed for %s",
            filename,
        )

        raise OCRProcessingError(
            "The OCR engine failed to process the image."
        ) from exc

    # ---------------------------------------------------------
    # Extract text
    # ---------------------------------------------------------

    extracted_lines: List[str] = []
    confidences: List[float] = []

    for item in results:

        if not item:
            continue

        if len(item) >= 3:

            text = str(
                item[1]
            ).strip()

            try:
                confidence = float(
                    item[2]
                )
            except (
                TypeError,
                ValueError,
            ):
                confidence = 0.0

            if text:

                extracted_lines.append(
                    text
                )

                confidences.append(
                    confidence
                )

        elif len(item) == 2:

            text = str(
                item[1]
            ).strip()

            if text:
                extracted_lines.append(
                    text
                )

    # ---------------------------------------------------------
    # Build final result
    # ---------------------------------------------------------

    extracted_text = "\n".join(
        extracted_lines
    ).strip()

    if confidences:

        avg_confidence = (
            sum(confidences)
            / len(confidences)
        )

    else:

        avg_confidence = (
            0.85
            if extracted_text
            else 0.0
        )

    if not extracted_text:

        raise OCRProcessingError(
            "No readable English text was found "
            "in this image. Please upload a clearer "
            "screenshot containing text."
        )

    logger.info(
        "OCR successfully extracted %d characters.",
        len(extracted_text),
    )

    return OCRResult(
        extracted_text=extracted_text,
        confidence=round(
            avg_confidence,
            3,
        ),
        filename=filename,
        width=width,
        height=height,
        detected_language="en",
        detected_language_name="English",
    )