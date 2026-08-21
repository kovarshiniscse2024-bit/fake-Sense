import os
import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..db.database import get_db
from ..db.models import User, Verification
from ..auth.dependencies import get_current_user
from ..schemas.verification import VerificationHistoryResponse, VerificationHistoryItem

router = APIRouter(prefix="/history", tags=["Verification History"])


@router.get("", response_model=VerificationHistoryResponse)
@router.get("/api/history", response_model=VerificationHistoryResponse)
def get_user_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(12, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by file name, ID, or type"),
    verdict: Optional[str] = Query(None, description="Filter by verdict"),
    media_type: Optional[str] = Query(None, description="Filter by media type (image/video)"),
    date_range: Optional[str] = Query(None, description="Filter by date: all, today, 7days, 30days"),
    authenticity_tier: Optional[str] = Query(None, description="Filter by score tier: all, high, medium, low"),
    sort: Optional[str] = Query("newest", description="Sort order: newest, oldest, highest_score, lowest_score, highest_confidence, lowest_confidence, name_asc, name_desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Verification).filter(Verification.user_id == current_user.id)

    # Search filter (file name, ID, or media type)
    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Verification.file_name.ilike(search_pattern)) |
            (Verification.id.ilike(search_pattern)) |
            (Verification.media_type.ilike(search_pattern))
        )

    # Verdict filter
    if verdict and verdict != "all":
        if verdict == "Likely Authentic" or verdict == "Likely Real":
            query = query.filter((Verification.verdict == "Likely Authentic") | (Verification.verdict == "Likely Real"))
        else:
            query = query.filter(Verification.verdict == verdict)

    # Media type filter
    if media_type and media_type != "all":
        query = query.filter(Verification.media_type == media_type.lower())

    # Date range filter
    now = datetime.now(timezone.utc)
    if date_range == "today":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        query = query.filter(Verification.created_at >= start_of_day)
    elif date_range == "7days":
        seven_days_ago = now - timedelta(days=7)
        query = query.filter(Verification.created_at >= seven_days_ago)
    elif date_range == "30days":
        thirty_days_ago = now - timedelta(days=30)
        query = query.filter(Verification.created_at >= thirty_days_ago)

    # Authenticity Score tier filter
    if authenticity_tier == "high":
        query = query.filter(Verification.authenticity_score >= 70)
    elif authenticity_tier == "medium":
        query = query.filter(
            (Verification.authenticity_score >= 40) &
            (Verification.authenticity_score < 70)
        )
    elif authenticity_tier == "low":
        query = query.filter(Verification.authenticity_score < 40)

    # Sorting
    if sort == "oldest":
        query = query.order_by(Verification.created_at.asc())
    elif sort == "highest_score":
        query = query.order_by(Verification.authenticity_score.desc())
    elif sort == "lowest_score":
        query = query.order_by(Verification.authenticity_score.asc())
    elif sort == "highest_confidence":
        query = query.order_by(Verification.confidence.desc())
    elif sort == "lowest_confidence":
        query = query.order_by(Verification.confidence.asc())
    elif sort == "name_asc":
        query = query.order_by(Verification.file_name.asc())
    elif sort == "name_desc":
        query = query.order_by(Verification.file_name.desc())
    else:
        query = query.order_by(Verification.created_at.desc())

    total = query.count()
    offset = (page - 1) * page_size
    records = query.offset(offset).limit(page_size).all()

    items = []
    for r in records:
        has_media = bool(r.media_path and os.path.exists(r.media_path))
        has_thumb = bool(r.thumbnail_path and os.path.exists(r.thumbnail_path))

        try:
            modules = json.loads(r.modules_json) if r.modules_json else {}
        except Exception:
            modules = {}

        try:
            evidence = json.loads(r.evidence_json) if r.evidence_json else []
        except Exception:
            evidence = []

        ai_mod = modules.get("ai_generated_detector", {})
        vis_mod = modules.get("visual_cnn", {})
        ai_score = round(ai_mod.get("score_ai_generated", 0) * 100) if ai_mod.get("score_ai_generated") is not None else None
        manip_score = round(vis_mod.get("suspicion_score", 0) * 100) if vis_mod.get("suspicion_score") is not None else None

        items.append(
            VerificationHistoryItem(
                id=r.id,
                file_name=r.file_name,
                media_type=r.media_type,
                verdict=r.verdict,
                authenticity_score=r.authenticity_score,
                confidence=r.confidence,
                ai_generated_score=ai_score,
                manipulation_score=manip_score,
                sha256_hash=r.sha256_hash,
                file_size=r.file_size,
                width=r.width,
                height=r.height,
                duration=r.duration,
                thumbnail_url=f"/media/{r.id}/thumbnail" if (has_thumb or has_media) else None,
                media_url=f"/media/{r.id}" if has_media else None,
                modules=modules,
                evidence_count=len(evidence),
                created_at=r.created_at
            )
        )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": items
    }
