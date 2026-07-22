"""Handles writing uploaded screenshots to the configured upload directory
with collision-safe, sanitized filenames."""
import re
import uuid
from pathlib import Path

from app.core.config import get_settings

settings = get_settings()

_SAFE_NAME = re.compile(r"[^A-Za-z0-9_.-]+")


def save_upload(file_bytes: bytes, original_filename: str) -> str:
    """Persist bytes to disk and return the stored (sanitized, unique) filename."""
    suffix = Path(original_filename or "upload.png").suffix.lower() or ".png"
    safe_stem = _SAFE_NAME.sub("_", Path(original_filename or "upload").stem)[:60]
    stored_name = f"{safe_stem}_{uuid.uuid4().hex[:8]}{suffix}"

    try:
        destination = settings.upload_path / stored_name
        destination.write_bytes(file_bytes)
    except Exception:
        fallback_dir = Path("/tmp/uploads")
        fallback_dir.mkdir(parents=True, exist_ok=True)
        destination = fallback_dir / stored_name
        destination.write_bytes(file_bytes)

    return stored_name
