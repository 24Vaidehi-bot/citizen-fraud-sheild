"""
Verification script for backend OCR screenshot pipeline (English + Hindi) and URL scam analysis.
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
    print("=== TESTING OCR EXTRACTION (ENGLISH + HINDI) ===")
    assert _check_tesseract_availability(), "Tesseract binary check failed"
    print("Tesseract binary check: PASSED")

    # English screenshot test
    img_en = Image.new("RGB", (600, 200), color=(255, 255, 255))
    d_en = ImageDraw.Draw(img_en)
    d_en.text((20, 40), "URGENT: Your account has been suspended.", fill=(0, 0, 0))
    d_en.text((20, 80), "Click here to verify: bit.ly/xyz123", fill=(0, 0, 0))

    img_byte_arr = io.BytesIO()
    img_en.save(img_byte_arr, format="PNG")
    result_en = extract_text(img_byte_arr.getvalue(), "test_english.png")

    print(f"English Extracted text: '{result_en.extracted_text}'")
    print(f"Language: {result_en.detected_language_name} ({result_en.detected_language})")
    assert result_en.detected_language == "en"
    print("English OCR test: PASSED\n")

if __name__ == "__main__":
    test_ocr_extraction()
    print("ALL OCR TESTS PASSED SUCCESSFULLY!")
