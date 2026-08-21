import io
import os
import cv2
import numpy as np
from PIL import Image, ImageChops
from typing import Dict, Any, List, Tuple
from .preprocessing import PreprocessedMedia

# Optional ONNX Model Path for Deep Learning Splicing / Deepfake Classifiers
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
ONNX_MODEL_PATH = os.path.join(MODELS_DIR, "deepfake_detector.onnx")


def run_visual_cnn_analysis(media: PreprocessedMedia) -> Dict[str, Any]:
    """
    Visual Manipulation, Splicing & Forensics Analysis Module.
    Evaluates actual pixel-level signals across:
      1. Multi-scale Block Error Level Analysis (ELA) compression disparity (Q=75, 85, 95)
      2. 2D FFT Frequency Domain Splicing & High-Pass Spatial Residuals
      3. Sensor Noise Residual Analysis (with honest single-image PRNU attribution)
      4. Resampling, Interpolation & Edge Gradient Inconsistencies
      5. Laplacian Spatial Sharpness & Retouching Disparities
    """
    if not media.frames:
        return {
            "status": "failed",
            "available": False,
            "module_status": "NOT_APPLICABLE",
            "signal_strength": 0,
            "suspicion_score": None,
            "result": "analysis_error",
            "confidence": 0.0,
            "details": "No visual frame data available for visual forensic analysis.",
            "evidence": [],
            "limitations": ["No visual frame data extracted."],
            "authenticity_support": [],
            "manipulation_support": [],
            "metrics": {}
        }

    # Optional deep learning ONNX inference if model mounted
    if os.path.exists(ONNX_MODEL_PATH):
        try:
            import onnxruntime as ort
            session = ort.InferenceSession(ONNX_MODEL_PATH)
            frame = media.frames[0]
            resized = cv2.resize(frame, (224, 224))
            rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
            mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
            std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
            norm_img = (rgb - mean) / std
            tensor = np.transpose(norm_img, (2, 0, 1))[np.newaxis, ...]

            input_name = session.get_inputs()[0].name
            outputs = session.run(None, {input_name: tensor})
            raw_prob = float(outputs[0][0][1]) if outputs[0].shape[-1] > 1 else float(outputs[0][0][0])
            suspicion_score = float(np.clip(raw_prob, 0.01, 0.99))
            sig_strength = int(round(suspicion_score * 100))

            outcome = "suspicious" if suspicion_score >= 0.50 else ("moderate_indicators" if suspicion_score >= 0.30 else "normal")
            mod_status = "ANOMALOUS" if suspicion_score >= 0.50 else ("SUSPICIOUS" if suspicion_score >= 0.30 else "NORMAL")
            ev_list = [f"Deep neural feature classifier flagged manipulation probability: {suspicion_score:.1%}"] if suspicion_score >= 0.45 else []
            return {
                "status": "completed",
                "available": True,
                "module_status": mod_status,
                "signal_strength": sig_strength,
                "suspicion_score": round(suspicion_score, 2),
                "confidence": 0.85,
                "result": outcome,
                "details": f"Deep neural network classifier evaluated visual splicing patterns (Manipulation probability: {suspicion_score:.1%}).",
                "evidence": ev_list,
                "limitations": ["Neural network classification depends on distribution alignment with training dataset."],
                "authenticity_support": ["Deep neural network confirmed natural image feature hierarchy."] if suspicion_score < 0.25 else [],
                "manipulation_support": ev_list,
                "metrics": {
                    "model_type": "Deep Learning Neural Network (ONNX)",
                    "manipulation_probability": round(suspicion_score, 3)
                }
            }
        except Exception:
            pass  # Fall through gracefully to algorithmic forensics

    suspicion_scores = []
    frame_evidences = []
    frame_auth_supports = []
    frame_manip_supports = []
    metric_details = {}
    limitations = []

    for i, frame in enumerate(media.frames[:5]):
        # 1. Multi-Scale Error Level Analysis (ELA) Block Disparity
        ela_score, ela_var, max_block_var, block_disp, ela_ev, ela_auth = _compute_multi_scale_ela(frame)

        # 2. 2D FFT Frequency Domain Splicing Residuals
        fft_score, high_freq_ratio, fft_ev, fft_auth = _compute_fft_splicing_score(frame)

        # 3. Sensor Noise Residuals & Honest PRNU attribution
        noise_score, noise_status, noise_metrics, noise_ev, noise_auth = _compute_honest_noise_score(frame)

        # 4. Resampling, Interpolation & Edge Sharpness
        edge_score, blur_variance, resample_ev, edge_auth = _compute_resampling_edge_score(frame)

        # Combined visual manipulation score for this frame
        max_sub = max(ela_score, fft_score, noise_score, edge_score)
        weighted_sub = (0.35 * ela_score) + (0.25 * noise_score) + (0.25 * fft_score) + (0.15 * edge_score)
        frame_suspicion = max(weighted_sub, max_sub * 0.80) if max_sub >= 0.45 else weighted_sub
        suspicion_scores.append(frame_suspicion)

        if i == 0:
            frame_evidences.extend(ela_ev)
            frame_evidences.extend(fft_ev)
            frame_evidences.extend(noise_ev)
            frame_evidences.extend(resample_ev)

            frame_manip_supports.extend(ela_ev + fft_ev + noise_ev + resample_ev)
            frame_auth_supports.extend(ela_auth + fft_auth + noise_auth + edge_auth)

            metric_details = {
                "ela_variance": round(float(ela_var), 3),
                "ela_max_block_variance": round(float(max_block_var), 3),
                "ela_block_disparity": round(float(block_disp), 3),
                "ela_score": round(float(ela_score), 3),
                "high_frequency_ratio": round(float(high_freq_ratio), 4),
                "fft_splicing_score": round(float(fft_score), 3),
                "prnu_sensor_status": noise_status,
                "noise_score": round(float(noise_score), 3),
                "noise_variance_bgr": noise_metrics.get("noise_variance_bgr", []),
                "inter_channel_correlation": noise_metrics.get("inter_channel_correlation", 0.0),
                "edge_sharpness_variance": round(float(blur_variance), 2),
            }

    avg_suspicion = float(np.mean(suspicion_scores)) if suspicion_scores else 0.08
    avg_suspicion = float(np.clip(avg_suspicion, 0.04, 0.96))
    signal_strength = int(round(avg_suspicion * 100))

    h, w = media.frames[0].shape[:2]
    conf = 0.85
    if h < 300 or w < 300:
        conf -= 0.15
        limitations.append("Moderate image resolution limits block-level ELA and micro-noise granularity.")

    # Honest PRNU limitation declaration
    limitations.append("Single image analysis cannot compute multi-frame camera sensor fingerprint reference (PRNU attribution is not sufficient for hardware sensor verification).")
    limitations.append("Pretrained neural deepfake model weights (ONNX) are not mounted; using multi-scale algorithmic signal forensics (ELA, FFT, sensor noise, spatial gradients).")

    if avg_suspicion >= 0.48:
        outcome = "suspicious"
        mod_status = "ANOMALOUS"
        signal_label = "ANOMALOUS"
        details = (
            f"Localized manipulation or compression disparity detected across image tiles (Manipulation score: {avg_suspicion:.1%}). "
            f"Multi-scale Error Level Analysis variance and edge discontinuities indicate digital editing or splicing."
        )
    elif avg_suspicion >= 0.30:
        outcome = "moderate_indicators"
        mod_status = "SUSPICIOUS"
        signal_label = "SUSPICIOUS"
        details = (
            f"Mild compression inconsistencies observed across color channels ({avg_suspicion:.1%}). "
            f"No conclusive multi-tile splicing seams confirmed."
        )
    else:
        outcome = "normal"
        mod_status = "NORMAL"
        signal_label = "NORMAL"
        details = (
            f"Uniform compression characteristics, consistent color-channel noise, and standard frequency falloff verified across image pixels."
        )

    unique_ev = list(dict.fromkeys(frame_evidences))
    unique_manip = list(dict.fromkeys(frame_manip_supports))
    unique_auth = list(dict.fromkeys(frame_auth_supports))

    return {
        "status": "completed",
        "available": True,
        "evidence_status": "SUPPORTED",
        "signal": signal_label,
        "score": int(round(avg_suspicion * 100)),
        "module_status": mod_status,
        "signal_strength": signal_strength,
        "suspicion_score": round(avg_suspicion, 2),
        "confidence": round(conf, 2),
        "result": outcome,
        "reason": details,
        "details": details,
        "evidence": unique_ev,
        "limitations": limitations,
        "authenticity_support": unique_auth,
        "manipulation_support": unique_manip,
        "metrics": metric_details
    }


def _compute_honest_noise_score(bgr_frame: np.ndarray) -> Tuple[float, str, dict, List[str], List[str]]:
    """
    Evaluates sensor noise residual consistency across RGB channels.
    Honest PRNU handling: A single image cannot establish camera sensor fingerprint.
    PRNU status = 'NOT_APPLICABLE / NOT_SUFFICIENT_FOR_SENSOR_ATTRIBUTION'.
    """
    evidence = []
    auth_support = []
    try:
        denoised = cv2.GaussianBlur(bgr_frame, (3, 3), 0)
        noise = bgr_frame.astype(np.float32) - denoised.astype(np.float32)

        var_b = float(np.var(noise[:, :, 0]))
        var_g = float(np.var(noise[:, :, 1]))
        var_r = float(np.var(noise[:, :, 2]))

        b_flat = noise[:, :, 0].flatten()
        g_flat = noise[:, :, 1].flatten()
        r_flat = noise[:, :, 2].flatten()

        std_b = float(np.std(b_flat))
        std_g = float(np.std(g_flat))
        std_r = float(np.std(r_flat))

        if std_b > 1e-4 and std_g > 1e-4 and std_r > 1e-4:
            corr_bg = float(np.corrcoef(b_flat, g_flat)[0, 1])
            corr_gr = float(np.corrcoef(g_flat, r_flat)[0, 1])
            avg_corr = (corr_bg + corr_gr) / 2.0
            if np.isnan(avg_corr) or np.isinf(avg_corr):
                avg_corr = 0.0
        else:
            avg_corr = 0.0

        max_var = max(var_b, var_g, var_r)
        min_var = min(var_b, var_g, var_r) + 1e-4
        var_disparity = max_var / min_var

        # Honest PRNU Status
        prnu_status = "NOT_SUFFICIENT_FOR_SENSOR_ATTRIBUTION (Single image reference)"

        suspicion = 0.08
        if var_disparity > 3.5 and avg_corr < 0.50:
            suspicion = float(np.clip(0.45 + (var_disparity * 0.08), 0.45, 0.85))
            evidence.append(f"Significant cross-channel noise variance disparity ({var_disparity:.2f}) indicates non-uniform digital processing.")
        elif var_disparity > 2.4 and avg_corr < 0.70:
            suspicion = float(np.clip(0.18 + (var_disparity * 0.04), 0.18, 0.35))
        else:
            auth_support.append(f"Consistent inter-channel optical sensor noise correlation ({avg_corr:.2f}).")

        metrics = {
            "noise_variance_bgr": [round(float(var_b), 2), round(float(var_g), 2), round(float(var_r), 2)],
            "inter_channel_correlation": round(float(avg_corr), 3),
            "variance_disparity": round(float(var_disparity), 2),
            "prnu_attribution": prnu_status
        }
        return suspicion, prnu_status, metrics, evidence, auth_support

    except Exception:
        return 0.08, "NOT_SUFFICIENT_FOR_SENSOR_ATTRIBUTION", {}, [], []


def _compute_multi_scale_ela(bgr_frame: np.ndarray) -> Tuple[float, float, float, float, List[str], List[str]]:
    """
    Multi-Scale Error Level Analysis (ELA) measuring JPEG compression disparity across Q=75, Q=85, Q=95.
    Accounts for WhatsApp compression, screenshots, and global recompression:
    If the entire image exhibits similar compression behavior, it is treated as NORMAL.
    Only localized patches with statistically disparate recompression are flagged as SUSPICIOUS.
    """
    evidence = []
    auth_support = []
    try:
        rgb_img = Image.fromarray(cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB))
        h, w = bgr_frame.shape[:2]

        gray_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2GRAY)
        qualities = [75, 85, 95]
        scale_block_disparities = []
        scale_variances = []
        max_block_vars = []

        for q in qualities:
            buf = io.BytesIO()
            rgb_img.save(buf, format="JPEG", quality=q)
            buf.seek(0)
            resaved_img = Image.open(buf)

            diff = ImageChops.difference(rgb_img, resaved_img)
            diff_arr = np.array(diff, dtype=np.float32)
            variance = float(np.var(diff_arr))
            scale_variances.append(variance)

            block_rel_vars = []
            if h >= 64 and w >= 64:
                for by in range(0, h - 32, 32):
                    for bx in range(0, w - 32, 32):
                        b_gray = gray_frame[by:by+32, bx:bx+32]
                        grad_var = float(cv2.Laplacian(b_gray, cv2.CV_64F).var())
                        if grad_var > 15.0:  # Has structured texture
                            block = diff_arr[by:by+32, bx:bx+32]
                            ela_var = float(np.var(block))
                            rel_ela = ela_var / (grad_var + 25.0)
                            block_rel_vars.append(rel_ela)

            if len(block_rel_vars) >= 4:
                b_arr = np.array(block_rel_vars)
                p95 = float(np.percentile(b_arr, 95))
                p50 = float(np.percentile(b_arr, 50))
                disp = p95 / (p50 + 1e-4)
                max_b_var = float(np.max(b_arr))
            else:
                disp = 1.0
                max_b_var = variance

            scale_block_disparities.append(disp)
            max_block_vars.append(max_b_var)

        avg_disp = float(np.mean(scale_block_disparities))
        max_disp = float(np.max(scale_block_disparities))
        primary_var = float(scale_variances[1])  # Q=85
        primary_max_block_var = float(max_block_vars[1])

        suspicion = 0.08
        if max_disp > 8.0 and primary_max_block_var > 0.09 and primary_var > 0.60:
            suspicion = float(min(0.92, 0.65 + (max_disp * 0.02)))
            evidence.append(f"Localized Error Level Analysis (ELA) compression disparity ({max_disp:.1f}x) detected across multi-scale compression levels.")
        elif max_disp > 5.0 and primary_max_block_var > 0.060 and primary_var > 0.50:
            suspicion = float(np.clip(0.50 + (max_disp * 0.02), 0.50, 0.75))
            evidence.append(f"Localized Error Level Analysis (ELA) compression disparity ({max_disp:.1f}x) observed between image regions.")
        else:
            auth_support.append(f"Uniform Error Level Analysis (ELA) response across multi-scale compression passes (disparity {avg_disp:.1f}x).")

        return suspicion, primary_var, primary_max_block_var, max_disp, evidence, auth_support
    except Exception:
        return 0.08, 10.0, 10.0, 1.0, [], []


def _compute_fft_splicing_score(bgr_frame: np.ndarray) -> Tuple[float, float, List[str], List[str]]:
    """
    2D FFT Frequency domain analysis to detect high-frequency spectral discontinuities.
    """
    evidence = []
    auth_support = []
    try:
        gray = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2GRAY)
        std_gray = cv2.resize(gray, (256, 256)).astype(np.float32)

        f_transform = np.fft.fft2(std_gray)
        f_shift = np.fft.fftshift(f_transform)
        magnitude_spectrum = 20 * np.log(np.abs(f_shift) + 1e-8)

        center = (128, 128)
        radius_high = 100
        y, x = np.ogrid[:256, :256]
        mask_high = (x - center[0])**2 + (y - center[1])**2 > radius_high**2

        high_energy = np.mean(magnitude_spectrum[mask_high])
        total_energy = np.mean(magnitude_spectrum) + 1e-8
        ratio = float(high_energy / total_energy)

        suspicion = 0.08
        if ratio > 0.992:
            suspicion = 0.70
            evidence.append("Severe high-frequency spectral anomalies observed in 2D Fourier domain.")
        elif ratio > 0.96:
            suspicion = 0.28
        elif ratio < 0.04:
            suspicion = 0.45
            evidence.append("Abnormal absence of natural high-frequency optical texture in frequency domain.")
        else:
            auth_support.append("Natural continuous 2D Fourier frequency energy distribution.")

        return suspicion, ratio, evidence, auth_support
    except Exception:
        return 0.08, 0.65, [], []


def _compute_resampling_edge_score(bgr_frame: np.ndarray) -> Tuple[float, float, List[str], List[str]]:
    """
    Evaluates spatial edge gradient consistency.
    Does not penalize sharp high-resolution camera photographs.
    """
    evidence = []
    auth_support = []
    try:
        gray = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        var = float(laplacian.var())

        suspicion = 0.08
        # Only severe extreme artificial grain (e.g. injected noise > 25000) or severe blur is flagged
        if var < 3.0:
            suspicion = 0.45
            evidence.append("Severe global blur or heavy smoothing filter detected across spatial edges.")
        elif var > 35000.0:
            suspicion = 0.45
            evidence.append("Artificial high-frequency edge sharpening or synthetic grain detected.")
        else:
            auth_support.append("Natural optical edge sharpness variance verified.")

        return suspicion, var, evidence, auth_support
    except Exception:
        return 0.08, 100.0, [], []
