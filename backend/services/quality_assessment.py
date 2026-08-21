import cv2
import numpy as np
from typing import Dict, Any


def assess_image_quality(frame: np.ndarray, media_type: str = "image") -> Dict[str, Any]:
    """
    Evaluates image quality metrics to determine if the visual media possesses
    sufficient signal fidelity for confident digital forensics.
    Analyzes:
      - Resolution (width, height, total pixels) & aspect ratio
      - Sharpness / Blur level (Laplacian variance & Tenengrad gradient)
      - Dynamic range & exposure clipping (underexposure / overexposure)
      - Estimated noise floor sigma
      - JPEG compression blockiness metric
    """
    if frame is None or len(frame.shape) < 2:
        return {
            "status": "insufficient",
            "quality_tier": "INSUFFICIENT",
            "quality_score": 0,
            "warning": "Image stream is empty or invalid.",
            "metrics": {}
        }

    h, w = frame.shape[:2]
    total_pixels = w * h
    aspect_ratio = round(float(w) / max(1, h), 3)

    if len(frame.shape) == 3:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    else:
        gray = frame.copy()

    # 1. Sharpness & Blur via Laplacian Variance & Tenengrad
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    lap_var = float(laplacian.var())

    gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    tenengrad = float(np.mean(gx**2 + gy**2))

    # 2. Dynamic Range & Exposure Clipping
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
    total_samples = float(np.sum(hist))
    under_exposed_pct = float(np.sum(hist[:5])) / max(1.0, total_samples) * 100.0
    over_exposed_pct = float(np.sum(hist[250:])) / max(1.0, total_samples) * 100.0
    dynamic_range = int(np.percentile(gray, 99) - np.percentile(gray, 1))

    # 3. Noise Floor Estimation
    high_pass = cv2.GaussianBlur(gray, (5, 5), 0).astype(np.float32)
    residual = np.abs(gray.astype(np.float32) - high_pass)
    estimated_noise_sigma = float(np.median(residual) / 0.6745)

    # 4. JPEG Blockiness Metric
    blockiness = 0.0
    if h >= 16 and w >= 16:
        diff_h = np.abs(gray[8:-8:8, :] - gray[7:-9:8, :])
        diff_h_inner = np.abs(gray[4:-12:8, :] - gray[3:-13:8, :])
        mean_boundary = float(np.mean(diff_h))
        mean_inner = float(np.mean(diff_h_inner)) + 1e-5
        blockiness = round(max(0.0, (mean_boundary / mean_inner) - 1.0), 3)

    # Determine Quality Tier and Warnings
    warnings = []
    if total_pixels < 160 * 160:
        warnings.append(f"Severely low resolution ({w}x{h} px); spatial pixel artifacts are suppressed.")
    elif total_pixels < 250 * 250:
        warnings.append(f"Low resolution ({w}x{h} px); high-order frequency analysis may have reduced accuracy.")

    if lap_var < 20.0:
        warnings.append("Severe optical or motion blur detected.")
    elif lap_var < 45.0:
        warnings.append("Noticeable optical blur observed.")

    if (under_exposed_pct + over_exposed_pct) > 35.0:
        warnings.append("High exposure clipping observed (under/overexposed regions).")

    if blockiness > 0.45:
        warnings.append("Heavy JPEG compression blocking artifacts present.")

    # Quality score (0 to 100)
    res_score = min(1.0, total_pixels / (800 * 800)) * 40.0
    sharp_score = min(1.0, lap_var / 300.0) * 30.0
    exposure_score = max(0.0, 1.0 - ((under_exposed_pct + over_exposed_pct) / 50.0)) * 15.0
    block_score = max(0.0, 1.0 - (blockiness / 0.6)) * 15.0
    quality_score = int(round(res_score + sharp_score + exposure_score + block_score))
    quality_score = max(5, min(100, quality_score))

    if total_pixels < 120 * 120 or (lap_var < 10.0 and total_pixels < 200 * 200):
        quality_tier = "INSUFFICIENT"
        status = "insufficient"
    elif quality_score >= 70:
        quality_tier = "HIGH"
        status = "completed"
    elif quality_score >= 45:
        quality_tier = "ADEQUATE"
        status = "completed"
    else:
        quality_tier = "LOW"
        status = "completed"

    warning_text = " ".join(warnings) if warnings else "Image resolution and signal fidelity are adequate for forensic analysis."

    is_available = (status == "completed")
    quality_conf = 0.90 if quality_tier == "HIGH" else (0.75 if quality_tier == "ADEQUATE" else (0.50 if quality_tier == "LOW" else 0.20))

    return {
        "status": status,
        "available": is_available,
        "confidence": quality_conf,
        "evidence_status": "INSUFFICIENT_DATA" if quality_tier == "INSUFFICIENT" else "SUPPORTED",
        "signal": "NORMAL" if quality_tier in ["HIGH", "ADEQUATE"] else ("SUSPICIOUS" if quality_tier == "LOW" else "ANOMALOUS"),
        "score": quality_score,
        "suspicion_score": 0.08 if quality_tier in ["HIGH", "ADEQUATE"] else (0.35 if quality_tier == "LOW" else 0.65),
        "reason": warning_text,
        "details": warning_text,
        "module_status": "NORMAL" if quality_tier in ["HIGH", "ADEQUATE"] else ("SUSPICIOUS" if quality_tier == "LOW" else "INSUFFICIENT"),
        "quality_tier": quality_tier,
        "quality_score": quality_score,
        "width": w,
        "height": h,
        "total_pixels": total_pixels,
        "aspect_ratio": aspect_ratio,
        "sharpness_laplacian": round(lap_var, 2),
        "tenengrad_gradient": round(tenengrad, 2),
        "dynamic_range": dynamic_range,
        "noise_sigma": round(estimated_noise_sigma, 2),
        "jpeg_blockiness": blockiness,
        "underexposed_pct": round(under_exposed_pct, 1),
        "overexposed_pct": round(over_exposed_pct, 1),
        "warning": warning_text,
        "quality_limitations": warnings,
        "evidence": warnings,
        "limitations": warnings
    }
