from pydantic import BaseModel
from typing import List, Optional
from .verification import VerificationHistoryItem


class DashboardTrendItem(BaseModel):
    date: str
    count: int
    likely_real: int
    likely_manipulated: int
    likely_ai_generated: Optional[int] = 0
    inconclusive: int


class DashboardSummaryResponse(BaseModel):
    total_verifications: int
    likely_real_count: int
    likely_authentic_count: Optional[int] = 0
    likely_manipulated_count: int
    likely_ai_count: Optional[int] = 0
    inconclusive_count: int
    average_authenticity_score: float
    average_confidence: float
    verdict_distribution: List[dict]
    trend_history: List[DashboardTrendItem]
    recent_verifications: List[VerificationHistoryItem]
