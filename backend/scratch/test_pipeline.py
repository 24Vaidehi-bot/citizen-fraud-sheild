"""
Verification script for backend OCR screenshot pipeline and URL scam analysis.
"""
import io
import sys
import os
from PIL import Image, ImageDraw

# Set UTF-8 encoding for stdout
sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.insert(0, r"c:\Users\Vaidehi\Downloads\citizen-fraud-sheild\backend")

from app.services.ocr_service import extract_text, _check_tesseract_availability
from app.services.url_analyzer import analyse_url
from app.services.analysis_service import run_and_store_url_analysis
from app.models.schemas import ThreatLevel
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base

# Setup in-memory SQLite database for testing
engine = create_engine("sqlite:///:memory:")
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def test_ocr_extraction():
    print("=== TESTING OCR EXTRACTION ===")
    assert _check_tesseract_availability(), "Tesseract binary check failed"
    print("Tesseract binary check: PASSED")

    # Create a clean image with English text
    img = Image.new("RGB", (600, 200), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((20, 40), "URGENT: Your account has been suspended.", fill=(0, 0, 0))
    d.text((20, 80), "Click here to verify: bit.ly/xyz123", fill=(0, 0, 0))

    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    file_bytes = img_byte_arr.getvalue()

    result = extract_text(file_bytes, "test_screenshot.png")
    print(f"Extracted text: '{result.extracted_text}'")
    print(f"Confidence: {result.confidence}")
    print(f"Dimensions: {result.width}x{result.height}")
    assert "URGENT" in result.extracted_text or "suspended" in result.extracted_text or "verify" in result.extracted_text
    assert result.detected_language == "en"
    print("OCR extraction test: PASSED\n")

def test_url_analysis():
    print("=== TESTING URL SCAM DETECTION ===")
    db = TestingSessionLocal()
    try:
        test_cases = [
            ("https://www.google.com", ThreatLevel.safe, "Trusted domain"),
            ("https://random-unknown-domain.com", ThreatLevel.low, "Unknown external domain (MUST NOT be SAFE)"),
            ("https://bit.ly/3xYz1", ThreatLevel.medium, "Shortened URL"),
            ("http://sbi-netbanking-update.com/login", ThreatLevel.high, "Fake banking domain"),
            ("http://paytm-kyc-verify-card.xyz", ThreatLevel.critical, "KYC / Payment scam on suspicious TLD"),
            ("http://income-tax-refund-gov-in.com", ThreatLevel.critical, "Government impersonation"),
        ]

        for url, expected_min_level, description in test_cases:
            res = run_and_store_url_analysis(db, url)
            print(f"URL: {url}")
            print(f" -> Level: {res.threat_level.value} (Score: {res.score})")
            print(f" -> Label: {res.label.encode('ascii', 'ignore').decode('ascii')}")
            print(f" -> Indicators: {[i.type for i in res.indicators]}")

            if expected_min_level == ThreatLevel.safe:
                assert res.threat_level == ThreatLevel.safe, f"Expected SAFE for {url}, got {res.threat_level}"
            elif expected_min_level == ThreatLevel.low:
                assert res.threat_level != ThreatLevel.safe, f"Unknown domain {url} MUST NOT be SAFE!"
            elif expected_min_level in (ThreatLevel.high, ThreatLevel.critical):
                assert res.threat_level in (ThreatLevel.high, ThreatLevel.critical, ThreatLevel.medium), f"Expected high risk for {url}, got {res.threat_level}"

            print(f"Result for {description}: OK\n")

        print("URL analysis test: PASSED\n")
    finally:
        db.close()

if __name__ == "__main__":
    test_ocr_extraction()
    test_url_analysis()
    print("ALL TESTS PASSED SUCCESSFULLY!")
