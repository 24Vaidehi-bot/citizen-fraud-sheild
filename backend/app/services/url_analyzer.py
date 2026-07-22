"""
URL-specific scam analysis service.

Analyses a full URL (domain, subdomains, path, and query parameters) for
indicators of phishing, fake banking domains, shortened URLs, KYC scams,
payment scams, typo-squatting/brand spoofing, and suspicious domains.
"""
import re
import urllib.parse
from dataclasses import dataclass, field
from typing import List

# Known trusted domains that return SAFE if no specific threat indicators match.
_TRUSTED_DOMAINS = {
    "google.com", "microsoft.com", "github.com", "gov.in", "nic.in",
    "apple.com", "amazon.com", "wikipedia.org", "youtube.com", "sbi.co.in",
    "hdfcbank.com", "icicibank.com", "axisbank.com", "kotak.com",
}

# Known URL shorteners that hide the real destination.
_SHORTENER_DOMAINS = re.compile(
    r"""^(
        bit\.ly | tinyurl\.com | t\.co | goo\.gl | ow\.ly | short\.io |
        rb\.gy | cutt\.ly | is\.gd | v\.gd | buff\.ly | ift\.tt |
        tiny\.cc | lnkd\.in | clck\.ru | shorte\.st | adf\.ly |
        linktr\.ee | snip\.ly | su\.pr | go\.tiny\.email |
        url\.cn | dwz\.cn | sina\.lt | weibo\.cn | shorturl\.at |
        dub\.sh | qr\.ae | s\.id | v\.ht | bc\.vc | tiny\.one |
        urlr\.me | rotf\.lol | git\.io
    )$""",
    re.VERBOSE | re.IGNORECASE,
)

# Major banking and payment brand keywords for fake banking & typo-squatting checks.
_BANK_BRANDS = (
    r"sbi|statebank|hdfc|hdfcbank|icici|icicibank|axis|axisbank|kotak|kotakbank|"
    r"pnb|punjabnationalbank|bankofbaroda|bob|canara|canarabank|unionbank|indusind|"
    r"yesbank|idfc|idfcfirstbank|chase|wellsfargo|citi|citibank|bankofamerica|"
    r"hsbc|barclays|paypal|stripe|razorpay|paytm|phonepe|gpay|googlepay|bharatpe|cred"
)

# Pattern for fake banking domains, brand spoofing, or banking keywords.
_FAKE_BANKING_PATTERN = re.compile(
    rf"""(
        ({_BANK_BRANDS})[-.]?(net|bank|online|secure|login|verify|update|kyc|portal|service|wallet) |
        (netbanking|bankinglogin|securebank|banksecure|bankverify)[-.]?
    )""",
    re.VERBOSE | re.IGNORECASE,
)

# Typo-squatting & misspelling heuristics.
_TYPO_SQUATTING_PATTERN = re.compile(
    r"\b("
    r"paytmm|hdfcc|sbiibank|icicci|phonpe|gpayy|paypa1|paypaI|chasee|cit1bank|"
    r"arnazon|micros0ft|goog1e|s-b-i|h-d-f-c|pay-tm|phone-pe"
    r")\b",
    re.IGNORECASE,
)

# KYC / account-update / verification scam keywords in URLs.
_KYC_PATTERN = re.compile(
    r"kyc|aadhar|aadhaar|pan[\-_.]?card|pan[\-_.]?update|ekyc|"
    r"verify[\-_.]?account|account[\-_.]?verify|update[\-_.]?account|"
    r"re[\-_.]?kyc|document[\-_.]?upload|upload[\-_.]?document|"
    r"biometric[\-_.]?verify|identity[\-_.]?verify",
    re.IGNORECASE,
)

# Payment / wallet scam keywords.
_PAYMENT_SCAM_PATTERN = re.compile(
    r"cashback|refund[\-_.]?claim|claim[\-_.]?refund|"
    r"upi[\-_.]?reward|upi[\-_.]?bonus|free[\-_.]?recharge|"
    r"lottery[\-_.]?prize|prize[\-_.]?claim|"
    r"coupon[\-_.]?redeem|instant[\-_.]?money|"
    r"earn[\-_.]?daily|earn[\-_.]?online|work[\-_.]?from[\-_.]?home|"
    r"scratch[\-_.]?card|spin[\-_.]?win|crypto[\-_.]?bonus",
    re.IGNORECASE,
)

# Government impersonation keywords.
_GOVT_IMPERSONATION_PATTERN = re.compile(
    r"gov\.in\b(?!$) |"          # gov.in is legit; gov.in.anything is not
    r"\.gov-in\. | gov-india |"
    r"income[\-_.]?tax[\-_.]?refund | it[\-_.]?refund |"
    r"epfo[\-_.]?claim | provident[\-_.]?fund[\-_.]?claim |"
    r"pm[\-_.]?kisan[\-_.]?yojana | yojana[\-_.]?claim |"
    r"ration[\-_.]?card[\-_.]?update | aayushman[\-_.]?bharat |"
    r"uidai[\-_.]?update | aadhaar[\-_.]?link",
    re.VERBOSE | re.IGNORECASE,
)

# Phishing keywords commonly embedded in URL domains, paths, or parameters.
_PHISHING_KEYWORDS_PATTERN = re.compile(
    r"login[\-_.]?verify | verify[\-_.]?login | secure[\-_.]?login |"
    r"account[\-_.]?suspended | account[\-_.]?block |"
    r"password[\-_.]?reset | reset[\-_.]?password |"
    r"otp[\-_.]?verify | verify[\-_.]?otp |"
    r"click[\-_.]?here | confirm[\-_.]?now |"
    r"limited[\-_.]?offer | claim[\-_.]?now | act[\-_.]?now |"
    r"credential | authenticate | session[\-_.]?update",
    re.VERBOSE | re.IGNORECASE,
)

# IP-address-based URLs (instead of domain names) — classic phishing signal.
_IP_URL_PATTERN = re.compile(
    r"^https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}"
)

# Suspicious TLDs that are disproportionately used for phishing.
_SUSPICIOUS_TLDS = re.compile(
    r"\.(xyz|top|club|online|site|live|icu|buzz|gq|ml|cf|ga|tk|pw|cc|biz|info|work|click|link|zip|mov|rest|fit|surf|monster|cfd|sbs|best)$",
    re.IGNORECASE,
)

# Threshold for excessive subdomain levels (e.g. login.bank.update.evil.com)
_EXCESSIVE_SUBDOMAIN_THRESHOLD = 4

# Severity weights
_URL_WEIGHTS = {
    "ip_address_url": 45,
    "shortener": 30,
    "fake_banking_domain": 50,
    "typo_squatting": 40,
    "kyc_keywords": 35,
    "payment_scam_keywords": 30,
    "govt_impersonation": 40,
    "phishing_keywords": 30,
    "suspicious_tld": 25,
    "excessive_subdomains": 20,
    "no_https": 15,
    "userinfo_spoofing": 35,
    "unverified_domain_baseline": 15,
    "very_long_url": 10,
}


@dataclass
class URLIndicator:
    signal: str
    description: str
    weight: int


@dataclass
class URLAnalysisOutcome:
    url: str
    url_score: float
    indicators: List[URLIndicator] = field(default_factory=list)
    diagnostic_text: str = ""


def _normalize_url(url: str) -> tuple[str, urllib.parse.ParseResult]:
    """Ensure URL has scheme and return normalized string + parsed structure."""
    raw_url = url.strip()
    if not re.match(r"^https?://", raw_url, re.I):
        raw_url = "https://" + raw_url
    parsed = urllib.parse.urlparse(raw_url)
    return raw_url, parsed


def _extract_hostname(parsed: urllib.parse.ParseResult) -> str:
    """Return hostname in lower case, without port."""
    return (parsed.hostname or "").lower()


def _is_trusted_domain(hostname: str) -> bool:
    """Return True if hostname is or ends with a known trusted domain."""
    for trusted in _TRUSTED_DOMAINS:
        if hostname == trusted or hostname.endswith("." + trusted):
            return True
    return False


def _check_subdomain_deception(hostname: str) -> bool:
    """Detect if a brand name appears as a subdomain on a different domain.
    E.g., 'sbi.co.in.scamdomain.com' where 'sbi.co.in' is in subdomains."""
    parts = hostname.split(".")
    if len(parts) > 2:
        subdomain_part = ".".join(parts[:-2])
        for brand in ["sbi", "hdfc", "icici", "axis", "kotak", "paytm", "phonepe", "gpay", "paypal", "chase"]:
            if brand in subdomain_part:
                return True
    return False


def analyse_url(url: str) -> URLAnalysisOutcome:
    """
    Analyse a URL for phishing, fake banking, shortened links, KYC/payment scams,
    typo-squatting, and suspicious domain patterns.
    """
    indicators: List[URLIndicator] = []
    raw_score = 0.0
    diagnostic_parts: List[str] = [f"URL: {url}"]

    full_url, parsed = _normalize_url(url)
    hostname = _extract_hostname(parsed)
    scheme = (parsed.scheme or "").lower()
    path = parsed.path or ""
    query = parsed.query or ""
    full_path_query = f"{path}?{query}" if query else path

    # --- IP-address URL ---
    if _IP_URL_PATTERN.match(full_url):
        ind = URLIndicator(
            "IP Address URL",
            "URL uses a raw IP address instead of a domain name — a strong phishing indicator.",
            _URL_WEIGHTS["ip_address_url"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append("Raw IP address in URL — phishing tactic")

    # --- URL Shortener ---
    if hostname and _SHORTENER_DOMAINS.match(hostname):
        ind = URLIndicator(
            "Shortened URL",
            f"Domain '{hostname}' is a URL shortener that hides the actual destination address.",
            _URL_WEIGHTS["shortener"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append(f"Shortened URL via {hostname}")

    # --- Insecure HTTP ---
    if scheme == "http":
        ind = URLIndicator(
            "Insecure HTTP Connection",
            "URL uses unencrypted HTTP instead of HTTPS.",
            _URL_WEIGHTS["no_https"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append("Insecure HTTP connection")

    # --- Userinfo Spoofing (@ symbol in URL authority) ---
    if "@" in parsed.netloc:
        ind = URLIndicator(
            "URL Userinfo Spoofing",
            "URL contains '@' symbol, which can mislead users about the real destination domain.",
            _URL_WEIGHTS["userinfo_spoofing"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append("URL authority spoofing using @ symbol")

    # --- Suspicious TLD ---
    if hostname and _SUSPICIOUS_TLDS.search(hostname):
        ind = URLIndicator(
            "Suspicious Top-Level Domain",
            f"Domain '{hostname}' uses a TLD commonly associated with high-risk spam and phishing.",
            _URL_WEIGHTS["suspicious_tld"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append(f"Suspicious TLD in hostname: {hostname}")

    # --- Excessive Subdomains ---
    subdomain_count = len(hostname.split("."))
    if hostname and subdomain_count >= _EXCESSIVE_SUBDOMAIN_THRESHOLD:
        ind = URLIndicator(
            "Excessive Subdomains",
            f"Domain '{hostname}' has {subdomain_count} domain levels — commonly used to disguise malicious hosts.",
            _URL_WEIGHTS["excessive_subdomains"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append("Excessive subdomains — possible domain spoofing")

    # --- Fake Banking Domain / Brand Spoofing ---
    if _FAKE_BANKING_PATTERN.search(hostname) or _FAKE_BANKING_PATTERN.search(full_path_query) or _check_subdomain_deception(hostname):
        ind = URLIndicator(
            "Fake Banking / Brand Impersonation Domain",
            "URL mimics a legitimate banking or financial brand to steal credentials.",
            _URL_WEIGHTS["fake_banking_domain"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append("Fake banking domain detected — credential phishing risk")

    # --- Typo-squatting & Misspellings ---
    if _TYPO_SQUATTING_PATTERN.search(hostname) or _TYPO_SQUATTING_PATTERN.search(full_path_query):
        ind = URLIndicator(
            "Typo-squatting Brand Impersonation",
            "URL uses misspelled brand names or hyphenated brand variations to trick users.",
            _URL_WEIGHTS["typo_squatting"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append("Typo-squatting or misspelled brand detected")

    # --- KYC Scam Keywords ---
    if _KYC_PATTERN.search(full_url):
        ind = URLIndicator(
            "KYC Verification Scam Keywords",
            "URL contains KYC, Aadhaar, PAN, or account-verification keywords used in fraud scams.",
            _URL_WEIGHTS["kyc_keywords"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append("KYC verification scam pattern: account verification kyc update")

    # --- Payment / Reward Scam ---
    if _PAYMENT_SCAM_PATTERN.search(full_url):
        ind = URLIndicator(
            "Payment / Reward Scam Keywords",
            "URL contains cashback, lottery, UPI reward, or instant money scam keywords.",
            _URL_WEIGHTS["payment_scam_keywords"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append("Payment scam pattern: cashback reward prize lottery")

    # --- Government Impersonation ---
    if _GOVT_IMPERSONATION_PATTERN.search(full_url):
        ind = URLIndicator(
            "Government Impersonation Keywords",
            "URL impersonates a government agency or welfare scheme.",
            _URL_WEIGHTS["govt_impersonation"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append("Government impersonation pattern: income tax refund yojana scheme")

    # --- Phishing Keywords in Domain / Path / Query ---
    if _PHISHING_KEYWORDS_PATTERN.search(full_url):
        ind = URLIndicator(
            "Phishing Keywords",
            "URL contains credential theft or urgent account login keywords.",
            _URL_WEIGHTS["phishing_keywords"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append("Phishing keywords: login verify account suspended reset password")

    # --- Unverified Domain Baseline Risk (Do NOT return SAFE by default) ---
    if hostname and not _is_trusted_domain(hostname):
        ind = URLIndicator(
            "Unverified External Domain",
            f"Domain '{hostname}' is an external unverified domain. Exercise caution before logging in or submitting sensitive data.",
            _URL_WEIGHTS["unverified_domain_baseline"],
        )
        indicators.append(ind)
        raw_score += ind.weight
        diagnostic_parts.append("Unverified external domain")

    url_score = min(100.0, raw_score)
    diagnostic_text = ". ".join(diagnostic_parts)

    return URLAnalysisOutcome(
        url=url,
        url_score=url_score,
        indicators=indicators,
        diagnostic_text=diagnostic_text,
    )

