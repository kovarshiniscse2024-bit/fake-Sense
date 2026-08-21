import os
import json
import logging
import aiofiles
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..db.models import User, Verification
from ..auth.dependencies import get_current_user
from ..utils.file_validation import detect_file_type, validate_file_size
from ..utils.security import sanitize_filename, generate_safe_filepath
from ..utils.cleanup import safe_remove_files
from ..services.agent import VerificationAgent
from ..services.verify_service import execute_media_verification
from ..services.agent_chat import explain_comparison

router = APIRouter(prefix="/compare", tags=["Compare Mode"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class CompareByIdsRequest(BaseModel):
    id_a: str = Field(..., description="Verification ID for Media A")
    id_b: str = Field(..., description="Verification ID for Media B")


class CompareExplainRequest(BaseModel):
    id_a: str = Field(..., description="Verification ID for Media A")
    id_b: str = Field(..., description="Verification ID for Media B")
    question: Optional[str] = Field(None, description="Optional custom comparative query")


def _build_context_from_record(record: Verification) -> Dict[str, Any]:
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

    return {
        "verification_id": record.id,
        "file_name": record.file_name,
        "media_type": record.media_type,
        "verdict": record.verdict,
        "authenticity_score": record.authenticity_score,
        "confidence": record.confidence,
        "modules": modules,
        "evidence": evidence,
        "timeline": timeline,
        "performance_summary": performance_summary,
        "thumbnail_url": f"/media/{record.id}/thumbnail",
        "media_url": f"/media/{record.id}",
        "created_at": record.created_at
    }


@router.post("/upload")
async def compare_media_upload(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compare Mode Upload (Feature 7).
    Directly reuses the standard execute_media_verification pipeline for both files.
    """
    logger = logging.getLogger("fakesense.compare")

    # Step 1: Execute verification on Media A using the exact same pipeline as 'Verify Media'
    logger.info(f"[COMPARE] Processing Media A upload: {file_a.filename}")
    result_a = await execute_media_verification(file_a, current_user, db)
    logger.info(f"[COMPARE] Result A ready: ID={result_a.get('verification_id')}, Verdict={result_a.get('verdict')}, Score={result_a.get('authenticity_score')}%")

    # Step 2: Execute verification on Media B using the exact same pipeline as 'Verify Media'
    logger.info(f"[COMPARE] Processing Media B upload: {file_b.filename}")
    result_b = await execute_media_verification(file_b, current_user, db)
    logger.info(f"[COMPARE] Result B ready: ID={result_b.get('verification_id')}, Verdict={result_b.get('verdict')}, Score={result_b.get('authenticity_score')}%")

    # Step 3: Return both independent result objects
    return {
        "media_a": result_a,
        "media_b": result_b
    }




@router.post("/by-ids")
def compare_by_ids(
    request: CompareByIdsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compare Mode by Existing IDs (Feature 7).
    """
    rec_a = db.query(Verification).filter(Verification.id == request.id_a, Verification.user_id == current_user.id).first()
    rec_b = db.query(Verification).filter(Verification.id == request.id_b, Verification.user_id == current_user.id).first()

    if not rec_a or not rec_b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both verification records not found in your history."
        )

    return {
        "media_a": _build_context_from_record(rec_a),
        "media_b": _build_context_from_record(rec_b)
    }


@router.post("/explain")
def explain_media_comparison(
    request: CompareExplainRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    AI Comparison Explanation (Feature 8).
    Connects both verification contexts to the AI Agent to explain why results differ.
    """
    rec_a = db.query(Verification).filter(Verification.id == request.id_a, Verification.user_id == current_user.id).first()
    rec_b = db.query(Verification).filter(Verification.id == request.id_b, Verification.user_id == current_user.id).first()

    if not rec_a or not rec_b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both verification records not found for comparison."
        )

    ctx_a = _build_context_from_record(rec_a)
    ctx_b = _build_context_from_record(rec_b)

    answer = explain_comparison(ctx_a, ctx_b, request.question)

    return {
        "id_a": request.id_a,
        "id_b": request.id_b,
        "answer": answer
    }

