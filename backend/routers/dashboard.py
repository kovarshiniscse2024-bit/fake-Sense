from collections import defaultdict
from datetime import datetime, timedelta
import os
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..db.models import User, Verification
from ..auth.dependencies import get_current_user
from ..schemas.result import DashboardSummaryResponse, DashboardTrendItem
from ..schemas.verification import VerificationHistoryItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard Analytics"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_verifications = db.query(Verification).filter(
        Verification.user_id == current_user.id
    ).order_by(Verification.created_at.desc()).all()

    total = len(user_verifications)
    likely_real = sum(1 for v in user_verifications if v.verdict in ["Likely Authentic", "Likely Real"])
    likely_ai = sum(1 for v in user_verifications if v.verdict == "Likely AI-Generated")
    likely_manipulated = sum(1 for v in user_verifications if v.verdict == "Likely Manipulated")
    inconclusive = sum(1 for v in user_verifications if v.verdict == "Inconclusive")

    avg_auth = round(sum(v.authenticity_score for v in user_verifications) / total, 1) if total > 0 else 0.0
    avg_conf = round(sum(v.confidence for v in user_verifications) / total, 2) if total > 0 else 0.0

    verdict_distribution = [
        {"name": "Likely Authentic", "value": likely_real, "color": "#059669"},
        {"name": "Likely AI-Generated", "value": likely_ai, "color": "#7e22ce"},
        {"name": "Likely Manipulated", "value": likely_manipulated, "color": "#dc2626"},
        {"name": "Inconclusive", "value": inconclusive, "color": "#d97706"}
    ]

    # Generate 7-day trend history
    day_counts = defaultdict(lambda: {"count": 0, "likely_real": 0, "likely_ai_generated": 0, "likely_manipulated": 0, "inconclusive": 0})
    
    today = datetime.utcnow().date()
    for i in range(6, -1, -1):
        d_str = (today - timedelta(days=i)).strftime("%b %d")
        day_counts[d_str]

    for v in user_verifications:
        d_str = v.created_at.strftime("%b %d")
        if d_str in day_counts:
            day_counts[d_str]["count"] += 1
            if v.verdict in ["Likely Authentic", "Likely Real"]:
                day_counts[d_str]["likely_real"] += 1
            elif v.verdict == "Likely AI-Generated":
                day_counts[d_str]["likely_ai_generated"] += 1
            elif v.verdict == "Likely Manipulated":
                day_counts[d_str]["likely_manipulated"] += 1
            elif v.verdict == "Inconclusive":
                day_counts[d_str]["inconclusive"] += 1

    trend_history = [
        DashboardTrendItem(
            date=k,
            count=v["count"],
            likely_real=v["likely_real"],
            likely_ai_generated=v["likely_ai_generated"],
            likely_manipulated=v["likely_manipulated"],
            inconclusive=v["inconclusive"]
        )
        for k, v in day_counts.items()
    ]

    recent_items = []
    for r in user_verifications[:6]:
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

        recent_items.append(
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
        "total_verifications": total,
        "likely_real_count": likely_real,
        "likely_authentic_count": likely_real,
        "likely_manipulated_count": likely_manipulated,
        "likely_ai_count": likely_ai,
        "inconclusive_count": inconclusive,
        "average_authenticity_score": avg_auth,
        "average_confidence": avg_conf,
        "verdict_distribution": verdict_distribution,
        "trend_history": trend_history,
        "recent_verifications": recent_items
    }
