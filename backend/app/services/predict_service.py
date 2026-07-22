"""
Prediction service.

Exposes a focused "is this a scam, and how confident are we" endpoint,
separate from the full analysis, for lightweight/embedded integrations
(e.g. a browser extension checking a message inline). Wraps the same
detection engine so results stay consistent with /analyze and /history.

The `MODEL_VERSION` constant is a seam for swapping the rule-based engine
for a trained ML/LLM classifier later without changing the API shape.
"""
from app.models.schemas import PredictResponse
from app.services.analyzer import detect

MODEL_VERSION = "rule-engine-v1.0"


def predict(text: str) -> PredictResponse:
    outcome = detect(text)
    # Map the 0-100 risk score onto a 0-1 probability the content is a scam.
    scam_probability = round(min(1.0, outcome.score / 100), 3)

    return PredictResponse(
        threat_level=outcome.threat_level,
        score=outcome.score,
        scam_probability=scam_probability,
        label=outcome.label,
        model_version=MODEL_VERSION,
    )
