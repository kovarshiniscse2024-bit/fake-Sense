from typing import Dict, Any, List


def detect_cross_module_anomalies(module_results: Dict[str, Dict[str, Any]]) -> List[str]:
    """
    Identifies unusual patterns and contradictions across individual module outputs.
    """
    anomalies = []

    visual = module_results.get("visual_cnn", {})
    face = module_results.get("face_analysis", {})
    sync = module_results.get("audio_visual_sync", {})
    meta = module_results.get("metadata", {})

    v_susp = visual.get("suspicion_score")
    f_susp = face.get("suspicion_score")
    s_susp = sync.get("suspicion_score")
    m_susp = meta.get("suspicion_score")

    # 1. Face vs Global Visual Inconsistency (Local Face Swap indicator)
    if f_susp is not None and v_susp is not None:
        if f_susp >= 0.60 and v_susp < 0.30:
            anomalies.append("Localized facial manipulation detected against a natural background (possible face swap).")
        elif v_susp >= 0.65 and f_susp < 0.25:
            anomalies.append("Global synthetic background noise detected with unaltered facial subject.")

    # 2. AV Sync vs Facial Visual
    if s_susp is not None and f_susp is not None:
        if s_susp >= 0.60 and f_susp >= 0.50:
            anomalies.append("Coincident facial visual seam artifacts and lip synchronization desynchronization.")

    # 3. Hardware metadata vs Visual Manipulation
    if m_susp is not None and v_susp is not None:
        if m_susp < 0.15 and v_susp >= 0.65:
            anomalies.append("Authentic camera EXIF tags retained despite strong high-frequency frequency anomalies (possible metadata spoofing or re-compression).")

    return anomalies
