"""Endpoint for generating a human-readable explanation of a result."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.exceptions import InvalidInputError
from app.db.session import get_db
from app.models.schemas import Explanation, ExplainRequest, InputType
from app.services.analysis_service import run_and_store_analysis
from app.services.explainer import build_explanation
from app.services.history_service import get_result

router = APIRouter(prefix="/explain", tags=["Explanation"])


@router.post(
    "",
    response_model=Explanation,
    summary="Generate a plain-language explanation for an analysis result",
)
def explain(payload: ExplainRequest, db: Session = Depends(get_db)) -> Explanation:
    if payload.result_id:
        result = get_result(db, payload.result_id)
    elif payload.text:
        result = run_and_store_analysis(db, raw_text=payload.text, input_type=InputType.text)
    else:
        raise InvalidInputError("Provide either `result_id` or `text`.")

    return build_explanation(result)
