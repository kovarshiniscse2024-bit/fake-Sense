import json
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..db.models import User, Verification
from ..auth.dependencies import get_current_user
from ..schemas.agent_chat import AgentChatRequest, AgentChatResponse, ExplainEvidenceRequest
from ..services.agent_chat import generate_agent_explanation


router = APIRouter(tags=["AI Verification Agent"])


@router.post("/api/agent/chat", response_model=AgentChatResponse)
@router.post("/api/chat", response_model=AgentChatResponse)
@router.post("/agent/chat", response_model=AgentChatResponse)
def chat_with_verification_agent(
    request: AgentChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch verification record owned by user (Security isolation, Section 16 & 23)
    record = db.query(Verification).filter(
        Verification.id == request.verification_id,
        Verification.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record '{request.verification_id}' not found or access denied."
        )

    try:
        modules = json.loads(record.modules_json)
        evidence = json.loads(record.evidence_json)
    except Exception:
        modules = {}
        evidence = []

    # Build comprehensive verification context
    verification_context = {
        "verification_id": record.id,
        "file_name": record.file_name,
        "media_type": record.media_type,
        "verdict": record.verdict,
        "authenticity_score": record.authenticity_score,
        "confidence": record.confidence,
        "modules": modules,
        "evidence": evidence,
        "created_at": record.created_at.strftime("%Y-%m-%d %H:%M UTC")
    }

    # Format conversation history
    history = []
    if request.conversation_history:
        for msg in request.conversation_history:
            history.append({"role": msg.role, "content": msg.content})

    # Generate evidence-grounded explanation
    answer = generate_agent_explanation(
        context=verification_context,
        question=request.question,
        conversation_history=history
    )

    return AgentChatResponse(
        verification_id=record.id,
        answer=answer,
        session_id=request.session_id
    )


@router.post("/api/agent/explain-evidence")

def explain_evidence_endpoint(
    request: ExplainEvidenceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..services.agent_chat import explain_single_evidence

    record = db.query(Verification).filter(
        Verification.id == request.verification_id,
        Verification.user_id == current_user.id
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record '{request.verification_id}' not found."
        )

    try:
        modules = json.loads(record.modules_json)
        evidence = json.loads(record.evidence_json)
    except Exception:
        modules = {}
        evidence = []

    verification_context = {
        "verification_id": record.id,
        "file_name": record.file_name,
        "media_type": record.media_type,
        "verdict": record.verdict,
        "authenticity_score": record.authenticity_score,
        "confidence": record.confidence,
        "modules": modules,
        "evidence": evidence,
        "created_at": record.created_at.strftime("%Y-%m-%d %H:%M UTC")
    }

    answer = explain_single_evidence(
        context=verification_context,
        evidence_id=request.evidence_id,
        evidence_data=request.evidence_data
    )

    return {
        "verification_id": record.id,
        "evidence_id": request.evidence_id,
        "answer": answer
    }

