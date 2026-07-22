"""Small, focused helpers for validating uploaded screenshots."""
from fastapi import UploadFile

from app.core.config import get_settings
from app.core.exceptions import FileTooLargeError, UnsupportedFileTypeError

settings = get_settings()

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}

# Magic-byte signatures for the image formats we accept.
_MAGIC = {
    b"\x89PNG": "image/png",
    b"\xff\xd8\xff": "image/jpeg",
    b"RIFF": None,  # WEBP — checked via RIFF….WEBP header below
}


def _sniff_content_type(file_bytes: bytes) -> str | None:
    """Return a best-guess MIME type from the first few magic bytes."""
    if file_bytes[:4] == b"\x89PNG":
        return "image/png"
    if file_bytes[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    # WEBP: starts with RIFF????WEBP
    if file_bytes[:4] == b"RIFF" and file_bytes[8:12] == b"WEBP":
        return "image/webp"
    return None


def validate_image_upload(file: UploadFile, file_bytes: bytes) -> None:
    if len(file_bytes) == 0:
        raise UnsupportedFileTypeError("The uploaded file is empty.")
    if len(file_bytes) > settings.max_upload_bytes:
        raise FileTooLargeError(
            f"File exceeds the {settings.max_upload_mb}MB upload limit."
        )
    # Accept declared MIME type OR fall back to magic-byte detection so that
    # browsers reporting application/octet-stream don't get rejected.
    declared = (file.content_type or "").lower().split(";")[0].strip()
    if declared not in ALLOWED_CONTENT_TYPES:
        sniffed = _sniff_content_type(file_bytes)
        if sniffed is None:
            raise UnsupportedFileTypeError(
                f"Unsupported file type '{declared}'. Please upload a PNG, JPG, or WEBP image."
            )
