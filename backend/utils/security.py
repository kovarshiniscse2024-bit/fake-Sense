import os
import re
import uuid


def sanitize_filename(filename: str) -> str:
    # Strip dangerous directory components and special characters
    clean_name = os.path.basename(filename)
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_name)
    return clean_name or "uploaded_media"


def generate_safe_filepath(upload_dir: str, original_filename: str) -> tuple[str, str]:
    """Returns (unique_id, absolute_path)"""
    ext = os.path.splitext(original_filename)[1].lower()
    unique_id = f"media_{uuid.uuid4().hex[:12]}{ext}"
    os.makedirs(upload_dir, exist_ok=True)
    safe_path = os.path.abspath(os.path.join(upload_dir, unique_id))
    return unique_id, safe_path


def generate_verification_id() -> str:
    # Matches format VS-XXXXXX as specified in document (e.g. VS-000001 or hex/digits)
    random_part = uuid.uuid4().hex[:6].upper()
    return f"VS-{random_part}"
