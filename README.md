# 🛡️ Citizen Fraud Shield

> An AI-powered, explainable scam and cyberfraud detection system empowering citizens to detect, analyze, and protect themselves against digital fraud, phishing, and scam messages in real-time.

---

## 📌 Problem Statement

Digital fraud and online scams are proliferating at an unprecedented rate across SMS, messaging apps (WhatsApp, Telegram), emails, and social media. Citizens—especially non-technical users and seniors—frequently fall victim to impersonation tactics, fake urgent alerts, phishing links, and deceptive payment requests. 

Existing security solutions focus primarily on enterprise IT security and offer opaque "black-box" decisions. **Citizen Fraud Shield** bridges this gap by providing an accessible, transparent, multi-channel fraud defense system. It accepts raw text, URLs, and screenshots, returning instant risk scoring accompanied by clear, human-readable explanations of detected red flags in multiple languages.

---

## ✨ Features

- 🔍 **Multi-Channel Scam Detection**:
  - **Text & Email Analysis**: Evaluates raw text for urgency manipulation, authority impersonation, financial extortion, and lottery/job scams.
  - **URL & Phishing Inspector**: Analyzes web links for suspicious TLDs, domain spoofing, obfuscated shorteners, and credential-harvesting patterns.
  - **Screenshot & Image OCR**: Upload screenshots of text messages or chats; automatically extracts text via Tesseract OCR and conducts real-time threat evaluation.
- 🧠 **Explainable AI (XAI) & Risk Engine**:
  - **Dynamic Risk Score (0–100)**: Quantitative threat score mapped to 4 threat levels (*Low*, *Medium*, *High*, *Critical*).
  - **Red Flag Breakdowns**: Pinpoints exact phrases, suspicious patterns, and deceptive tactics matched by the rule engine.
  - **Plain-Language Explanations**: Generates accessible narrative explanations detailing *why* a message is dangerous and what immediate action to take.
- 📊 **Scan History & Security Dashboard**:
  - Persists scan history with filtering, search, and pagination.
  - Visualizes aggregate threat statistics, frequent scam categories, and safety metrics.
- 🌐 **Inclusive Multilingual Support**:
  - Built-in support for **English** and **Hindi (हिंदी)** with seamless runtime switching.
- 🔒 **Privacy-First & Lightweight Design**:
  - Local processing capability with local SQLite database storage and sanitized upload management.

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: Python 3.10+, FastAPI
- **Web Server**: Uvicorn
- **Data Validation & Schemas**: Pydantic v2
- **ORM & Database**: SQLAlchemy, SQLite (production-ready for PostgreSQL / MySQL)
- **OCR Engine**: Tesseract OCR (`pytesseract` & Pillow)

### **Frontend**
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4, Glassmorphism design system
- **Animations**: Framer Motion
- **Icons & Charts**: Lucide React, Recharts
- **State & i18n**: React Context API, custom localization hooks (English / Hindi)

---

## 🏗️ Architecture Overview

```
citizen-fraud-shield/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry, CORS, exception handlers
│   │   ├── api/                 # API Routes (/analyze, /upload, /predict, /explain, /history)
│   │   ├── services/            # Business logic (analyzer, ocr_service, explainer, history_service)
│   │   ├── models/              # Pydantic schemas & SQLAlchemy DB models
│   │   ├── db/                  # DB engine setup & session management
│   │   ├── core/                # App configuration & custom exception definitions
│   │   └── utils/               # File sanitization & upload validation
│   ├── storage/                 # SQLite database storage (fraud_shield.db)
│   ├── uploads/                 # Sanitized screenshot upload directory
│   ├── requirements.txt         # Python package dependencies
│   └── run.py                   # Application starter script
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Layout, GlassCard, ThreatBadge, ScanAnimation
│   │   ├── pages/               # LandingPage, AnalyzePage, ResultsPage, DashboardPage, AboutPage
│   │   ├── context/             # LanguageContext, ScanContext
│   │   ├── lib/                 # API service layer (api.ts) & mock fallback data
│   │   └── locales/             # i18n dictionaries (en.ts, hi.ts)
│   ├── package.json             # Frontend dependencies & scripts
│   └── vite.config.ts           # Vite configuration
│
└── README.md                    # Project documentation
```

### High-Level Data Flow

```
[User Input: Text / URL / Screenshot]
                 │
                 ▼
       ┌──────────────────┐
       │ React Frontend   │
       └─────────┬────────┘
                 │ HTTP POST
                 ▼
       ┌──────────────────┐
       │ FastAPI Backend  │
       └─────────┬────────┘
                 │
  ┌──────────────┼──────────────┐
  │ (If Image)   │ (If Text)    │ (If URL)
  ▼              ▼              ▼
[Tesseract OCR] [Rule Engine]  [URL Analyzer]
  │              │              │
  └──────────────┼──────────────┘
                 ▼
        [Scam Pattern Engine]
                 │
                 ├─► Computes Threat Score & Level
                 ├─► Generates Red Flags & Explanation
                 ├─► Persists to SQLite Database
                 │
                 ▼
[JSON Response: AnalysisResult]
                 │
                 ▼
[Interactive Results UI / Dashboard]
```

---

## 🚀 Local Setup Instructions

### Prerequisites
- **Python**: v3.10 or higher
- **Node.js**: v18.x or higher (npm v9+)
- **Git**
- **Tesseract OCR Engine** (for image screenshot processing)

---

### 1️⃣ Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `CORS_ORIGINS` includes `http://localhost:5173` for Vite).*

5. **Start the FastAPI server**:
   ```bash
   python run.py
   ```
   *The backend will start at `http://localhost:8000`.*
   - **Swagger API Documentation**: `http://localhost:8000/docs`
   - **ReDoc Interactive Documentation**: `http://localhost:8000/redoc`

---

### 2️⃣ Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Set `VITE_API_BASE_URL=http://localhost:8000` to point to the backend).*

4. **Launch the development server**:
   ```bash
   npm run dev
   ```
   *The application will be accessible at `http://localhost:5173`.*

---

## 👁️ OCR Setup (Tesseract Configuration)

To enable screenshot analysis, Tesseract OCR must be installed on your system.

### Installation Options

- **Windows**:
  1. Download and run the Tesseract installer from [UB-Mannheim Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki).
  2. Install Tesseract to the default directory (`C:\Program Files\Tesseract-OCR`).
  3. Ensure `tesseract.exe` path is recognized or update the `TESSERACT_PATH` in your `.env` file:
     ```env
     TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe
     ```

- **macOS**:
  ```bash
  brew install tesseract
  ```

- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt-get update
  sudo apt-get install -y tesseract-ocr
  ```

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/analyze/text` | Analyze raw text/email for scam patterns & threat indicators |
| `POST` | `/api/analyze/url` | Analyze web URLs for phishing, domain spoofing, and malicious link indicators |
| `POST` | `/api/upload/screenshot` | Upload an image file; extracts text via OCR and analyzes for fraud |
| `POST` | `/api/predict` | Lightweight fraud probability calculation (stateless, no DB write) |
| `POST` | `/api/explain` | Generate human-readable explanations for analysis results |
| `GET` | `/api/history` | Retrieve past scan history (supports pagination, filtering) |
| `GET` | `/api/history/stats` | Retrieve aggregate metrics & stats for analytics dashboard |
| `GET` | `/api/history/{id}` | Retrieve details of a single scan result |
| `DELETE` | `/api/history/{id}` | Delete a specific scan result from history |
| `DELETE` | `/api/history` | Clear all scan history |
| `GET` | `/health` | Server health check endpoint |

---

## 📸 Screenshots

*(Placeholders for application interface screenshots)*

| Landing Page & Scanner | Analysis Results & Explanations |
| :---: | :---: |
| ![Landing Page Placeholder](https://via.placeholder.com/600x350?text=Citizen+Fraud+Shield+-+Landing+Page) | ![Results Page Placeholder](https://via.placeholder.com/600x350?text=Analysis+Results+%26+Red+Flags) |

| Security Analytics Dashboard | Multilingual Hindi Mode |
| :---: | :---: |
| ![Dashboard Placeholder](https://via.placeholder.com/600x350?text=Security+Dashboard) | ![Hindi Interface Placeholder](https://via.placeholder.com/600x350?text=Hindi+Language+Support) |

---

## 🔮 Future Enhancements

- 🤖 **ML/LLM Hybrid Detection Engine**: Integrate fine-tuned transformer models (DeBERTa / LLaMA-3-Quantized) for context-aware deep scam detection alongside heuristics.
- 📱 **Browser Extension & Mobile App**: One-click SMS/WhatsApp overlay for automated real-time fraud alerts.
- 📞 **Voice & Audio Scam Detection**: Support for uploading audio calls (deepfake / impersonation call detection).
- 🚨 **Community Threat Intelligence & One-Click Reporting**: Direct integration with cybercrime reporting portals and crowd-sourced fraud threat feeds.

---

## 👥 Team

**vaidehidange123**
- **Vaidehi Dange**
- **Riddhi Rathi** 

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
