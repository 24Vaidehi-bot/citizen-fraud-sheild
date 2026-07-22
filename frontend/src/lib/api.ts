// Thin client for the Citizen Fraud Shield backend API.
// Handles the screenshot -> OCR -> scam-analysis pipeline (and, for
// completeness, plain text/URL analysis against the same backend).
//
// The backend's `AnalysisResult` schema is snake_case; the frontend has
// historically used a camelCase shape (see lib/mockAnalysis.ts). This module
// maps between the two so every page can keep consuming the same
// `AnalysisResult` TypeScript type regardless of where the result came from.
import type { AnalysisResult, ThreatIndicator, ThreatLevel } from './mockAnalysis';

const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL || 'https://citizen-fraud-sheild.onrender.com';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Backend response shapes (snake_case, matches app/models/schemas.py)
// ---------------------------------------------------------------------------

interface BackendThreatIndicator {
  type: string;
  description: string;
  severity: ThreatLevel;
  found: string[];
}

interface BackendAnalysisResult {
  id: string;
  timestamp: string;
  input: string;
  input_type: 'text' | 'image' | 'url';
  score: number;
  threat_level: ThreatLevel;
  label: string;
  summary: string;
  indicators: BackendThreatIndicator[];
  red_flags: string[];
  safe_signals: string[];
  recommendation: string;
  source_filename?: string | null;
  extracted_text?: string | null;
}

interface BackendOCRResult {
  extracted_text: string;
  confidence: number; // 0-1
  filename: string;
  width: number;
  height: number;
  detected_language?: string | null;
  detected_language_name?: string | null;
}

interface BackendScreenshotAnalysisResponse {
  ocr: BackendOCRResult;
  analysis: BackendAnalysisResult;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body?.detail) return String(body.detail);
  } catch {
    // response wasn't JSON — fall through to the generic message
  }
  return `Request failed with status ${response.status}`;
}

function mapIndicator(i: BackendThreatIndicator): ThreatIndicator {
  return { type: i.type, description: i.description, severity: i.severity, found: i.found };
}

function mapAnalysisResult(backend: BackendAnalysisResult): AnalysisResult {
  return {
    id: backend.id,
    timestamp: backend.timestamp,
    input: backend.input,
    inputType: backend.input_type,
    score: backend.score,
    threatLevel: backend.threat_level,
    label: backend.label,
    summary: backend.summary,
    indicators: backend.indicators.map(mapIndicator),
    redFlags: backend.red_flags,
    safeSignals: backend.safe_signals,
    recommendation: backend.recommendation,
    sourceFilename: backend.source_filename ?? undefined,
    extractedText: backend.extracted_text ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function analyzeText(text: string, signal?: AbortSignal): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE_URL}/api/analyze/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal,
  });
  if (!res.ok) throw new ApiError(await extractErrorMessage(res), res.status);
  return mapAnalysisResult(await res.json());
}

export async function analyzeUrl(url: string, signal?: AbortSignal): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE_URL}/api/analyze/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    signal,
  });
  if (!res.ok) throw new ApiError(await extractErrorMessage(res), res.status);
  return mapAnalysisResult(await res.json());
}

/**
 * Uploads a screenshot to the backend, which runs OCR over it and then feeds
 * the *actual extracted text* (never a placeholder) into the same scam
 * detection engine used for text analysis. The returned AnalysisResult is
 * enriched with OCR-specific fields (full extracted text, confidence,
 * detected language, and a viewable image URL) so the results page can
 * render everything the OCR pipeline produced.
 */
export async function uploadScreenshot(file: File, signal?: AbortSignal): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/upload/screenshot`, {
    method: 'POST',
    body: formData,
    signal,
  });
  if (!res.ok) throw new ApiError(await extractErrorMessage(res), res.status);

  const payload: BackendScreenshotAnalysisResponse = await res.json();
  const result = mapAnalysisResult(payload.analysis);

  // The image is served back statically at /uploads/<stored_filename>. Use
  // the *analysis* record's source_filename (the sanitized, unique name
  // actually written to disk) rather than ocr.filename (the original,
  // possibly-unsafe upload name) to build the URL.
  const imageUrl = payload.analysis.source_filename
    ? `${API_BASE_URL}/uploads/${payload.analysis.source_filename}`
    : undefined;

  return {
    ...result,
    extractedText: payload.ocr.extracted_text,
    ocrConfidence: payload.ocr.confidence,
    detectedLanguage: payload.ocr.detected_language_name || payload.ocr.detected_language || undefined,
    imageUrl,
  };
}

export { API_BASE_URL };
