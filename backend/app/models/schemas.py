"""
Pydantic schemas — the API's public contract.

`AnalysisResult` intentionally mirrors the shape already consumed by the
frontend (see src/lib/mockAnalysis.ts) so the React app can be pointed at
this backend with minimal changes.
"""
from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class ThreatLevel(str, Enum):
    safe = "safe"
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class InputType(str, Enum):
    text = "text"
    image = "image"
    url = "url"


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------

class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=20000, description="Raw message/email content to analyze")

    model_config = {
        "json_schema_extra": {
            "example": {"text": "URGENT: Your account has been suspended. Click here to verify: bit.ly/xyz"}
        }
    }


class UrlAnalysisRequest(BaseModel):
    url: HttpUrl


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=20000)
    input_type: InputType = InputType.text


class ExplainRequest(BaseModel):
    result_id: Optional[str] = Field(None, description="ID of a previously stored analysis to explain")
    text: Optional[str] = Field(None, description="Raw text to analyze + explain directly, if no result_id given")


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class ThreatIndicator(BaseModel):
    type: str
    description: str
    severity: ThreatLevel
    found: List[str]


class AnalysisResult(BaseModel):
    id: str
    timestamp: datetime
    input: str
    input_type: InputType
    score: float = Field(..., ge=0, le=100)
    threat_level: ThreatLevel
    label: str
    summary: str
    indicators: List[ThreatIndicator]
    red_flags: List[str]
    safe_signals: List[str]
    recommendation: str
    source_filename: Optional[str] = None
    extracted_text: Optional[str] = None


class OCRResult(BaseModel):
    extracted_text: str
    confidence: float
    filename: str
    width: int
    height: int
    detected_language: Optional[str] = None
    detected_language_name: Optional[str] = None


class ScreenshotAnalysisResponse(BaseModel):
    ocr: OCRResult
    analysis: AnalysisResult


class ExplanationSection(BaseModel):
    heading: str
    detail: str


class Explanation(BaseModel):
    result_id: str
    threat_level: ThreatLevel
    headline: str
    narrative: str
    sections: List[ExplanationSection]
    key_evidence: List[str]
    confidence: float = Field(..., ge=0, le=1)


class PredictResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    threat_level: ThreatLevel
    score: float
    scam_probability: float = Field(..., ge=0, le=1)
    label: str
    model_version: str


class HistoryListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[AnalysisResult]


class ErrorResponse(BaseModel):
    detail: str
