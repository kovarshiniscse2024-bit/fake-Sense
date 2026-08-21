import os
import json
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, Query
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..db.models import User, Verification
from ..auth.dependencies import get_current_user, get_current_user_flexible
from ..utils.file_validation import detect_file_type, validate_file_size
from ..utils.security import sanitize_filename, generate_safe_filepath
from ..utils.cleanup import safe_remove_files
from ..services.verify_service import execute_media_verification
from ..services.scoring import calculate_model_agreement, compute_risk_radar, compute_what_if_analysis
from ..services.storage_service import delete_verification_media
from ..schemas.verification import VerificationOut, WhatIfRequest, WhatIfResponse

router = APIRouter(tags=["Verification"])


@router.post("/verify", response_model=VerificationOut)
@router.post("/api/verify", response_model=VerificationOut)
async def verify_media(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Standard Single Media Verification (Start AI Verification).
    """
    return await execute_media_verification(file, current_user, db)


@router.get("/verify/{verification_id}", response_model=VerificationOut)
@router.get("/api/verification/{verification_id}", response_model=VerificationOut)
def get_verification_result(
    verification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(Verification).filter(
        Verification.id == verification_id,
        Verification.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record '{verification_id}' not found."
        )

    try:
        modules = json.loads(record.modules_json)
        evidence = json.loads(record.evidence_json)
    except Exception:
        modules = {}
        evidence = []

    try:
        timeline = json.loads(record.timeline_json) if record.timeline_json else []
    except Exception:
        timeline = []

    try:
        performance_summary = json.loads(record.performance_json) if record.performance_json else {}
    except Exception:
        performance_summary = {}

    model_agreement = calculate_model_agreement(modules)
    risk_radar = compute_risk_radar(modules, record.authenticity_score, record.confidence)

    has_media = bool(record.media_path and os.path.exists(record.media_path))
    has_thumb = bool(record.thumbnail_path and os.path.exists(record.thumbnail_path))

    ai_gen = modules.get("ai_generated_detector", {})
    vis = modules.get("visual_cnn", {})
    quality_res = modules.get("quality_assessment", {})

    ai_score = round(ai_gen.get("score_ai_generated", 0) * 100) if ai_gen.get("score_ai_generated") is not None else None
    manip_score = round(vis.get("suspicion_score", 0) * 100) if vis.get("suspicion_score") is not None else None

    evidence_coverage = performance_summary.get("evidence_coverage", 1.0)
    debug_payload = {
        "modules": {
            "visual": modules.get("visual_cnn", {}),
            "facial": modules.get("face_analysis", {}),
            "metadata": modules.get("metadata", {}),
            "quality": modules.get("quality_assessment", {}),
            "prnu": modules.get("prnu", {}),
            "ai_generated": modules.get("ai_generated_detector", {})
        },
        "evidence_coverage": evidence_coverage,
        "model_agreement": model_agreement,
        "authenticity_score": record.authenticity_score,
        "confidence": record.confidence,
        "verdict": record.verdict
    }

    return {
        "verification_id": record.id,
        "file_name": record.file_name,
        "media_type": record.media_type,
        "verdict": record.verdict,
        "authenticity_score": record.authenticity_score,
        "confidence": record.confidence,
        "evidence_coverage": evidence_coverage,
        "ai_generated_score": ai_score,
        "manipulation_score": manip_score,
        "sha256_hash": record.sha256_hash,
        "modules": modules,
        "evidence": evidence,
        "timeline": timeline,
        "performance_summary": performance_summary,
        "model_agreement": model_agreement,
        "risk_radar": risk_radar,
        "quality_assessment": quality_res,
        "debug": debug_payload,
        "file_size": record.file_size,
        "mime_type": record.mime_type,
        "width": record.width,
        "height": record.height,
        "duration": record.duration,
        "thumbnail_url": f"/media/{verification_id}/thumbnail" if has_thumb or has_media else None,
        "media_url": f"/media/{verification_id}" if has_media else None,
        "created_at": record.created_at
    }


@router.get("/media/{verification_id}")
@router.get("/api/media/{verification_id}")
@router.get("/api/verifications/{verification_id}/media")
def serve_verification_media(
    verification_id: str,
    current_user: User = Depends(get_current_user_flexible),
    db: Session = Depends(get_db)
):
    """
    Secure endpoint to retrieve original/safe uploaded media.
    Validates ownership (returns 403 if unauthorized) and streams media with correct MIME type.
    """
    record = db.query(Verification).filter(Verification.id == verification_id).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record '{verification_id}' not found."
        )

    if record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to access this verification media."
        )

    if not record.media_path or not os.path.exists(record.media_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media file not found or unavailable on disk."
        )

    mime_type = record.mime_type or ("video/mp4" if record.media_type == "video" else "image/jpeg")
    return FileResponse(
        path=record.media_path,
        media_type=mime_type,
        filename=record.file_name
    )


@router.get("/media/{verification_id}/thumbnail")
@router.get("/api/media/{verification_id}/thumbnail")
@router.get("/api/verifications/{verification_id}/thumbnail")
def serve_verification_thumbnail(
    verification_id: str,
    current_user: User = Depends(get_current_user_flexible),
    db: Session = Depends(get_db)
):
    """
    Secure endpoint to retrieve optimized thumbnail for history and dashboard preview.
    Validates ownership (returns 403 if unauthorized).
    """
    record = db.query(Verification).filter(Verification.id == verification_id).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record '{verification_id}' not found."
        )

    if record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to view this thumbnail."
        )

    if record.thumbnail_path and os.path.exists(record.thumbnail_path):
        return FileResponse(path=record.thumbnail_path, media_type="image/jpeg")

    # If thumbnail is missing but media exists and is an image, fallback to media
    if record.media_path and os.path.exists(record.media_path) and record.media_type == "image":
        return FileResponse(path=record.media_path, media_type="image/jpeg")

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Thumbnail preview unavailable for this record."
    )


@router.post("/verify/what-if", response_model=WhatIfResponse)
@router.post("/api/verification/what-if", response_model=WhatIfResponse)
def simulate_what_if_analysis(
    req: WhatIfRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Feature 6: What-If Analysis Simulator.
    Simulates hypothetical authenticity score, confidence, and verdict excluding specified signals.
    """
    record = db.query(Verification).filter(
        Verification.id == req.verification_id,
        Verification.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record '{req.verification_id}' not found."
        )

    try:
        modules = json.loads(record.modules_json)
    except Exception:
        modules = {}

    sim_result = compute_what_if_analysis(modules, req.excluded_signals)
    sim_result["verification_id"] = req.verification_id

    return sim_result


@router.delete("/verify/{verification_id}")
@router.delete("/api/verification/{verification_id}")
def delete_verification_record(
    verification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Privacy / Delete Verification Feature.
    Permanently removes the verification record, media files, and thumbnails.
    """
    record = db.query(Verification).filter(
        Verification.id == verification_id,
        Verification.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record '{verification_id}' not found or access denied."
        )

    # Purge disk media files
    delete_verification_media(record.media_path, record.thumbnail_path)

    db.delete(record)
    db.commit()

    return {
        "status": "success",
        "verification_id": verification_id,
        "message": "Verification deleted successfully. All stored analysis data and media files have been purged."
    }
