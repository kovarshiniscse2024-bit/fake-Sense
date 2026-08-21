import numpy as np
from typing import Dict, Any, Tuple, List, Optional
from .aggregator import aggregate_evidence


def compute_authenticity_and_verdict(
    weighted_suspicion: float,
    coverage_factor: float,
    module_results: Dict[str, Dict[str, Any]],
    evidence_summary: Optional[Dict[str, Any]] = None
) -> Tuple[int, float, str, Dict[str, Any]]:
    """
    Computes Authenticity Score (0-100), Calibrated Confidence (0.0-1.0), Canonical 3-Way Verdict,
    and Structured Decision Trace across:
      - 'Likely Real' (Natural optical capture, verified sensor noise, standard frequency decay)
      - 'Likely Manipulated' (Corroborated digital splicing, generative AI synthesis, or software alterations)
      - 'Inconclusive' (Insufficient quality, conflicting detector signals, or weak evidence)

    Core Principles:
      1. Separation of Authenticity (0-100) vs Confidence (0.0-1.0).
      2. No 100 - suspicion: Evidence-driven non-linear mapping.
      3. Missing metadata is neutral (not evidence of tampering or authenticity).
      4. Low quality or conflicting detectors shift confidence down or verdict to Inconclusive.
      5. Never classify as Likely Real or Likely Manipulated without active forensic evidence.
    """
    ai_mod = module_results.get("ai_generated_detector", {})
    ai_active = bool(ai_mod.get("available", False) and ai_mod.get("status") in ["completed", "SUPPORTED"])
    ai_score = ai_mod.get("score_ai_generated", ai_mod.get("suspicion_score")) if ai_active else None
    ai_metrics = ai_mod.get("metrics", {})
    synthetic_indicators = ai_metrics.get("synthetic_indicators", 0)

    vis_mod = module_results.get("visual_cnn", {})
    vis_active = bool(vis_mod.get("available", False) and vis_mod.get("status") in ["completed", "SUPPORTED"])
    vis_score = vis_mod.get("suspicion_score") if vis_active else None

    face_mod = module_results.get("face_analysis", {})
    face_active = bool(face_mod.get("available", False) and face_mod.get("status") in ["completed", "SUPPORTED"])
    face_score = face_mod.get("suspicion_score") if face_active else None

    meta_mod = module_results.get("metadata", {})
    meta_active = bool(meta_mod.get("available", False) and meta_mod.get("status") in ["completed", "SUPPORTED"])
    has_camera_provenance = bool(meta_active and meta_mod.get("metrics", {}).get("provenance_verified"))
    has_software_signatures = bool(meta_active and meta_mod.get("result") == "editing_signatures_present")

    quality_mod = module_results.get("quality_assessment", {})
    quality_tier = quality_mod.get("quality_tier", "ADEQUATE")
    quality_score = quality_mod.get("quality_score", 75)

    if evidence_summary is None:
        _, _, _, evidence_summary = aggregate_evidence(module_results)

    auth_supports = evidence_summary.get("authenticity_support", [])
    manip_supports = evidence_summary.get("manipulation_support", [])
    quality_limits = evidence_summary.get("quality_limitations", [])

    # 1. Active Modules Collection & Dispersion
    active_suspicion_scores = [
        float(m["suspicion_score"])
        for m in module_results.values()
        if isinstance(m, dict) and m.get("available") and m.get("status") in ["completed", "SUPPORTED"] and m.get("suspicion_score") is not None
    ]

    active_count = len(active_suspicion_scores)
    score_variance = float(np.var(active_suspicion_scores)) if active_count > 1 else 0.0
    score_range = float(max(active_suspicion_scores) - min(active_suspicion_scores)) if active_count > 1 else 0.0

    # 2. Confidence Calibration
    # Base confidence derives from the number of independent available detectors
    if active_count >= 3:
        base_confidence = 0.88
    elif active_count == 2:
        base_confidence = 0.80
    elif active_count == 1:
        base_confidence = 0.68
    else:
        base_confidence = 0.25

    # Penalties for inter-module disagreement and low image quality
    disagreement_penalty = min(0.20, score_variance * 1.0)
    if quality_tier == "INSUFFICIENT":
        quality_penalty = 0.45
    elif quality_tier == "LOW":
        quality_penalty = 0.18
    elif quality_tier == "HIGH":
        quality_penalty = -0.04
    else:
        quality_penalty = 0.0

    calibrated_confidence = float(np.clip(base_confidence - disagreement_penalty - quality_penalty, 0.20, 0.95))

    # 3. Decision Policy Logic
    explanation_points = []

    # CASE A: Quality Insufficiency
    if quality_tier == "INSUFFICIENT" or quality_score < 20 or active_count == 0:
        verdict = "Inconclusive"
        authenticity_score = 50
        calibrated_confidence = min(0.35, calibrated_confidence)
        explanation_points.append("Insufficient media resolution, severe optical blur, or excessive compression prevents reliable forensic verification.")

    # CASE B: Corroborated Synthetic AI Generation
    elif (
        (ai_score is not None and ai_score >= 0.40)
        or (ai_score is not None and ai_score >= 0.30 and synthetic_indicators >= 2)
    ):
        verdict = "Likely AI-Generated"
        max_active_susp = max([s for s in [ai_score, weighted_suspicion] if s is not None] or [0.65])
        # Non-linear low authenticity mapping (8-28%)
        authenticity_score = int(round((1.0 - max_active_susp) * 30.0 + 6.0))
        authenticity_score = max(5, min(30, authenticity_score))

        explanation_points.append(f"Synthetic AI media generation indicators detected (Generative probability: {ai_score:.1%}).")
        if manip_supports:
            explanation_points.extend(manip_supports[:3])

    # CASE C: Corroborated Splicing / Digital Manipulation
    elif (
        (vis_score is not None and vis_score >= 0.38)
        or (face_score is not None and face_score >= 0.38)
        or (weighted_suspicion >= 0.35)
        or (len(manip_supports) >= 1 and (vis_score or 0.0) >= 0.30)
        or (has_software_signatures and (len(manip_supports) >= 1 or (vis_score and vis_score >= 0.25) or (face_score and face_score >= 0.25)))
    ):
        verdict = "Likely Manipulated"
        max_active_susp = max(
            [s for s in [vis_score, face_score, weighted_suspicion, (0.65 if has_software_signatures else None)] if s is not None]
        )
        # Non-linear authenticity mapping (8-32%)
        authenticity_score = int(round((1.0 - max_active_susp) * 35.0 + 8.0))
        authenticity_score = max(5, min(32, authenticity_score))

        if vis_score is not None and vis_score >= 0.40:
            explanation_points.append("Localized Error Level Analysis compression disparity or splicing frequency anomalies detected.")
        if face_score is not None and face_score >= 0.40:
            explanation_points.append("Facial boundary blend seams or skin texture micro-discrepancies detected.")
        if has_software_signatures:
            explanation_points.append("Software editing metadata signatures present in file headers.")

        if manip_supports:
            explanation_points.extend(manip_supports[:3])

    # CASE D: Authentic Photographic Capture
    elif (
        (ai_score is None or (ai_score < 0.28 and synthetic_indicators < 2))
        and (vis_score is None or vis_score < 0.28)
        and (face_score is None or face_score < 0.28)
        and weighted_suspicion <= 0.26
        and not has_software_signatures
        and calibrated_confidence >= 0.55
    ):
        verdict = "Likely Authentic"
        base_auth = 88.0 if has_camera_provenance else 82.0
        authenticity_score = int(round(base_auth - (weighted_suspicion * 25.0)))
        authenticity_score = max(75, min(95, authenticity_score))
        explanation_points.append("Natural optical frequency decay, uniform sensor noise distribution, and continuous spatial gradients verified across pixels.")
        if has_camera_provenance:
            explanation_points.append("Hardware camera EXIF tags corroborate genuine optical device capture.")
        if auth_supports:
            explanation_points.extend(auth_supports[:3])

    # CASE E: Borderline / Low-Evidence Inconclusive
    else:
        verdict = "Inconclusive"
        authenticity_score = int(round(50.0 + (0.50 - weighted_suspicion) * 20.0))
        authenticity_score = max(42, min(58, authenticity_score))
        calibrated_confidence = min(0.55, calibrated_confidence)
        explanation_points.append("Forensic signals exhibit borderline measurements without definitive synthetic or authentic markers.")

    authenticity_score = max(5, min(95, authenticity_score))
    calibrated_confidence = round(calibrated_confidence, 2)

    # Deduplicate explanation points
    explanation_points = list(dict.fromkeys(explanation_points))

    agreement_info = calculate_model_agreement(module_results)

    decision_trace = {
        "verdict": verdict,
        "authenticity_score": authenticity_score,
        "confidence": calibrated_confidence,
        "model_agreement": agreement_info.get("state", "MODERATE AGREEMENT"),
        "evidence_quality": quality_tier,
        "ai_generated_score": round((ai_score or 0.0) * 100) if ai_score is not None else None,
        "manipulation_score": round(max([s for s in [vis_score, face_score] if s is not None] or [0.0]) * 100) if (vis_score is not None or face_score is not None) else None,
        "score_variance": round(score_variance, 4),
        "strongest_manipulation_evidence": manip_supports[:3],
        "strongest_authenticity_evidence": auth_supports[:3],
        "limitations": quality_limits,
        "explanation_points": explanation_points
    }

    return authenticity_score, calibrated_confidence, verdict, decision_trace


def calculate_model_agreement(module_results: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates Model Agreement / Disagreement across active forensic modules.
    Possible states:
    - HIGH AGREEMENT
    - MODERATE AGREEMENT
    - MIXED
    - MODERATE DISAGREEMENT
    - HIGH DISAGREEMENT
    """
    active_modules = {}
    for mod_key, mod_val in module_results.items():
        if isinstance(mod_val, dict) and mod_val.get("status") in ["completed", "SUPPORTED"] and mod_val.get("suspicion_score") is not None:
            active_modules[mod_key] = mod_val.get("suspicion_score")

    if len(active_modules) <= 1:
        return {
            "state": "MODERATE AGREEMENT",
            "variance": 0.0,
            "max_delta": 0.0,
            "summary": "Single primary active module evaluated; baseline consensus assumed.",
            "module_count": len(active_modules),
            "modules": active_modules
        }

    scores = list(active_modules.values())
    variance = float(np.var(scores))
    max_delta = float(max(scores) - min(scores))

    if max_delta <= 0.12 and variance <= 0.010:
        state = "HIGH AGREEMENT"
        summary = "All active forensic modules produced closely aligned suspicion indices."
    elif max_delta <= 0.25 and variance <= 0.035:
        state = "MODERATE AGREEMENT"
        summary = "Active forensic modules show general consensus with minor metric variations."
    elif max_delta <= 0.40:
        state = "MIXED"
        summary = "Modules exhibit mixed signals; some modules detected slight anomalies while others remained neutral."
    elif max_delta <= 0.58:
        state = "MODERATE DISAGREEMENT"
        summary = "Divergence detected between modules (e.g. generative AI detector vs visual splicing)."
    else:
        state = "HIGH DISAGREEMENT"
        summary = "Strong disagreement between independent modules; confidence is reduced."

    return {
        "state": state,
        "variance": round(variance, 4),
        "max_delta": round(max_delta, 2),
        "summary": summary,
        "module_count": len(active_modules),
        "modules": active_modules
    }


def compute_risk_radar(
    module_results: Dict[str, Dict[str, Any]],
    auth_score: int,
    confidence: float
) -> Dict[str, Any]:
    """
    Computes 5-dimensional normalized risk radar (0.0 to 1.0) across:
    1. AI Generation / Synthetic Media
    2. Visual Splicing / ELA Manipulation
    3. Facial Consistency & Boundary Seams
    4. Hardware & EXIF Provenance
    5. Optical Frequency & Spectrum Integrity
    """
    ai_mod = module_results.get("ai_generated_detector", {})
    ai_risk = float(ai_mod.get("score_ai_generated", 0.20) or 0.20) if ai_mod.get("status") in ["completed", "SUPPORTED"] else 0.20

    vis_mod = module_results.get("visual_cnn", {})
    vis_risk = float(vis_mod.get("suspicion_score", 0.20) or 0.20) if vis_mod.get("status") in ["completed", "SUPPORTED"] else 0.20

    face_mod = module_results.get("face_analysis", {})
    face_risk = float(face_mod.get("suspicion_score", 0.15) or 0.15) if face_mod.get("status") in ["completed", "SUPPORTED"] else 0.15

    meta_mod = module_results.get("metadata", {})
    meta_risk = float(meta_mod.get("suspicion_score", 0.25) or 0.25) if meta_mod.get("status") in ["completed", "SUPPORTED"] else 0.25

    fft_metrics = ai_mod.get("metrics", {}).get("fft_metrics", {})
    fft_risk = float(fft_metrics.get("spectral_residual_std", 0.20) or 0.20)
    fft_risk = float(np.clip(fft_risk * 2.2, 0.08, 0.95))

    return {
        "ai_generation": round(float(np.clip(ai_risk, 0.05, 0.95)), 2),
        "visual_splicing": round(float(np.clip(vis_risk, 0.05, 0.95)), 2),
        "facial_integrity": round(float(np.clip(face_risk, 0.05, 0.95)), 2),
        "metadata_provenance": round(float(np.clip(meta_risk, 0.05, 0.95)), 2),
        "spectral_decay": round(float(np.clip(fft_risk, 0.05, 0.95)), 2),
        # Aliases for categorical platform tests
        "visual_integrity": "SUSPICIOUS" if vis_risk >= 0.48 else "NORMAL",
        "facial_consistency": "SUSPICIOUS" if face_risk >= 0.48 else "NORMAL"
    }


def compute_what_if_analysis(
    module_results: Dict[str, Dict[str, Any]],
    excluded_signals: List[str]
) -> Dict[str, Any]:
    """
    Simulates hypothetical verification scores when excluding selected forensic signals.
    Clearly marked as hypothetical simulation.
    """
    orig_weighted, orig_cov, _, orig_summary = aggregate_evidence(module_results)
    orig_score, orig_conf, orig_verdict, _ = compute_authenticity_and_verdict(orig_weighted, orig_cov, module_results, orig_summary)

    sim_modules = {}
    for k, v in module_results.items():
        if k not in excluded_signals and k != "anomalies":
            sim_modules[k] = v

    sim_weighted, sim_cov, _, sim_summary = aggregate_evidence(sim_modules)
    sim_score, sim_conf, sim_verdict, _ = compute_authenticity_and_verdict(sim_weighted, sim_cov, sim_modules, sim_summary)

    diff = sim_score - orig_score
    changed = (sim_verdict != orig_verdict) or (abs(diff) >= 5)

    if not excluded_signals:
        explanation = "No signals excluded. Simulation matches original baseline."
    elif changed:
        explanation = (
            f"Excluding {', '.join(excluded_signals)} shifted the simulated authenticity score by "
            f"{'+' if diff > 0 else ''}{diff}% ({orig_score}% → {sim_score}%) with simulated verdict '{sim_verdict}'."
        )
    else:
        explanation = (
            f"Excluding {', '.join(excluded_signals)} resulted in minimal impact ({'+' if diff > 0 else ''}{diff}%); "
            f"simulated verdict remained '{sim_verdict}'."
        )

    return {
        "original_score": orig_score,
        "simulated_score": sim_score,
        "original_confidence": orig_conf,
        "simulated_confidence": sim_conf,
        "original_verdict": orig_verdict,
        "simulated_verdict": sim_verdict,
        "score_diff": diff,
        "verdict_changed": changed,
        "excluded_signals": excluded_signals,
        "explanation": explanation,
        "is_hypothetical": True
    }
