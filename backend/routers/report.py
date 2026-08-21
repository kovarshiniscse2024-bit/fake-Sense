import json
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..db.models import User, Verification
from ..auth.dependencies import get_current_user
from ..services.pdf_report import generate_pdf_report
from ..services.scoring import calculate_model_agreement, compute_risk_radar

router = APIRouter(tags=["PDF Reporting"])


@router.get("/verify/{verification_id}/report")
@router.get("/report/{verification_id}")
def download_verification_report(
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

    model_agreement = calculate_model_agreement(modules)
    risk_radar = compute_risk_radar(modules, record.authenticity_score, record.confidence)

    verification_data = {
        "verification_id": record.id,
        "file_name": record.file_name,
        "media_type": record.media_type,
        "verdict": record.verdict,
        "authenticity_score": record.authenticity_score,
        "confidence": record.confidence,
        "modules": modules,
        "evidence": evidence,
        "model_agreement": model_agreement,
        "risk_radar": risk_radar,
        "media_path": record.media_path,
        "thumbnail_path": record.thumbnail_path,
        "file_size": record.file_size,
        "mime_type": record.mime_type,
        "width": record.width,
        "height": record.height,
        "duration": record.duration,
        "created_at": record.created_at.strftime("%Y-%m-%d %H:%M UTC")
    }

    try:
        pdf_bytes = generate_pdf_report(verification_data)
        filename = f"FakeSense_Report_{record.id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF report: {str(e)}"
        )
