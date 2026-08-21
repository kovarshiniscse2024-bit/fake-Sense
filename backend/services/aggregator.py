from typing import Dict, Any, Tuple, List

# Centralized, configurable forensic signal baseline weights
DEFAULT_WEIGHTS: Dict[str, float] = {
    "ai_generated_detector": 0.40,
    "visual_cnn": 0.30,
    "face_analysis": 0.20,
    "audio_visual_sync": 0.15,
    "audio_analysis": 0.10,
    "metadata": 0.08
}


def aggregate_evidence(module_results: Dict[str, Dict[str, Any]]) -> Tuple[float, float, Dict[str, float], Dict[str, Any]]:
    """
    Transparent Confidence-Weighted Evidence Aggregation Layer.
    Only completed and available modules contribute to the score.
    Unavailable, skipped, failed, or not-applicable modules contribute neither positively nor negatively.

    Formula:
      weighted_suspicion = sum(module_suspicion * module_confidence * module_weight) / sum(module_confidence * module_weight)

    Separates findings into:
      1. AUTHENTICITY_SUPPORT: Genuine optical provenance, natural sensor noise, balanced frequency decay.
      2. MANIPULATION_SUPPORT: Localized compression disparities, boundary blend seams, periodic latent stride grids.
      3. QUALITY_LIMITATIONS: Low resolution, optical blur, heavy JPEG blocking.

    Returns:
      (weighted_suspicion_score, coverage_factor, normalized_weights, structured_evidence_summary)
    """
    authenticity_support: List[str] = []
    manipulation_support: List[str] = []
    quality_limitations: List[str] = []
    module_summaries: Dict[str, Dict[str, Any]] = {}

    eff_weights = {}
    weighted_sum = 0.0
    total_eff_weight = 0.0

    for mod_name, base_weight in DEFAULT_WEIGHTS.items():
        mod = module_results.get(mod_name, {})
        if not isinstance(mod, dict):
            continue

        status = mod.get("status", "unavailable")
        is_available = bool(mod.get("available", status in ["completed", "SUPPORTED"]))
        susp_score = mod.get("suspicion_score")
        conf = float(mod.get("confidence", 0.75) or 0.0)

        is_active = (status in ["completed", "SUPPORTED"]) and is_available and (susp_score is not None)

        mod_status = mod.get("module_status", mod.get("signal", "NORMAL" if is_active else "NOT_APPLICABLE"))
        sig_strength = mod.get("signal_strength", int(round(susp_score * 100)) if susp_score is not None else 0)

        # Build structured module summary
        module_summaries[mod_name] = {
            "status": status,
            "available": is_available,
            "signal": mod.get("signal", mod_status),
            "signal_strength": sig_strength,
            "suspicion_score": susp_score,
            "confidence": conf,
            "result": mod.get("result"),
            "details": mod.get("details", mod.get("reason", "")),
            "evidence": mod.get("evidence", []),
            "limitations": mod.get("limitations", [])
        }

        # Collect evidentiary points
        if "authenticity_support" in mod and isinstance(mod["authenticity_support"], list):
            authenticity_support.extend(mod["authenticity_support"])
        if "manipulation_support" in mod and isinstance(mod["manipulation_support"], list):
            manipulation_support.extend(mod["manipulation_support"])

        # Collect raw evidence strings if manipulation support not explicitly populated
        if not mod.get("manipulation_support") and mod.get("evidence"):
            if susp_score is not None and susp_score >= 0.28:
                manipulation_support.extend(mod.get("evidence", []))

        # Only completed, available modules contribute to weighted score
        if is_active:
            # Confidence-weighted contribution
            w = base_weight * max(0.20, conf)
            eff_weights[mod_name] = w
            weighted_sum += float(susp_score) * w
            total_eff_weight += w

    # Quality module findings
    quality_mod = module_results.get("quality_assessment", {})
    if isinstance(quality_mod, dict):
        if quality_mod.get("quality_limitations"):
            quality_limitations.extend(quality_mod.get("quality_limitations", []))
        elif quality_mod.get("warning") and quality_mod.get("quality_tier") in ["LOW", "INSUFFICIENT"]:
            quality_limitations.append(quality_mod.get("warning"))

    # Add any module limitations to quality_limitations
    for mod_name, mod in module_results.items():
        if isinstance(mod, dict) and mod.get("limitations"):
            for lim in mod["limitations"]:
                quality_limitations.append(lim)

    # Deduplicate lists preserving order
    authenticity_support = list(dict.fromkeys(authenticity_support))
    manipulation_support = list(dict.fromkeys(manipulation_support))
    quality_limitations = list(dict.fromkeys(quality_limitations))

    evidence_summary = {
        "authenticity_support": authenticity_support,
        "manipulation_support": manipulation_support,
        "quality_limitations": quality_limitations,
        "module_summaries": module_summaries
    }

    if total_eff_weight <= 0.0:
        return 0.50, 0.20, {}, evidence_summary

    weighted_suspicion = float(weighted_sum / total_eff_weight)
    normalized_weights = {k: round(v / total_eff_weight, 3) for k, v in eff_weights.items()}
    coverage_factor = float(min(1.0, total_eff_weight / 0.55))

    return float(weighted_suspicion), float(coverage_factor), normalized_weights, evidence_summary
