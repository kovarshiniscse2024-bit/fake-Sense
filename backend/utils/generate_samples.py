import os
import cv2
import numpy as np
from PIL import Image, ImageDraw
import piexif

SAMPLES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "samples")
os.makedirs(SAMPLES_DIR, exist_ok=True)


def create_samples():
    print("Generating calibrated demo sample media in:", SAMPLES_DIR)

    # 1. Sample Real Portrait (Camera noise, genuine EXIF)
    real_img = Image.new("RGB", (512, 512), color=(220, 215, 205))
    draw = ImageDraw.Draw(real_img)
    for y in range(512):
        shade = int(180 + 40 * (y / 512))
        draw.line([(0, y), (512, y)], fill=(shade - 20, shade, shade + 10))

    # Face base
    draw.ellipse([156, 120, 356, 380], fill=(235, 195, 165))
    # Eyes
    draw.ellipse([200, 210, 235, 230], fill=(255, 255, 255))
    draw.ellipse([210, 215, 225, 230], fill=(45, 55, 75))
    draw.ellipse([275, 210, 310, 230], fill=(255, 255, 255))
    draw.ellipse([285, 215, 300, 230], fill=(45, 55, 75))
    # Nose & Mouth
    draw.line([(256, 235), (256, 280)], fill=(195, 145, 120), width=3)
    draw.arc([220, 290, 292, 330], start=20, end=160, fill=(185, 90, 85), width=4)
    # Hair
    draw.arc([140, 90, 372, 280], start=170, end=370, fill=(45, 35, 30), width=30)

    # Photographic sensor noise
    arr = np.array(real_img, dtype=np.float32)
    noise = np.random.normal(0, 3.5, arr.shape)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    real_pil = Image.fromarray(arr)

    zeroth_ifd = {
        piexif.ImageIFD.Make: b"Sony",
        piexif.ImageIFD.Model: b"ILCE-7RM4",
        piexif.ImageIFD.Software: b"Sony Alpha Firmware 2.0"
    }
    exif_ifd = {
        piexif.ExifIFD.ExposureTime: (1, 250),
        piexif.ExifIFD.FNumber: (28, 10),
        piexif.ExifIFD.ISOSpeedRatings: 200,
        piexif.ExifIFD.DateTimeOriginal: b"2026:05:14 10:45:22"
    }
    exif_dict = {"0th": zeroth_ifd, "Exif": exif_ifd}
    exif_bytes = piexif.dump(exif_dict)

    real_path = os.path.join(SAMPLES_DIR, "sample_real_portrait.jpg")
    real_pil.save(real_path, "JPEG", quality=95, exif=exif_bytes)
    print("Created:", real_path)

    # 2. Sample Manipulated Portrait (Spliced face patch, extreme boundary seam gradient, editing tag)
    manip_img = real_pil.copy()
    manip_arr = np.array(manip_img, dtype=np.float32)

    # Insert distinct spliced patch with high edge seam and color temperature shift
    y1, y2, x1, x2 = 180, 350, 180, 330
    # Invert contrast & apply synthetic noise
    patch = manip_arr[y1:y2, x1:x2]
    patch[:, :, 0] = np.clip(patch[:, :, 0] * 1.5, 0, 255)  # Boost red channel
    patch[:, :, 2] = np.clip(patch[:, :, 2] * 0.6, 0, 255)  # Drop blue channel
    # Add heavy synthetic DCT frequency grid pattern
    gy, gx = np.mgrid[0:(y2-y1), 0:(x2-x1)]
    grid = 45 * np.sin(gx / 1.8) * np.cos(gy / 1.8)
    patch[:, :, 1] = np.clip(patch[:, :, 1] + grid, 0, 255)
    
    manip_arr[y1:y2, x1:x2] = patch
    
    # Sharp high-contrast boundary seam
    manip_arr[y1-2:y1+2, x1:x2] = [255, 0, 0]
    manip_arr[y2-2:y2+2, x1:x2] = [255, 0, 0]
    manip_arr[y1:y2, x1-2:x1+2] = [255, 0, 0]
    manip_arr[y1:y2, x2-2:x2+2] = [255, 0, 0]

    manip_pil = Image.fromarray(manip_arr.astype(np.uint8))

    zeroth_manip = {
        piexif.ImageIFD.Make: b"Unknown",
        piexif.ImageIFD.Software: b"Adobe Photoshop 2025 (DeepFaceLab v2)"
    }
    exif_manip_bytes = piexif.dump({"0th": zeroth_manip})
    manip_path = os.path.join(SAMPLES_DIR, "sample_manipulated_portrait.jpg")
    manip_pil.save(manip_path, "JPEG", quality=75, exif=exif_manip_bytes)
    print("Created:", manip_path)

    # 3. Sample Clean Scene
    scene_img = Image.new("RGB", (600, 400), color=(135, 206, 235))
    d_scene = ImageDraw.Draw(scene_img)
    d_scene.rectangle([0, 250, 600, 400], fill=(34, 139, 34))
    d_scene.ellipse([450, 50, 530, 130], fill=(255, 223, 0))
    s_arr = np.array(scene_img, dtype=np.float32)
    s_arr = np.clip(s_arr + np.random.normal(0, 2.5, s_arr.shape), 0, 255).astype(np.uint8)
    scene_pil = Image.fromarray(s_arr)

    zeroth_scene = {
        piexif.ImageIFD.Make: b"Canon",
        piexif.ImageIFD.Model: b"Canon EOS R5",
    }
    scene_path = os.path.join(SAMPLES_DIR, "sample_real_landscape.jpg")
    scene_pil.save(scene_path, "JPEG", quality=95, exif=piexif.dump({"0th": zeroth_scene}))
    print("Created:", scene_path)

    # 4. Sample Video
    video_path = os.path.join(SAMPLES_DIR, "sample_test_video.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_path, fourcc, 24.0, (400, 400))

    for frame_idx in range(48):
        frame = np.zeros((400, 400, 3), dtype=np.uint8)
        frame[:] = (70, 60, 50)
        cx = 200 + int(10 * np.sin(frame_idx / 4.0))
        cy = 200
        cv2.circle(frame, (cx, cy), 90, (180, 210, 235), -1)
        cv2.circle(frame, (cx - 30, cy - 20), 12, (255, 255, 255), -1)
        cv2.circle(frame, (cx - 30, cy - 20), 6, (50, 30, 20), -1)
        cv2.circle(frame, (cx + 30, cy - 20), 12, (255, 255, 255), -1)
        cv2.circle(frame, (cx + 30, cy - 20), 6, (50, 30, 20), -1)
        mouth_open = int(8 + 6 * np.sin(frame_idx / 2.0))
        cv2.ellipse(frame, (cx, cy + 40), (25, mouth_open), 0, 0, 360, (80, 90, 190), -1)
        out.write(frame)

    out.release()
    print("Created:", video_path)


if __name__ == "__main__":
    create_samples()
