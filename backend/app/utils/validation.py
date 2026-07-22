import io
import logging
from PIL import Image
from fastapi import UploadFile

from app.core.config import get_settings
from app.core.exceptions import FileTooLargeError, UnsupportedFileTypeError

logger = logging.getLogger(__name__)
settings = get_settings()

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
ALLOWED_PIL_FORMATS = {"PNG", "JPEG", "MPO", "WEBP"}
MAX_DIMENSION = 5000  # pixels
MAX_PIXELS = 25_000_000  # 25MP


def _sniff_content_type(file_bytes: bytes) -> str | None:
    """Return a best-guess MIME type from the first few magic bytes."""
    if file_bytes[:4] == b"\x89PNG":
        return "image/png"
    if file_bytes[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WEBP":
        return "image/webp"
    return None


def validate_image_upload(file: UploadFile, file_bytes: bytes) -> None:
    """
    Validate image file size, magic bytes, MIME type, and actual PIL image structure.
    """
    if not file_bytes or len(file_bytes) == 0:
        raise UnsupportedFileTypeError("The uploaded file is empty.")

    if len(file_bytes) > settings.max_upload_bytes:
        raise FileTooLargeError(
            f"File size ({len(file_bytes) / (1024*1024):.2f}MB) exceeds the {settings.max_upload_mb}MB upload limit."
        )

    # Content-type check (declared or magic bytes)
    declared = (file.content_type or "").lower().split(";")[0].strip()
    sniffed = _sniff_content_type(file_bytes)
    
    if declared not in ALLOWED_CONTENT_TYPES and sniffed is None:
        raise UnsupportedFileTypeError(
            f"Unsupported file type '{declared}'. Please upload a PNG, JPG, or WEBP image."
        )

    # Actual PIL Image content validation
    try:
        image = Image.open(io.BytesIO(file_bytes))
        image_format = image.format
        if image_format not in ALLOWED_PIL_FORMATS:
            raise UnsupportedFileTypeError(
                f"Invalid or unsupported image format '{image_format}'. Please upload PNG, JPG, or WEBP."
            )
        
        width, height = image.size
        if width * height > MAX_PIXELS or width > MAX_DIMENSION or height > MAX_DIMENSION:
            raise FileTooLargeError(
                f"Image dimensions ({width}x{height}) are too large. Maximum supported dimension is {MAX_DIMENSION}px."
            )

    except (UnsupportedFileTypeError, FileTooLargeError):
        raise
    except Exception as exc:
        logger.exception("Failed to parse uploaded image bytes: %s", file.filename)
        raise UnsupportedFileTypeError(
            "The uploaded file could not be parsed as a valid image. Please ensure it is a valid PNG, JPG, or WEBP file."
        ) from exc

