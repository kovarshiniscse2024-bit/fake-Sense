import os
import shutil
import cv2
from PIL import Image
import numpy as np
from typing import Tuple, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
MEDIA_DIR = os.path.join(STORAGE_DIR, "media")
THUMBNAIL_DIR = os.path.join(STORAGE_DIR, "thumbnails")

# Ensure storage directories exist
os.makedirs(MEDIA_DIR, exist_ok=True)
os.makedirs(THUMBNAIL_DIR, exist_ok=True)


def save_verification_media(
    source_temp_path: str,
    verification_id: str,
    safe_filename: str,
    media_type: str
) -> Tuple[str, str, Optional[int], Optional[int], Optional[float], int]:
    """
    Saves media file to permanent verification storage and generates an optimized thumbnail.
    Returns: (media_path, thumbnail_path, width, height, duration, file_size)
    """
    file_ext = os.path.splitext(safe_filename)[1].lower()
    if not file_ext:
        file_ext = ".mp4" if media_type == "video" else ".jpg"

    dest_media_name = f"{verification_id}_{safe_filename}"
    dest_media_path = os.path.join(MEDIA_DIR, dest_media_name)
    shutil.copy2(source_temp_path, dest_media_path)

    file_size = os.path.getsize(dest_media_path)
    thumb_name = f"{verification_id}_thumb.jpg"
    dest_thumb_path = os.path.join(THUMBNAIL_DIR, thumb_name)

    width, height, duration = None, None, 0.0

    try:
        if media_type == "image":
            with Image.open(dest_media_path) as img:
                img_rgb = img.convert("RGB")
                width, height = img_rgb.size
                
                # Create thumbnail with max dimensions 480x480 preserving aspect ratio
                thumb_copy = img_rgb.copy()
                thumb_copy.thumbnail((480, 480), Image.Resampling.LANCZOS)
                thumb_copy.save(dest_thumb_path, "JPEG", quality=85, optimize=True)

        elif media_type == "video":
            cap = cv2.VideoCapture(dest_media_path)
            if cap.isOpened():
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
                total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
                duration = total_frames / fps if fps > 0 else 0.0

                # Read first valid frame for poster/thumbnail
                ret, frame = cap.read()
                cap.release()

                if ret and frame is not None:
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    pil_frame = Image.fromarray(rgb_frame)
                    pil_frame.thumbnail((480, 480), Image.Resampling.LANCZOS)
                    pil_frame.save(dest_thumb_path, "JPEG", quality=85, optimize=True)
                else:
                    # Fallback blank thumbnail if frame read fails
                    blank = Image.new("RGB", (320, 240), color=(15, 23, 42))
                    blank.save(dest_thumb_path, "JPEG", quality=85)
            else:
                blank = Image.new("RGB", (320, 240), color=(15, 23, 42))
                blank.save(dest_thumb_path, "JPEG", quality=85)

    except Exception as e:
        # Fallback in case of processing error so verification never crashes
        if not os.path.exists(dest_thumb_path):
            blank = Image.new("RGB", (320, 240), color=(15, 23, 42))
            blank.save(dest_thumb_path, "JPEG", quality=85)

    return dest_media_path, dest_thumb_path, width, height, duration, file_size


def delete_verification_media(media_path: Optional[str], thumbnail_path: Optional[str]):
    """Safely deletes media and thumbnail from disk upon verification record deletion."""
    if media_path and os.path.exists(media_path):
        try:
            os.remove(media_path)
        except Exception:
            pass

    if thumbnail_path and os.path.exists(thumbnail_path):
        try:
            os.remove(thumbnail_path)
        except Exception:
            pass
