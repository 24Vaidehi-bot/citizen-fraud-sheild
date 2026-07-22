"""
Rule-based scam detection engine.

This is a transparent, explainable pattern-matching model: every score is
traceable to specific matched indicators, which is important for a product
whose whole value proposition is explaining *why* something looks like a
scam. It is written so a future ML classifier (see `services/predict.py`)
can be swapped in behind the same interface without touching callers.
"""
import re
from dataclasses import dataclass, field
from typing import List, Pattern

from app.models.schemas import ThreatIndicator, ThreatLevel


@dataclass(frozen=True)
class ScamPattern:
    type: str
    regex: Pattern
    severity: ThreatLevel
    description: str


@dataclass(frozen=True)
class SafePattern:
    signal: str
    regex: Pattern


SCAM_PATTERNS: List[ScamPattern] = [
    ScamPattern("Urgency Tactic", re.compile(r"urgent|urgently|immediately|act now|limited time", re.I),
                ThreatLevel.high, "Language designed to rush you into acting without thinking"),
    ScamPattern("Suspicious Link", re.compile(r"click here|click link|click below", re.I),
                ThreatLevel.high, "Generic call-to-action link text commonly used in phishing"),
    ScamPattern("Account Phishing", re.compile(r"verify your account|confirm your identity|validate your", re.I),
                ThreatLevel.critical, "Requests to verify or confirm account/identity details"),
    ScamPattern("Lottery Scam", re.compile(r"won|winner|congratulations|you have been selected|lottery", re.I),
                ThreatLevel.critical, "Unsolicited prize/lottery notification"),
    ScamPattern("Credential Theft", re.compile(r"bank account|credit card|social security|\bssn\b|password", re.I),
                ThreatLevel.critical, "Requests sensitive financial or identity credentials"),
    ScamPattern("Payment Scam", re.compile(r"wire transfer|western union|moneygram|bitcoin|crypto|gift card", re.I),
                ThreatLevel.critical, "Requests irreversible or untraceable payment methods"),
    ScamPattern("Bait Offer", re.compile(r"free gift|free money|claim your prize|reward", re.I),
                ThreatLevel.high, "Unrealistic free offer used to lure a response"),
    ScamPattern("Authority Impersonation", re.compile(r"\birs\b|irs agent|tax refund|government|official notice", re.I),
                ThreatLevel.critical, "Impersonates a government agency or official authority"),
    ScamPattern("Account Threat", re.compile(r"suspended|blocked|locked|access denied|deactivated", re.I),
                ThreatLevel.high, "Threatens loss of account access to provoke fear"),
    ScamPattern("Shortened URL", re.compile(r"http://|bit\.ly|tinyurl|t\.co/[a-z]", re.I),
                ThreatLevel.medium, "Uses a shortened or non-HTTPS link that hides the real destination"),
    ScamPattern("Financial Lure", re.compile(r"\$\d+|\d+\s*dollars?|cash|money|payment", re.I),
                ThreatLevel.medium, "References specific monetary amounts or payments"),
    ScamPattern("Secrecy Request", re.compile(r"do not share|secret|confidential|private", re.I),
                ThreatLevel.medium, "Asks the recipient to keep the interaction secret"),
    ScamPattern("Advance Fee Fraud", re.compile(r"nigerian|prince|inheritance|million dollars", re.I),
                ThreatLevel.critical, "Classic advance-fee ('419') fraud language"),
    ScamPattern("Malware Distribution", re.compile(r"download|install|update now|software|app\b", re.I),
                ThreatLevel.high, "Pushes the recipient to download or install something"),
    ScamPattern("Generic Salutation", re.compile(r"dear customer|dear user|dear account holder", re.I),
                ThreatLevel.low, "Generic greeting typical of mass-sent scam messages"),
]

SAFE_PATTERNS: List[SafePattern] = [
    SafePattern("Known sender domain", re.compile(r"from:\s*[\w.]+@[\w.]+\.(com|org|gov|edu)", re.I)),
    SafePattern("Contains unsubscribe option", re.compile(r"unsubscribe", re.I)),
    SafePattern("References privacy policy", re.compile(r"privacy policy", re.I)),
]

_SEVERITY_SCORES = {
    ThreatLevel.safe: 0,
    ThreatLevel.low: 10,
    ThreatLevel.medium: 20,
    ThreatLevel.high: 30,
    ThreatLevel.critical: 45,
}

_LABELS = {
    ThreatLevel.safe: "✅ Clean — No Threats Detected",
    ThreatLevel.low: "🟡 Low Risk — Minor Concerns",
    ThreatLevel.medium: "🟠 Suspicious — Use Caution",
    ThreatLevel.high: "🔴 High Risk — Likely Scam",
    ThreatLevel.critical: "🚨 CRITICAL — Confirmed Scam Pattern",
}

_SUMMARIES = {
    ThreatLevel.safe: "Our AI analysis found no significant threat indicators in this message.",
    ThreatLevel.low: "A few minor red flags were detected. The message may be legitimate but warrants verification.",
    ThreatLevel.medium: "Multiple suspicious patterns detected. This message shares characteristics with known scams.",
    ThreatLevel.high: "This message strongly matches known scam templates. Multiple high-risk indicators present.",
    ThreatLevel.critical: "CONFIRMED SCAM: This message matches critical fraud patterns used in active scam campaigns.",
}

_RECOMMENDATIONS = {
    ThreatLevel.safe: "This message appears legitimate. No immediate action needed, but always remain vigilant.",
    ThreatLevel.low: "Exercise caution. Verify the sender through official channels before taking any action.",
    ThreatLevel.medium: "Do NOT click any links or share personal information. Verify independently.",
    ThreatLevel.high: "HIGH RISK: Do not respond, click links, or share any information. Block the sender.",
    ThreatLevel.critical: "SCAM CONFIRMED: Block immediately, report to authorities, and do not engage under any circumstances.",
}


def _threat_level_for_score(score: float) -> ThreatLevel:
    if score <= 10:
        return ThreatLevel.safe
    if score <= 30:
        return ThreatLevel.low
    if score <= 55:
        return ThreatLevel.medium
    if score <= 75:
        return ThreatLevel.high
    return ThreatLevel.critical


@dataclass
class DetectionOutcome:
    score: float
    threat_level: ThreatLevel
    label: str
    summary: str
    recommendation: str
    indicators: List[ThreatIndicator] = field(default_factory=list)
    red_flags: List[str] = field(default_factory=list)
    safe_signals: List[str] = field(default_factory=list)


def detect(input_text: str) -> DetectionOutcome:
    """Run the full rule-based pipeline over `input_text` and return a scored outcome."""
    indicators: List[ThreatIndicator] = []
    red_flags: List[str] = []
    safe_signals: List[str] = []
    raw_score = 0.0

    for pattern in SCAM_PATTERNS:
        matches = pattern.regex.findall(input_text)
        if matches:
            unique_matches = sorted({m.lower() if isinstance(m, str) else str(m).lower() for m in matches})
            indicators.append(ThreatIndicator(
                type=pattern.type,
                description=pattern.description,
                severity=pattern.severity,
                found=unique_matches,
            ))
            preview = '", "'.join(unique_matches[:2])
            red_flags.append(f'{pattern.type}: "{preview}"')
            raw_score += _SEVERITY_SCORES[pattern.severity]

    for pattern in SAFE_PATTERNS:
        if pattern.regex.search(input_text):
            safe_signals.append(pattern.signal)
            raw_score = max(0.0, raw_score - 10)

    if len(input_text) < 20:
        raw_score += 5
    if re.search(r"[A-Z]{3,}", input_text):
        raw_score += 5
        red_flags.append("Excessive capitalization detected")
    if re.search(r"!{2,}", input_text):
        raw_score += 5
        red_flags.append("Multiple exclamation marks")

    score = min(100.0, raw_score)
    level = _threat_level_for_score(score)

    return DetectionOutcome(
        score=score,
        threat_level=level,
        label=_LABELS[level],
        summary=_SUMMARIES[level],
        recommendation=_RECOMMENDATIONS[level],
        indicators=indicators,
        red_flags=red_flags,
        safe_signals=safe_signals,
    )
