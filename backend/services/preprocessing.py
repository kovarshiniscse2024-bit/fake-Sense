import os
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Any, Optional


class PreprocessedMedia:
    def __init__(
        self,
        media_type: str,
        file_path: str,
        frames: List[np.ndarray],
        pil_images: List[Image.Image],
        metadata: Dict[str, Any],
        has_audio: bool = False,
        audio_samples: Optional[np.ndarray] = None,
        duration: float = 0.0
    ):
        self.media_type = media_type  # 'image' | 'video'
        self.file_path = file_path
        self.frames = frames  # List of BGR numpy arrays (first frame is main for images)
        self.pil_images = pil_images
        self.metadata = metadata
        self.has_audio = has_audio
        self.audio_samples = audio_samples
        self.duration = duration

    @property
    def primary_frame(self) -> np.ndarray:
        return self.frames[0] if self.frames else np.zeros((256, 256, 3), dtype=np.uint8)

    @property
    def primary_pil(self) -> Image.Image:
        return self.pil_images[0] if self.pil_images else Image.new("RGB", (256, 256))


def preprocess_media(file_path: str, media_type: str) -> PreprocessedMedia:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    if media_type == "image":
        return _preprocess_image(file_path)
    elif media_type == "video":
        return _preprocess_video(file_path)
    else:
        raise ValueError(f"Unknown media type: {media_type}")


def _preprocess_image(file_path: str) -> PreprocessedMedia:
    # Read with PIL for EXIF and color safety
    pil_img = Image.open(file_path)
    pil_img_rgb = pil_img.convert("RGB")

    # Read with OpenCV for CV operations
    cv_img = cv2.imread(file_path)
    if cv_img is None:
        # Fallback convert PIL to OpenCV BGR
        cv_img = cv2.cvtColor(np.array(pil_img_rgb), cv2.COLOR_RGB2BGR)

    h, w = cv_img.shape[:2]
    meta = {
        "width": w,
        "height": h,
        "format": pil_img.format or "JPEG",
        "mode": pil_img.mode,
        "filesize_bytes": os.path.getsize(file_path)
    }

    return PreprocessedMedia(
        media_type="image",
        file_path=file_path,
        frames=[cv_img],
        pil_images=[pil_img_rgb],
        metadata=meta,
        has_audio=False,
        duration=0.0
    )


def _preprocess_video(file_path: str) -> PreprocessedMedia:
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        raise ValueError("Could not open video stream for analysis")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration = total_frames / fps if fps > 0 else 0.0

    # Sample uniformly up to 16 key representative frames
    num_samples = min(16, max(1, total_frames))
    indices = np.linspace(0, total_frames - 1, num_samples, dtype=int)

    extracted_frames = []
    pil_images = []

    last_frame = None
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
        ret, frame = cap.read()
        if not ret or frame is None:
            continue

        # Avoid duplicate frames via basic MSE check
        if last_frame is not None and frame.shape == last_frame.shape:
            diff = np.mean((frame.astype("float") - last_frame.astype("float")) ** 2)
            if diff < 1.0:
                continue

        extracted_frames.append(frame)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_images.append(Image.fromarray(rgb_frame))
        last_frame = frame

    cap.release()

    if not extracted_frames:
        # Fallback frame
        dummy = np.zeros((max(height, 256), max(width, 256), 3), dtype=np.uint8)
        extracted_frames = [dummy]
        pil_images = [Image.fromarray(dummy)]

    # Check for basic audio signature by inspecting file headers or track markers
    has_audio = False
    try:
        with open(file_path, "rb") as f:
            content = f.read(50000)
            if b"mp4a" in content or b"soun" in content or b"aac" in content or b"audio" in content:
                has_audio = True
    except Exception:
        has_audio = False

    meta = {
        "width": width,
        "height": height,
        "fps": round(fps, 2),
        "total_frames": total_frames,
        "sampled_frames": len(extracted_frames),
        "duration_seconds": round(duration, 2),
        "filesize_bytes": os.path.getsize(file_path)
    }

    return PreprocessedMedia(
        media_type="video",
        file_path=file_path,
        frames=extracted_frames,
        pil_images=pil_images,
        metadata=meta,
        has_audio=has_audio,
        duration=duration
    )
