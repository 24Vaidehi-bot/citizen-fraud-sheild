import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Zap, Eye, Lock, ChevronRight, AlertTriangle, CheckCircle,
  MessageSquare, Upload, BarChart3, ArrowRight, Globe, Radar, Gauge
} from 'lucide-react';
import GlassCard from '../components/shared/GlassCard';
import { useTranslation } from '../hooks/useTranslation';

const metricIcons = [Gauge, Shield, Zap];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

const featureIcons = [MessageSquare, Upload, Eye, BarChart3, Lock, Globe];
// Updated to yellow/green cyber theme — no blue/purple/pink
const featureStyles = [
  { color: 'text-yellow-400',   bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { color: 'text-lime-400',     bg: 'bg-lime-500/10 border-lime-500/20' },
  { color: 'text-amber-400',    bg: 'bg-amber-500/10 border-amber-500/20' },
  { color: 'text-emerald-400',  bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { color: 'text-green-400',    bg: 'bg-green-500/10 border-green-500/20' },
  { color: 'text-yellow-300',   bg: 'bg-yellow-400/10 border-yellow-400/20' },
];

export default function LandingPage() {
  const t = useTranslation();
  const aiStatusMetrics = t.landing.aiStatus.metrics.map((m, i) => ({ ...m, icon: metricIcons[i] }));
  const features = t.landing.features.items.map((f, i) => ({ ...f, icon: featureIcons[i], ...featureStyles[i] }));
  const steps = t.landing.howItWorks.steps;

  return (
    <div className="relative pt-20">
      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Grid BG */}
        <div className="absolute inset-0 hero-grid opacity-50" />
        {/* Hero Glow — #39FF14 at 20% opacity (neon green) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(57,255,20,0.20) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(255,214,10,0.08) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div variants={stagger} initial="initial" animate="animate">
            {/* Badge */}
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
              style={{
                border: '1px solid rgba(255,214,10,0.35)',
                background: 'rgba(255,214,10,0.08)',
                color: '#FFD60A',
              }}
            >
              <Zap className="w-4 h-4" />
              {t.landing.badge}
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="font-heading text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight"
            >
              {t.landing.headlinePrefix}{' '}
              <span className="gradient-text">{t.landing.headlineHighlight}</span>
              <br />
              {t.landing.headlineSuffix}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              {t.landing.subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/analyze"
                id="hero-cta-analyze"
                className="btn-cyber flex items-center justify-center gap-2 text-lg py-4 px-8 rounded-xl"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Shield className="w-5 h-5" /> {t.landing.ctaAnalyze}
                </span>
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 text-gray-300 hover:text-white rounded-xl py-4 px-8 transition-all duration-300 hover:bg-white/5"
                style={{ border: '1px solid rgba(255,214,10,0.15)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,214,10,0.35)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,214,10,0.15)')}
              >
                {t.landing.ctaDashboard} <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-gray-500">
              {t.landing.trustIndicators.map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Floating AI Orb */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-16 mx-auto w-fit relative"
          >
            <div className="relative w-48 h-48 mx-auto">
              {/* Outer glowing ring */}
              <div className="absolute inset-0 rounded-full bg-primary-gradient opacity-25 blur-2xl animate-pulse-slow" />
              <div
                className="absolute inset-4 rounded-full animate-spin-slow"
                style={{ border: '1px solid rgba(255,214,10,0.35)' }}
              />
              <div
                className="absolute inset-8 rounded-full"
                style={{ border: '1px solid rgba(163,230,53,0.2)' }}
              />
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-24 h-24 rounded-2xl bg-primary-gradient shadow-glow-yellow flex items-center justify-center">
                  <Radar className="w-14 h-14 text-navy-950" />
                </div>
              </div>
              {/* Satellite dots */}
              {[0, 90, 180, 270].map((deg, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${deg}deg) translateY(-70px) translateX(-50%)`,
                    background: ['#FFD60A', '#A3E635', '#39FF14', '#FFD60A'][i],
                  }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                />
              ))}
            </div>
          </motion.div>

          {/* AI Status Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 max-w-3xl mx-auto"
          >
            <GlassCard className="corner-frame">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="ai-status-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 text-emerald-400" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                  </span>
                  <div className="text-left">
                    <p className="font-heading font-bold text-white text-sm tracking-wide">{t.landing.aiStatus.title}</p>
                    <p className="text-emerald-400 text-xs font-mono">{t.landing.aiStatus.status}</p>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-10 bg-white/10" />
                <div className="flex items-center gap-6 sm:gap-8">
                  {aiStatusMetrics.map((m, i) => (
                    <div key={i} className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-gray-500 mb-1">
                        <m.icon className="w-3.5 h-3.5" />
                        <span className="text-[11px] uppercase tracking-wider">{m.label}</span>
                      </div>
                      <p className="font-heading font-extrabold text-white text-lg sm:text-xl">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24" style={{ background: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              {t.landing.howItWorks.titlePrefix} <span className="gradient-text">{t.landing.howItWorks.titleHighlight}</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">{t.landing.howItWorks.subtitle}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div
              className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px"
              style={{ background: 'linear-gradient(to right, transparent, rgba(255,214,10,0.3), transparent)' }}
            />
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <GlassCard hover glow="blue" className="text-center relative">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-glow-yellow">
                    <span className="font-heading font-bold text-navy-950 text-xl">{step.num}</span>
                  </div>
                  <h3 className="font-heading font-bold text-white text-xl mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm">{step.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-24" style={{ background: 'rgba(16,16,16,0.6)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              {t.landing.features.titlePrefix} <span className="gradient-text">{t.landing.features.titleHighlight}</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">{t.landing.features.subtitle}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard hover glow="blue" className="h-full">
                  <div className={`w-12 h-12 rounded-xl border ${feat.bg} flex items-center justify-center mb-4`}>
                    <feat.icon className={`w-6 h-6 ${feat.color}`} />
                  </div>
                  <h3 className="font-heading font-bold text-white text-lg mb-2">{feat.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <GlassCard className="relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-8 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,214,10,0.08), rgba(163,230,53,0.06))' }}
              />
              {/* Neon glow accent */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1"
                style={{ background: 'linear-gradient(90deg, transparent, #FFD60A, transparent)' }}
              />
              <div className="relative z-10">
                <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
                  {t.landing.ctaBanner.title}
                </h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  {t.landing.ctaBanner.desc}
                </p>
                <Link to="/analyze" className="btn-cyber inline-flex items-center gap-2 text-lg py-4 px-8">
                  <span className="relative z-10 flex items-center gap-2">
                    {t.landing.ctaBanner.button} <ArrowRight className="w-5 h-5" />
                  </span>
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
