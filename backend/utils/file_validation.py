import os
from typing import Tuple

MAX_IMAGE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi"}

ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png"}
ALLOWED_VIDEO_MIMES = {"video/mp4", "video/quicktime", "video/x-msvideo"}


def detect_file_type(header_bytes: bytes, filename: str) -> Tuple[str, str]:
    """
    Returns (media_type, normalized_format) or raises ValueError
    media_type: 'image' | 'video'
    """
    ext = os.path.splitext(filename.lower())[1]

    # Magic byte inspection
    is_jpeg = header_bytes.startswith(b'\xff\xd8\xff')
    is_png = header_bytes.startswith(b'\x89PNG\r\n\x1a\n')
    is_mp4 = len(header_bytes) >= 12 and (b'ftyp' in header_bytes[:16] or b'moov' in header_bytes[:32])

    if is_jpeg or ext in {".jpg", ".jpeg"}:
        return "image", "jpeg"
    elif is_png or ext == ".png":
        return "image", "png"
    elif is_mp4 or ext in {".mp4", ".mov", ".avi"}:
        return "video", "mp4"

    # Fallback to extension check
    if ext in ALLOWED_IMAGE_EXTENSIONS:
        return "image", ext.replace(".", "")
    elif ext in ALLOWED_VIDEO_EXTENSIONS:
        return "video", ext.replace(".", "")

    raise ValueError(f"Unsupported media format '{ext}'. Allowed: JPG, PNG, MP4")


def validate_file_size(size_bytes: int, media_type: str) -> None:
    if media_type == "image" and size_bytes > MAX_IMAGE_SIZE_BYTES:
        raise ValueError(f"Image exceeds maximum size limit of {MAX_IMAGE_SIZE_BYTES // (1024 * 1024)} MB")
    elif media_type == "video" and size_bytes > MAX_VIDEO_SIZE_BYTES:
        raise ValueError(f"Video exceeds maximum size limit of {MAX_VIDEO_SIZE_BYTES // (1024 * 1024)} MB")
    if size_bytes == 0:
        raise ValueError("Uploaded file is empty (0 bytes)")
