# Citizen Fraud Shield — Backend API

A FastAPI backend for scam/fraud detection: analyze raw text, URLs, and
screenshots (via OCR), get explainable risk scores, and browse scan history.

Built to pair with the existing Citizen Fraud Shield React frontend — the
`AnalysisResult` response shape mirrors `src/lib/mockAnalysis.ts` so the UI
can be pointed at real endpoints with minimal changes.

## Architecture

```
app/
├── main.py                 # FastAPI app, middleware, startup, exception handlers
├── api/
│   ├── router.py            # aggregates all route modules
│   └── routes/
│       ├── analyze.py        # POST /api/analyze/text, /api/analyze/url
│       ├── upload.py          # POST /api/upload/screenshot  (OCR + analysis)
│       ├── predict.py          # POST /api/predict            (lightweight, no persistence)
│       ├── explain.py           # POST /api/explain             (narrative explanation)
│       └── history.py            # GET/DELETE /api/history*       (scan history)
├── services/                # business logic — no HTTP concerns
│   ├── analyzer.py           # rule-based scam pattern detection engine
│   ├── analysis_service.py    # runs detection + persists a result
│   ├── ocr_service.py          # EasyOCR text extraction
│   ├── predict_service.py       # score -> probability mapping
│   ├── explainer.py              # builds human-readable explanations
│   └── history_service.py         # history queries, stats, deletion
├── models/
│   ├── schemas.py            # Pydantic request/response models (the API contract)
│   └── db_models.py           # SQLAlchemy ORM models (persistence)
├── db/session.py            # SQLAlchemy engine/session/init
├── core/
│   ├── config.py              # environment-driven settings
│   └── exceptions.py           # domain exceptions -> clean HTTP errors
└── utils/
    ├── validation.py          # upload validation (type/size)
    └── file_storage.py         # sanitized, collision-safe file saving
```

**Design principles**
- **HTTP layer stays thin.** Routes only parse input, call a service, and return a schema — no business logic in `api/routes/`.
- **Detection engine is explainable.** Every score is traceable to specific matched patterns (`services/analyzer.py`), which is what `services/explainer.py` narrates.
- **Persistence is swappable.** `DATABASE_URL` defaults to local SQLite but works unmodified with Postgres/MySQL.
- **The rule engine is a seam, not a wall.** `predict_service.MODEL_VERSION` marks where a trained ML/LLM classifier could later replace the regex engine without changing any route or schema.

## Setup

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

python run.py   # or: uvicorn app.main:app --reload
```

API docs (Swagger): http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc

## API Overview

| Method | Endpoint                   | Purpose                                              |
|--------|-----------------------------|-------------------------------------------------------|
| POST   | `/api/analyze/text`         | Analyze raw text/email for scam indicators             |
| POST   | `/api/analyze/url`          | Analyze a URL for scam indicators                        |
| POST   | `/api/upload/screenshot`    | Upload an image, run OCR, then analyze the extracted text |
| POST   | `/api/predict`              | Lightweight scam-probability prediction (not persisted)   |
| POST   | `/api/explain`              | Generate a plain-language explanation for a result           |
| GET    | `/api/history`              | List past scans (paginated, filterable by level/type)         |
| GET    | `/api/history/stats`        | Aggregate stats for a dashboard                                 |
| GET    | `/api/history/{id}`         | Fetch a single past result                                       |
| DELETE | `/api/history/{id}`         | Delete a single result                                             |
| DELETE | `/api/history`              | Clear all history                                                    |
| GET    | `/health`                   | Health check                                                           |

### Example: analyze text

```bash
curl -X POST http://localhost:8000/api/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"text": "URGENT: Your account has been suspended. Verify now: bit.ly/xyz"}'
```

### Example: upload a screenshot

```bash
curl -X POST http://localhost:8000/api/upload/screenshot \
  -F "file=@screenshot.png"
```

## Connecting the existing React frontend

Replace calls to `analyzeMessage()` in `src/lib/mockAnalysis.ts` with fetch
calls to this API (e.g. `POST /api/analyze/text` for text mode, `POST
/api/upload/screenshot` for image mode, `POST /api/analyze/url` for URL
mode), and point `ScanContext`'s history at `GET /api/history` instead of
local state. The `AnalysisResult` response fields line up with the existing
`AnalysisResult` TypeScript interface (`score`, `threatLevel` →
`threat_level`, `indicators`, `redFlags` → `red_flags`, etc. — adjust for
camelCase vs. snake_case, or add a small mapping layer).

Set `CORS_ORIGINS` in `.env` to match your frontend's dev server URL
(default already includes `http://localhost:5173` for Vite).

## Notes

- The detection engine is a transparent, rule-based pattern matcher (15+ scam
  patterns across urgency tactics, phishing, payment scams, authority
  impersonation, etc.), chosen so every score can be explained. It's designed
  to be swapped for a trained classifier later without changing the API.
- History is persisted to SQLite by default (`storage/fraud_shield.db`).
- Uploaded screenshots are stored under `uploads/` with sanitized, unique
  filenames and served read-only at `/uploads/<filename>`.
