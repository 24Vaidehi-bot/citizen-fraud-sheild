import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Copy, ArrowLeft, RefreshCw, Info, ExternalLink, Siren, X, Image, Globe, FileText
} from 'lucide-react';
import { useScan } from '../context/ScanContext';
import ThreatBadge from '../components/shared/ThreatBadge';
import GlassCard from '../components/shared/GlassCard';
import type { ThreatIndicator, ThreatLevel } from '../lib/mockAnalysis';
import { useTranslation } from '../hooks/useTranslation';
import type { Locale } from '../locales/en';

// Semantic threat colors — preserved as-is
const scoreColors: Record<ThreatLevel, string> = {
  safe: '#22C55E',
  low: '#F59E0B',
  medium: '#f97316',
  high: '#ef4444',
  critical: '#dc2626',
};

const scoreGradients: Record<ThreatLevel, string> = {
  safe: 'from-emerald-600 to-emerald-400',
  low: 'from-yellow-600 to-yellow-400',
  medium: 'from-orange-600 to-orange-400',
  high: 'from-red-700 to-red-500',
  critical: 'from-red-900 to-red-600',
};

function ScoreRing({ score, level }: { score: number; level: ThreatLevel }) {
  const r = 64;
  const circ = 2 * Math.PI * r;
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        if (current >= score) { setDisplayScore(score); clearInterval(interval); }
        else setDisplayScore(current);
      }, 16);
      return () => clearInterval(interval);
    }, 400);
    return () => clearTimeout(timer);
  }, [score]);

  const strokeDash = circ - (displayScore / 100) * circ;
  const color = scoreColors[level];

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
      <svg width="192" height="192" className="-rotate-90">
        <circle cx="96" cy="96" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        <circle
          cx="96" cy="96" r={r} fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circ}
          strokeDashoffset={strokeDash}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.05s linear', filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-5xl font-extrabold text-white">{displayScore}</span>
        <span className="text-gray-400 text-sm">/ 100</span>
      </div>
    </div>
  );
}

function IndicatorCard({ indicator }: { indicator: ThreatIndicator }) {
  const t = useTranslation();
  const [open, setOpen] = useState(false);
  // Semantic severity colors — preserved
  const severityColors: Record<ThreatLevel, string> = {
    safe: 'border-emerald-500/30 bg-emerald-500/5',
    low: 'border-yellow-500/30 bg-yellow-500/5',
    medium: 'border-orange-500/30 bg-orange-500/5',
    high: 'border-red-500/30 bg-red-500/5',
    critical: 'border-red-500/50 bg-red-900/10',
  };

  return (
    <div className={`rounded-xl border p-4 ${severityColors[indicator.severity]}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <ThreatBadge level={indicator.severity} size="sm" pulse={false} />
          <span className="font-medium text-white text-sm">{indicator.type}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-white/5"
        >
          <p className="text-gray-400 text-sm mb-2">{indicator.description}</p>
          <div className="flex flex-wrap gap-2">
            {indicator.found.map((f, i) => (
              <span key={i} className="px-2 py-1 rounded-md bg-white/5 text-gray-300 text-xs font-mono border border-white/10">
                "{f}"
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

const CYBER_CRIME_PORTAL_URL = 'https://cybercrime.gov.in';

function ReportCyberCrimeModal({ t, onClose, onConfirm }: { t: Locale; onClose: () => void; onConfirm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card rounded-2xl p-6 max-w-md w-full border border-red-500/30 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label={t.results.modal.close}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <Siren className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="font-heading font-bold text-white text-lg">{t.results.modal.title}</h3>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed mb-3">
          {t.results.modal.body1Prefix}{' '}
          <span className="text-white font-medium">{t.results.modal.body1Highlight}</span> {t.results.modal.body1Suffix}
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          {t.results.modal.body2Prefix} <span className="font-mono text-gray-300">cybercrime.gov.in</span> {t.results.modal.body2Suffix}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
          >
            {t.results.modal.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all text-sm font-semibold"
          >
            <ExternalLink className="w-4 h-4" />
            {t.results.modal.continue}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const t = useTranslation();
  const { currentResult } = useScan();
  const [copied, setCopied] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (!currentResult) navigate('/analyze');
  }, [currentResult, navigate]);

  if (!currentResult) return null;

  const {
    score, threatLevel, label, summary, indicators, redFlags, safeSignals, recommendation, input,
    inputType, imageUrl, extractedText, ocrConfidence, detectedLanguage,
  } = currentResult;
  const isScreenshotScan = inputType === 'image' && (imageUrl || extractedText);

  const copyReport = () => {
    const report = `
${t.results.reportTemplate.heading}
${t.results.reportTemplate.score}: ${score}/100 | ${t.results.reportTemplate.level}: ${threatLevel.toUpperCase()}
${label}
---
${summary}
---
${t.results.reportTemplate.redFlags}: ${redFlags.join(', ')}
${t.results.reportTemplate.recommendation}: ${recommendation}
`.trim();
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmReport = () => {
    window.open(CYBER_CRIME_PORTAL_URL, '_blank', 'noopener,noreferrer');
    setShowReportModal(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
            onMouseEnter={e => (e.currentTarget.style.color = '#FFD60A')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}
          >
            <ArrowLeft className="w-4 h-4" />
            {t.results.backLink}
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-heading text-4xl font-extrabold text-white mb-2">{t.results.heading}</h1>
          <p className="text-gray-400 text-sm">{new Date(currentResult.timestamp).toLocaleString()}</p>
        </motion.div>

        {/* Main Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard className="mb-6 relative overflow-hidden">
            {/* Background gradient based on threat */}
            <div className={`absolute inset-0 bg-gradient-to-br ${scoreGradients[threatLevel]} opacity-5 rounded-2xl`} />
            <div className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Score Ring */}
                <div className="text-center">
                  <ScoreRing score={score} level={threatLevel} />
                  <div className="mt-4">
                    <ThreatBadge level={threatLevel} size="lg" />
                  </div>
                  <p className="mt-3 font-heading font-bold text-white text-lg">{label}</p>
                </div>

                {/* Summary */}
                <div>
                  <h2 className="font-heading text-xl font-bold text-white mb-3">{t.results.aiSummary}</h2>
                  <p className="text-gray-300 leading-relaxed mb-5">{summary}</p>

                  {/* Red Flags */}
                  {redFlags.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4" /> {t.results.redFlags} ({redFlags.length})
                      </h3>
                      <ul className="space-y-1.5">
                        {redFlags.slice(0, 4).map((flag, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                            {flag}
                          </li>
                        ))}
                        {redFlags.length > 4 && (
                          <li className="text-xs text-gray-500">+{redFlags.length - 4} {t.results.moreIndicators}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Safe Signals */}
                  {safeSignals.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4" /> {t.results.safeSignals}
                      </h3>
                      <ul className="space-y-1">
                        {safeSignals.map((s, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <GlassCard className={`border-l-4 ${
            threatLevel === 'safe' ? 'border-l-emerald-500' :
            threatLevel === 'low' ? 'border-l-yellow-500' :
            threatLevel === 'medium' ? 'border-l-orange-500' :
            'border-l-red-500'
          }`}>
            <div className="flex items-start gap-3">
              <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                threatLevel === 'safe' ? 'text-emerald-400' :
                threatLevel === 'low' ? 'text-yellow-400' :
                threatLevel === 'medium' ? 'text-orange-400' :
                'text-red-400'
              }`} />
              <div>
                <h3 className="font-semibold text-white mb-1">{t.results.recommendation}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{recommendation}</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Report to Cyber Crime */}
        {score >= 70 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="mb-6 text-center"
          >
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-8 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all shadow-glow-red"
            >
              <span aria-hidden="true">🚨</span>
              {t.results.reportButton}
            </button>
            <p className="mt-3 text-xs text-gray-500">
              {t.results.reportSubtitle}
            </p>
          </motion.div>
        )}

        {/* Screenshot / OCR Analysis */}
        {isScreenshotScan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
            <GlassCard>
              <h3 className="font-heading font-bold text-white text-lg mb-5 flex items-center gap-2">
                <Image className="w-5 h-5" style={{ color: '#FFD60A' }} />
                {t.results.ocrSectionTitle}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Uploaded image */}
                {imageUrl && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t.results.uploadedImage}</p>
                    <img
                      src={imageUrl}
                      alt={t.results.uploadedImage}
                      className="w-full max-h-80 object-contain rounded-lg border border-white/10"
                      style={{ background: 'rgba(5,5,5,0.6)' }}
                    />
                  </div>
                )}

                {/* Extracted text + metadata */}
                <div className="flex flex-col">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {t.results.extractedText}
                  </p>
                  <p className="text-gray-300 text-sm font-mono rounded-lg p-3 leading-relaxed border border-white/5 flex-1 whitespace-pre-wrap" style={{ background: 'rgba(5,5,5,0.6)' }}>
                    {extractedText || '—'}
                  </p>

                  <div className="flex flex-wrap gap-4 mt-4">
                    {typeof ocrConfidence === 'number' && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span className="text-gray-400">{t.results.ocrConfidence}:</span>
                        <span className="text-white font-semibold">{Math.round(ocrConfidence * 100)}%</span>
                      </div>
                    )}
                    {detectedLanguage && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4" style={{ color: '#FFD60A' }} />
                        <span className="text-gray-400">{t.results.detectedLanguage}:</span>
                        <span className="text-white font-semibold">{detectedLanguage}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Analyzed Input Preview (text / URL scans) */}
        {!isScreenshotScan && input && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
            <GlassCard>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: '#FFD60A' }} />
                {t.results.analyzedContent}
              </h3>
              <p className="text-gray-400 text-sm font-mono rounded-lg p-3 leading-relaxed border border-white/5" style={{ background: 'rgba(5,5,5,0.6)' }}>
                {input}
                {input.length >= 200 && '...'}
              </p>
            </GlassCard>
          </motion.div>
        )}

        {/* Threat Indicators */}
        {indicators.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
            <GlassCard>
              <h3 className="font-heading font-bold text-white text-lg mb-5 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                {t.results.threatIndicators} ({indicators.length})
              </h3>
              <div className="space-y-3">
                {indicators.map((ind, i) => (
                  <IndicatorCard key={i} indicator={ind} />
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={copyReport}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl border border-white/10 text-gray-300 hover:text-white transition-all text-sm font-medium"
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(255,214,10,0.3)';
              e.currentTarget.style.background = 'rgba(255,214,10,0.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? t.results.copied : t.results.copyReport}
          </button>
          <Link
            to="/analyze"
            className="flex-1 btn-cyber flex items-center justify-center gap-2 text-sm py-3"
          >
            <RefreshCw className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{t.results.scanAnother}</span>
          </Link>
        </motion.div>
      </div>

      <AnimatePresence>
        {showReportModal && (
          <ReportCyberCrimeModal
            t={t}
            onClose={() => setShowReportModal(false)}
            onConfirm={handleConfirmReport}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
