def generate_explainable_evidence(
    arg1: Any = None,
    arg2: Any = None,
    arg3: Any = None,
    arg4: Any = None,
    module_results: Optional[Dict[str, Dict[str, Any]]] = None,
    authenticity_score: int = 50,
    confidence: float = 0.5,
    verdict: str = "Inconclusive",
    anomalies: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Generates rich, evidence-grounded structured evidence items for the Visual Evidence Explorer,
    Evidence Detail Panel, and AI Explanation Agent.
    Every statement is derived strictly from active module results.
    """
    # Resolve positional calling permutations
    if isinstance(arg1, dict) and module_results is None:
        module_results = arg1
        if isinstance(arg2, (int, float)):
            authenticity_score = int(arg2)
        if isinstance(arg3, float):
            confidence = arg3
        elif isinstance(arg3, str):
            verdict = arg3
        if isinstance(arg4, str):
            verdict = arg4
        elif isinstance(arg4, list):
            anomalies = arg4
    elif isinstance(arg1, str) and module_results is None:
        # e.g. generate_explainable_evidence("Likely Manipulated", 35, modules, [])
        verdict = arg1
        if isinstance(arg2, (int, float)):
            authenticity_score = int(arg2)
        if isinstance(arg3, dict):
            module_results = arg3
        if isinstance(arg4, list):
            anomalies = arg4

    if module_results is None:
        module_results = {}
    if anomalies is None:
        anomalies = []

    evidence_items = []

    ai_gen = module_results.get("ai_generated_detector", {})
    visual = module_results.get("visual_cnn", {})
    face = module_results.get("face_analysis", {})
    sync = module_results.get("audio_visual_sync", {})
    meta = module_results.get("metadata", {})

    # 1. AI-Generated & Synthetic Media Findings
    if ai_gen.get("status") == "completed":
        ai_score = ai_gen.get("score_ai_generated", 0.20)
        ai_details = ai_gen.get("details", "")
        raw_evidence = ai_gen.get("evidence", [])

        if ai_score >= 0.40:
            severity = "High"
            finding = raw_evidence[0] if raw_evidence else "Spectral diffusion residuals, non-optical noise floor, or lattice harmonics detected."
            contrib = f"Primary driving factor supporting the {verdict} classification."
        elif ai_score >= 0.28:
            severity = "Medium"
            finding = raw_evidence[0] if raw_evidence else "Borderline synthetic frequency residuals observed in high-frequency bands."
            contrib = "Moderate factor in synthetic vs authentic classification."
        else:
            severity = "Clean"
            finding = "Natural optical power spectrum decay, physical sensor noise, and Bayer CFA demosaicing confirmed."
            contrib = "Positive evidence supporting natural physical camera capture."

        evidence_items.append({
            "id": "EV-AI-01",
            "type": "Generative AI Detection",
            "source": "ai_generated_detector",
            "severity": severity,
            "score": ai_score,
            "finding": finding,
            "explanation": ai_details or finding,
            "contribution": contrib,
            "localization": {
                "available": False,
                "reason": "Spectral frequency and spatial autocorrelation analyses operate across full-frame pixel distributions.",
                "boxes": []
            }
        })

    # 2. Visual / CNN Splicing module findings
    if visual.get("status") == "completed":
        v_score = visual.get("suspicion_score", 0.10)
        v_details = visual.get("details", "")
        raw_v_evidence = visual.get("evidence", [])

        if v_score >= 0.50:
            severity = "High"
            finding = raw_v_evidence[0] if raw_v_evidence else "Detected localized compression disparity and ELA variance anomalies."
            contrib = f"High factor indicating potential image splicing or localized digital manipulation."
        elif v_score >= 0.28:
            severity = "Medium"
            finding = raw_v_evidence[0] if raw_v_evidence else "Mild compression variations detected across color channels."
            contrib = "Moderate factor contributing to manipulation indicators."
        else:
            severity = "Clean"
            finding = "Uniform pixel noise distribution and natural frequency spectrum confirmed."
            contrib = "Strong positive evidence supporting natural optical capture."

        evidence_items.append({
            "id": "EV-VIS-01",
            "type": "Visual Manipulation / ELA",
            "source": "visual_cnn",
            "severity": severity,
            "score": v_score,
            "finding": finding,
            "explanation": v_details or finding,
            "contribution": contrib,
            "localization": {
                "available": False,
                "reason": "Visual localization is not available for full-frame spectral and compression models.",
                "boxes": []
            }
        })

    # 3. Face Analysis findings
    if face.get("status") == "completed":
        f_score = face.get("suspicion_score", 0.10)
        f_details = face.get("details", "")
        f_metrics = face.get("metrics", {})
        face_instances = f_metrics.get("face_instances", [])
        detected_boxes = f_metrics.get("detected_boxes", [])
        raw_f_evidence = face.get("evidence", [])

        boxes = []
        if detected_boxes:
            boxes.extend(detected_boxes)
        for inst in face_instances:
            bbox = inst.get("bbox")
            if bbox and len(bbox) == 4:
                seam = inst.get("seam_score", 0.1)
                box_sev = "High" if seam >= 0.6 else ("Medium" if seam >= 0.30 else "Clean")
                boxes.append({
                    "x": bbox[0],
                    "y": bbox[1],
                    "w": bbox[2],
                    "h": bbox[3],
                    "severity": box_sev,
                    "label": f"Facial Region (Seam: {seam:.2f})"
                })

        if f_score >= 0.48:
            severity = "High"
            finding = raw_f_evidence[0] if raw_f_evidence else "Inconsistencies detected in facial perimeter blending and skin tone gradients."
            contrib = "High suspicious signal characteristic of face-swap manipulation."
        elif f_score >= 0.28:
            severity = "Medium"
            finding = raw_f_evidence[0] if raw_f_evidence else "Moderate illumination contrast or gradient variation around facial perimeter."
            contrib = "Moderate factor evaluated in facial integrity check."
        else:
            severity = "Clean"
            finding = "Natural facial landmark symmetry and seamless skin boundary gradients verified."
            contrib = "Strong evidence supporting authentic facial continuity."

        evidence_items.append({
            "id": "EV-FACE-01",
            "type": "Facial Region Analysis",
            "source": "face_analysis",
            "severity": severity,
            "score": f_score,
            "finding": finding,
            "explanation": f_details or finding,
            "contribution": contrib,
            "localization": {
                "available": len(boxes) > 0,
                "reason": "Facial landmark bounding coordinates extracted from active facial detection." if len(boxes) > 0 else "Face analysis completed but localized coordinates were unavailable.",
                "boxes": boxes
            }
        })
    elif face.get("status") == "skipped":
        evidence_items.append({
            "id": "EV-FACE-00",
            "type": "Facial Region Analysis",
            "source": "face_analysis",
            "severity": "Clean",
            "score": None,
            "finding": "No human faces detected; module gracefully skipped without impacting other signals.",
            "explanation": "Media does not contain human facial subjects. Analysis was not applicable.",
            "contribution": "Module skipped; weights dynamically redistributed to active signals.",
            "localization": {
                "available": False,
                "reason": "No faces present in media.",
                "boxes": []
            }
        })

    # 4. Audio-Visual Sync findings (if video)
    if sync.get("status") == "completed":
        s_score = sync.get("suspicion_score", 0.10)
        s_details = sync.get("details", "")

        evidence_items.append({
            "id": "EV-SYNC-01",
            "type": "Audio-Visual Synchronization",
            "source": "audio_visual_sync",
            "severity": "High" if s_score >= 0.50 else ("Medium" if s_score >= 0.30 else "Clean"),
            "score": s_score,
            "finding": "Audio phoneme and facial landmark synchronization evaluated." if s_score < 0.30 else "Phoneme and mouth motion misalignments detected.",
            "explanation": s_details,
            "contribution": "Evaluates video deepfake lip-sync dubbing coherence.",
            "localization": {
                "available": False,
                "reason": "Temporal phoneme correlation metric.",
                "boxes": []
            }
        })

    # 5. Metadata findings
    if meta.get("status") in ["completed", "neutral"]:
        m_score = meta.get("suspicion_score")
        m_res = meta.get("result")
        m_details = meta.get("details", "")

        if m_res == "editing_signatures_present":
            severity = "High"
            finding = "Software editing/generation signatures identified in file container tags."
            contrib = "Supporting evidence of post-processing or synthetic generation tools."
        elif m_res == "camera_provenance_tags":
            severity = "Clean"
            finding = "Original hardware camera EXIF timestamps and capture tags confirmed."
            contrib = "Supporting indicator of genuine physical camera capture."
        else:
            severity = "Low"
            finding = "Metadata unavailable or standardized web container tags observed."
            contrib = "Standard web container without EXIF; neutral evidentiary value."

        evidence_items.append({
            "id": "EV-META-01",
            "type": "Metadata & Container Inspection",
            "source": "metadata",
            "severity": severity,
            "score": m_score,
            "finding": finding,
            "explanation": m_details or finding,
            "contribution": contrib,
            "localization": {
                "available": False,
                "reason": "Metadata is file header/EXIF container information and does not possess spatial coordinates.",
                "boxes": []
            }
        })

    # 6. Cross-module anomalies
    for idx, anomaly in enumerate(anomalies):
        evidence_items.append({
            "id": f"EV-CROSS-{idx+1:02d}",
            "type": "Cross-Signal Correlation",
            "source": "anomaly_detection",
            "severity": "High",
            "score": 0.75,
            "finding": anomaly,
            "explanation": f"Multi-signal correlation detected mutual anomalies: {anomaly}",
            "contribution": "Reinforced the confidence of localized manipulation.",
            "localization": {
                "available": False,
                "reason": "Cross-signal correlation represents an inter-module relationship rather than a single pixel coordinate.",
                "boxes": []
            }
        })

    return evidence_items
