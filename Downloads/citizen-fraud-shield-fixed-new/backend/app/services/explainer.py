"""
Explanation generation.

Turns a raw detection outcome into a structured, human-readable narrative:
a headline, a plain-language story of *why* the score landed where it did,
and a breakdown grouped by indicator category. This is what powers the
"why did we flag this?" panel on the results page.
"""
from typing import List

from app.models.schemas import (
    AnalysisResult,
    Explanation,
    ExplanationSection,
    ThreatLevel,
)

_HEADLINES = {
    ThreatLevel.safe: "No meaningful scam indicators were found",
    ThreatLevel.low: "A couple of minor warning signs, but nothing conclusive",
    ThreatLevel.medium: "Several patterns commonly seen in scams were detected",
    ThreatLevel.high: "This closely resembles a known scam template",
    ThreatLevel.critical: "This matches confirmed, high-confidence fraud patterns",
}

_SEVERITY_WEIGHT = {
    ThreatLevel.critical: 4,
    ThreatLevel.high: 3,
    ThreatLevel.medium: 2,
    ThreatLevel.low: 1,
    ThreatLevel.safe: 0,
}


def build_explanation(result: AnalysisResult) -> Explanation:
    sections: List[ExplanationSection] = []

    if result.indicators:
        # Group indicators by severity, most severe first, for a scannable breakdown.
        ordered = sorted(result.indicators, key=lambda i: _SEVERITY_WEIGHT[i.severity], reverse=True)
        for indicator in ordered:
            example = f' (e.g. "{indicator.found[0]}")' if indicator.found else ""
            sections.append(ExplanationSection(
                heading=f"{indicator.type} — {indicator.severity.value.upper()}",
                detail=f"{indicator.description}{example}.",
            ))
    else:
        sections.append(ExplanationSection(
            heading="No red-flag patterns matched",
            detail="None of our known scam-language patterns were found in this content.",
        ))

    if result.safe_signals:
        sections.append(ExplanationSection(
            heading="Signals suggesting legitimacy",
            detail="Detected: " + "; ".join(result.safe_signals) + ".",
        ))

    narrative_parts = [result.summary]
    if result.red_flags:
        narrative_parts.append(
            "Specifically, we found " + str(len(result.indicators)) + " distinct pattern(s) of concern: "
            + "; ".join(result.red_flags[:5]) + ("." if len(result.red_flags) <= 5 else ", among others.")
        )
    if result.safe_signals:
        narrative_parts.append(
            "This was offset slightly by " + str(len(result.safe_signals)) + " signal(s) typically seen in "
            "legitimate correspondence."
        )
    narrative_parts.append(result.recommendation)
    narrative = " ".join(narrative_parts)

    # Confidence is a simple function of how much evidence (indicators + text length)
    # informed the decision — more matched signals -> higher confidence in the label.
    evidence_count = len(result.indicators) + len(result.safe_signals)
    confidence = min(0.98, 0.55 + 0.08 * evidence_count) if evidence_count else 0.5

    return Explanation(
        result_id=result.id,
        threat_level=result.threat_level,
        headline=_HEADLINES[result.threat_level],
        narrative=narrative,
        sections=sections,
        key_evidence=result.red_flags[:8],
        confidence=round(confidence, 2),
    )
