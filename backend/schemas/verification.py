from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Dict, Any, List, Optional


class ModuleResultDetail(BaseModel):
    status: str = Field(..., description="completed | skipped | failed | not_applicable | neutral")
    suspicion_score: Optional[float] = Field(None, description="0.0 to 1.0 suspicion index")
    result: Optional[str] = Field(None, description="Short categorical outcome")
    details: Optional[str] = Field(None, description="Detailed forensic finding")
    metrics: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Raw mathematical/signal measurements")


class VerificationOut(BaseModel):
    verification_id: str
    file_name: str
    media_type: str
    verdict: str  # "Likely Authentic" | "Likely Manipulated" | "Likely AI-Generated" | "Inconclusive"
    authenticity_score: int  # 0 to 100
    confidence: float  # 0.0 to 1.0
    ai_generated_score: Optional[int] = None
    manipulation_score: Optional[int] = None
    sha256_hash: Optional[str] = None
    modules: Dict[str, Any]
    evidence: List[Any]
    timeline: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    performance_summary: Optional[Dict[str, Any]] = Field(default_factory=dict)
    model_agreement: Optional[Dict[str, Any]] = Field(default_factory=dict)
    risk_radar: Optional[Dict[str, Any]] = Field(default_factory=dict)
    quality_assessment: Optional[Dict[str, Any]] = Field(default_factory=dict)
    decision_trace: Optional[Dict[str, Any]] = Field(default_factory=dict)
    evidence_coverage: Optional[float] = None
    debug: Optional[Dict[str, Any]] = Field(default_factory=dict)
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    thumbnail_url: Optional[str] = None
    media_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VerificationHistoryItem(BaseModel):
    id: str
    file_name: str
    media_type: str
    verdict: str
    authenticity_score: int
    confidence: float
    ai_generated_score: Optional[int] = None
    manipulation_score: Optional[int] = None
    sha256_hash: Optional[str] = None
    file_size: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    thumbnail_url: Optional[str] = None
    media_url: Optional[str] = None
    modules: Optional[Dict[str, Any]] = Field(default_factory=dict)
    evidence_count: Optional[int] = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VerificationHistoryResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[VerificationHistoryItem]


class WhatIfRequest(BaseModel):
    verification_id: str
    excluded_signals: List[str] = Field(default_factory=list, description="List of module names to hypothetically exclude e.g. ['metadata', 'face_analysis', 'ai_generated_detector']")


class WhatIfResponse(BaseModel):
    verification_id: str
    original_score: int
    simulated_score: int
    original_confidence: float
    simulated_confidence: float
    original_verdict: str
    simulated_verdict: str
    score_diff: int
    verdict_changed: bool
    excluded_signals: List[str]
    explanation: str
    is_hypothetical: bool = True
