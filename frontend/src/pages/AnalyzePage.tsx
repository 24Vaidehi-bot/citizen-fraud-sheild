import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Upload, MessageSquare, Link2, X, AlertCircle,
  ChevronRight, FileText, Image, Zap
} from 'lucide-react';
import { analyzeText, analyzeUrl, uploadScreenshot, ApiError } from '../lib/api';
import { useScan } from '../context/ScanContext';
import ScanAnimation from '../components/shared/ScanAnimation';
import GlassCard from '../components/shared/GlassCard';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';

type InputMode = 'text' | 'image' | 'url';

const modeIcons: Record<InputMode, React.ElementType> = {
  text: MessageSquare,
  image: Image,
  url: Link2,
};

const infoCardIcons = [Shield, Zap, AlertCircle];
// Updated to yellow / green / amber — no blue/purple/cyan
const infoCardColors = ['text-yellow-400', 'text-lime-400', 'text-amber-400'];

export default function AnalyzePage() {
  const navigate = useNavigate();
  const t = useTranslation();
  const { language } = useLanguage();
  const { setCurrentResult, addToHistory, setIsScanning, isScanning } = useScan();
  const [mode, setMode] = useState<InputMode>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const inputModes: { id: InputMode; icon: React.ElementType; label: string; desc: string }[] = [
    { id: 'text', icon: modeIcons.text, label: t.analyze.modes.text.label, desc: t.analyze.modes.text.desc },
    { id: 'image', icon: modeIcons.image, label: t.analyze.modes.image.label, desc: t.analyze.modes.image.desc },
    { id: 'url', icon: modeIcons.url, label: t.analyze.modes.url.label, desc: t.analyze.modes.url.desc },
  ];

  const infoCards = t.analyze.infoCards.map((c, i) => ({ ...c, icon: infoCardIcons[i], color: infoCardColors[i] }));

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t.analyze.errors.invalidImage);
      return;
    }
    setUploadedFile(file);
    setError('');
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleScan = async () => {
    setError('');

    if (mode === 'image') {
      if (!uploadedFile) { setError(t.analyze.errors.noImage); return; }
      setIsScanning(true);
      try {
        const result = await uploadScreenshot(uploadedFile);
        setCurrentResult(result);
        addToHistory(result);
        navigate('/results');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : (err as Error).message || t.analyze.errors.ocrFailed);
      } finally {
        setIsScanning(false);
      }
      return;
    }

    if (mode === 'text') {
      if (!text.trim()) { setError(t.analyze.errors.emptyText); return; }
      setIsScanning(true);
      try {
        const result = await analyzeText(text.trim());
        setCurrentResult(result);
        addToHistory(result);
        navigate('/results');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : (err as Error).message || "Analysis failed");
      } finally {
        setIsScanning(false);
      }
      return;
    }

    if (mode === 'url') {
      if (!url.trim()) { setError(t.analyze.errors.emptyUrl); return; }
      setIsScanning(true);
      try {
        const result = await analyzeUrl(url.trim());
        setCurrentResult(result);
        addToHistory(result);
        navigate('/results');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : (err as Error).message || "URL analysis failed");
      } finally {
        setIsScanning(false);
      }
      return;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <ScanAnimation isScanning={isScanning} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{
              border: '1px solid rgba(255,214,10,0.35)',
              background: 'rgba(255,214,10,0.08)',
              color: '#FFD60A',
            }}
          >
            <Zap className="w-4 h-4" />
            {t.analyze.badge}
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-white mb-4">
            {t.analyze.titlePrefix} <span className="gradient-text">{t.analyze.titleHighlight}</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            {t.analyze.subtitle}
          </p>
        </motion.div>

        {/* Mode Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {inputModes.map(m => (
            <button
              key={m.id}
              id={`mode-${m.id}`}
              onClick={() => { setMode(m.id); setError(''); }}
              className={`relative p-4 rounded-xl border transition-all duration-300 text-left ${
                mode === m.id
                  ? 'shadow-glow-yellow'
                  : 'glass-card border-transparent hover:bg-white/3'
              }`}
              style={mode === m.id ? {
                background: 'rgba(255,214,10,0.1)',
                borderColor: 'rgba(255,214,10,0.5)',
              } : {
                borderColor: 'transparent',
              }}
              onMouseEnter={e => {
                if (mode !== m.id) e.currentTarget.style.borderColor = 'rgba(255,214,10,0.2)';
              }}
              onMouseLeave={e => {
                if (mode !== m.id) e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <m.icon
                className={`w-5 h-5 mb-2`}
                style={{ color: mode === m.id ? '#FFD60A' : '#9ca3af' }}
              />
              <div
                className={`font-semibold text-sm`}
                style={{ color: mode === m.id ? '#ffffff' : '#d1d5db' }}
              >
                {m.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 hidden sm:block">{m.desc}</div>
              {mode === m.id && (
                <motion.div
                  layoutId="mode-indicator"
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ border: '1px solid rgba(255,214,10,0.5)' }}
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <GlassCard className="mb-6">
            <AnimatePresence mode="wait">
              {/* TEXT MODE */}
              {mode === 'text' && (
                <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                      <FileText className="w-4 h-4" style={{ color: '#FFD60A' }} />
                      {t.analyze.textMode.label}
                    </label>
                    <span className="text-xs text-gray-500">{text.length} {t.analyze.textMode.chars}</span>
                  </div>
                  <textarea
                    id="analyze-textarea"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={t.analyze.textMode.placeholder}
                    className="w-full h-48 rounded-xl p-4 text-gray-200 placeholder-gray-600 focus:outline-none resize-none transition-all text-sm leading-relaxed"
                    style={{
                      background: 'rgba(5,5,5,0.6)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(255,214,10,0.4)';
                      e.target.style.boxShadow = '0 0 0 1px rgba(255,214,10,0.15)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {/* Example messages */}
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">{t.analyze.textMode.tryExample}</p>
                    <div className="flex flex-wrap gap-2">
                      {t.analyze.exampleMessages.map((msg, i) => (
                        <button
                          key={i}
                          onClick={() => setText(msg)}
                          className="text-xs px-3 py-1.5 rounded-full transition-all"
                          style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#FFD60A';
                            e.currentTarget.style.borderColor = 'rgba(255,214,10,0.35)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = '#9ca3af';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                          }}
                        >
                          {t.analyze.textMode.example} {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* IMAGE MODE */}
              {mode === 'image' && (
                <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    className="relative h-52 flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300"
                    style={{
                      borderColor: dragOver
                        ? '#FFD60A'
                        : uploadedFile
                        ? 'rgba(34,197,94,0.5)'
                        : 'rgba(255,255,255,0.1)',
                      background: dragOver
                        ? 'rgba(255,214,10,0.07)'
                        : uploadedFile
                        ? 'rgba(34,197,94,0.05)'
                        : 'transparent',
                    }}
                    onMouseEnter={e => {
                      if (!dragOver && !uploadedFile)
                        e.currentTarget.style.borderColor = 'rgba(255,214,10,0.4)';
                    }}
                    onMouseLeave={e => {
                      if (!dragOver && !uploadedFile)
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                  >
                    {uploadedFile ? (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                          <Image className="w-6 h-6 text-emerald-400" />
                        </div>
                        <p className="text-emerald-400 font-medium text-sm">{uploadedFile.name}</p>
                        <p className="text-gray-500 text-xs mt-1">{(uploadedFile.size / 1024).toFixed(1)} {t.analyze.imageMode.kb}</p>
                        <button
                          onClick={e => { e.stopPropagation(); setUploadedFile(null); }}
                          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 text-gray-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-500 mb-3" />
                        <p className="text-gray-300 font-medium text-sm">{t.analyze.imageMode.dropHere}</p>
                        <p className="text-gray-500 text-xs mt-1">{t.analyze.imageMode.browseHint}</p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* URL MODE */}
              {mode === 'url' && (
                <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4" style={{ color: '#FFD60A' }} />
                    {t.analyze.urlMode.label}
                  </label>
                  <input
                    id="url-input"
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder={t.analyze.urlMode.placeholder}
                    className="w-full rounded-xl px-4 py-4 text-gray-200 placeholder-gray-600 focus:outline-none transition-all text-sm font-mono"
                    style={{
                      background: 'rgba(5,5,5,0.6)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(255,214,10,0.4)';
                      e.target.style.boxShadow = '0 0 0 1px rgba(255,214,10,0.12)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div className="mt-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <p className="text-yellow-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      {t.analyze.urlMode.warning}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Scan Button */}
            <button
              id="scan-btn"
              onClick={handleScan}
              disabled={isScanning}
              className="btn-cyber w-full mt-6 py-4 text-base flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="w-5 h-5 relative z-10" />
              <span className="relative z-10">
                {isScanning ? t.analyze.scanButton.scanning : t.analyze.scanButton.idle}
              </span>
              <ChevronRight className="w-5 h-5 relative z-10" />
            </button>
          </GlassCard>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {infoCards.map((item, i) => (
            <GlassCard key={i} className="p-4 flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
              <div>
                <div className="text-white font-medium text-sm">{item.title}</div>
                <div className="text-gray-500 text-xs">{item.desc}</div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
