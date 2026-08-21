import os
from PIL import Image, ExifTags
from typing import Dict, Any, List
from .preprocessing import PreprocessedMedia

AI_EDITING_KEYWORDS = [
    "photoshop", "gimp", "stable diffusion", "midjourney", "dall-e", "dalle",
    "comfyui", "automatic1111", "facefusion", "roop", "deepfacelab",
    "faceswap", "synthetic", "generative", "civitai", "waifu", "adobe",
    "stablediffusion", "novelai", "invokeai", "flux", "canva", "fotor",
    "ai-art", "ai_art", "ai-creator", "ai-generated", "bing_image_creator",
    "bing_creator", "firefly", "leonardo", "ideogram", "nightcafe",
    "deepai", "seaart", "playgroundai", "craiyon", "ai_creator"
]


def run_metadata_analysis(media: PreprocessedMedia) -> Dict[str, Any]:
    """
    Metadata & Hardware Provenance Inspection Module.
    Rules:
      1. Metadata is supporting evidence only.
      2. Absence of metadata is NOT proof of tampering or fake (social media platforms strip EXIF).
      3. Presence of metadata is NOT standalone proof of authentic capture (can be copied or forged).
    """
    found_suspicious_tags = []
    found_camera_tags = []
    exif_summary = {}
    evidence = []
    auth_support = []
    manip_support = []
    limitations = []

    limitations.append("Metadata is header information and can be easily stripped or modified; it does not replace pixel-level forensic verification.")

    try:
        # Check filename / path for explicit AI creator signatures
        base_fname = (
            media.metadata.get("original_filename")
            or (os.path.basename(media.file_path) if media.file_path else "")
            or ""
        ).lower()
        for kw in AI_EDITING_KEYWORDS:
            if kw in base_fname:
                found_suspicious_tags.append(f"Media filename contains '{kw}' signature")

        if media.media_type == "image":
            pil_img = media.primary_pil
            info = pil_img.info

            # Check raw string info dictionary (PNG tEXt chunks, JPEG comments)
            for k, v in info.items():
                if isinstance(v, str):
                    lower_v = v.lower()
                    for kw in AI_EDITING_KEYWORDS:
                        if kw in lower_v:
                            found_suspicious_tags.append(f"{k}: '{kw}' detected")

            # Check EXIF data
            exif_data = pil_img.getexif()
            if exif_data:
                for tag_id, value in exif_data.items():
                    tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
                    val_str = str(value)
                    exif_summary[tag_name] = val_str[:100]

                    if tag_name in ["Make", "Model", "LensModel", "DateTimeOriginal", "ExposureTime", "FNumber"]:
                        found_camera_tags.append(f"{tag_name}: {val_str}")

                    for kw in AI_EDITING_KEYWORDS:
                        if kw in val_str.lower():
                            found_suspicious_tags.append(f"{tag_name}: '{kw}'")

        elif media.media_type == "video":
            with open(media.file_path, "rb") as f:
                header = f.read(100000).lower()
                for kw in [b"lavf", b"isom", b"ffmpeg", b"handbrake", b"deepfacelab"]:
                    if kw in header:
                        found_suspicious_tags.append(f"Container signature '{kw.decode('latin1', 'ignore')}'")

    except Exception as e:
        exif_summary["read_error"] = str(e)

    # Classification of metadata signals
    if found_suspicious_tags:
        suspicion = 0.85
        sig_strength = 85
        status = "completed"
        available = True
        confidence = 0.85
        evidence_status = "SUPPORTED"
        mod_status = "SUSPICIOUS"
        signal_label = "SUSPICIOUS"
        result = "editing_signatures_present"
        provenance_verified = False
        details = (
            f"Software editing or synthetic generator signatures identified in file headers: "
            f"{', '.join(found_suspicious_tags[:3])}. Supporting evidence of digital post-processing."
        )
        msg = f"Header container contains software editing signature ({found_suspicious_tags[0]})."
        evidence.append(msg)
        manip_support.append(msg)

    elif found_camera_tags:
        suspicion = 0.10
        sig_strength = 10
        status = "completed"
        available = True
        confidence = 0.70
        evidence_status = "SUPPORTED"
        mod_status = "NORMAL"
        signal_label = "NORMAL"
        result = "camera_provenance_tags"
        provenance_verified = True
        details = (
            f"Hardware camera EXIF tags present ({', '.join(found_camera_tags[:2])}). "
            f"Supporting provenance evidence (metadata alone does not guarantee authenticity)."
        )
        msg = f"Hardware camera EXIF tags recorded ({found_camera_tags[0]})."
        evidence.append(msg)
        auth_support.append(msg)

    else:
        # Honest: Metadata unavailable
        suspicion = None
        sig_strength = 0
        status = "unavailable"
        available = False
        confidence = 0.0
        evidence_status = "INSUFFICIENT_DATA"
        mod_status = "INSUFFICIENT"
        signal_label = "NORMAL"
        result = "metadata_unavailable"
        provenance_verified = False
        details = (
            "Metadata unavailable. Container headers were stripped or standardized during transmission. "
            "Absence of EXIF headers is common on modern platforms and is treated as neutral (not evidence of tampering)."
        )

    return {
        "status": status,
        "available": available,
        "evidence_status": evidence_status,
        "signal": signal_label,
        "score": int(round(suspicion * 100)) if suspicion is not None else None,
        "module_status": mod_status,
        "signal_strength": sig_strength,
        "suspicion_score": round(suspicion, 2) if suspicion is not None else None,
        "confidence": confidence,
        "result": result,
        "reason": details,
        "details": details,
        "evidence": evidence,
        "limitations": limitations,
        "authenticity_support": auth_support,
        "manipulation_support": manip_support,
        "metrics": {
            "camera_tags_found": len(found_camera_tags),
            "suspicious_tags_found": len(found_suspicious_tags),
            "provenance_verified": provenance_verified,
            "exif_fields_count": len(exif_summary),
            "tags_preview": list(exif_summary.keys())[:10]
        }
    }
