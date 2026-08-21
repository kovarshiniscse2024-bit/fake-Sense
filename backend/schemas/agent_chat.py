from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any


class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str


class AgentChatRequest(BaseModel):
    verification_id: str = Field(..., description="Target verification record ID (e.g. VS-XXXXXX)")
    question: str = Field(..., min_length=1, description="User's query about the verification result")
    session_id: Optional[str] = Field(None, description="Optional conversational session identifier")
    conversation_history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Prior conversational turns for this verification")


class AgentChatResponse(BaseModel):
    verification_id: str
    answer: str
    session_id: Optional[str] = None


class ExplainEvidenceRequest(BaseModel):
    verification_id: str
    evidence_id: str
    evidence_data: Optional[Dict[str, Any]] = None

