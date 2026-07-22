import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, TrendingUp, AlertTriangle, CheckCircle, Zap,
  BarChart3, Clock, Activity
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { useScan } from '../context/ScanContext';
import { getMockRecentScans } from '../lib/mockAnalysis';
import ThreatBadge from '../components/shared/ThreatBadge';
import GlassCard from '../components/shared/GlassCard';
import type { ThreatLevel } from '../lib/mockAnalysis';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';

// Threat level semantic colors — unchanged
const COLORS: Record<ThreatLevel, string> = {
  safe: '#22C55E',
  low: '#F59E0B',
  medium: '#f97316',
  high: '#ef4444',
  critical: '#dc2626',
};

// Chart accent colors — yellow/green theme
const CHART_COLORS = ['#FFD60A', '#A3E635', '#39FF14', '#FACC15', '#ef4444'];

// Mock area chart data (day labels are short codes, not translated)
const areaData = [
  { day: 'Mon', scans: 42, flagged: 18 },
  { day: 'Tue', scans: 68, flagged: 35 },
  { day: 'Wed', scans: 55, flagged: 22 },
  { day: 'Thu', scans: 90, flagged: 41 },
  { day: 'Fri', scans: 73, flagged: 30 },
  { day: 'Sat', scans: 47, flagged: 20 },
  { day: 'Sun', scans: 83, flagged: 37 },
];

const scamTypeColors = ['#ef4444', '#f97316', '#FACC15', '#A3E635', '#FFD60A'];

function AnimatedValue({ value }: { value: string | number }) {
  const [display, setDisplay] = React.useState<string | number>(typeof value === 'number' ? 0 : value);
  const numeric = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  const suffix = typeof value === 'string' ? value.replace(/^[0-9.]+/, '') : '';

  React.useEffect(() => {
    if (typeof value !== 'number' && Number.isNaN(numeric)) { setDisplay(value); return; }
    let frame: number;
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = numeric * eased;
      setDisplay(typeof value === 'number' ? Math.round(current) : `${current.toFixed(numeric < 100 ? 1 : 0)}${suffix}`);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{display}</>;
}

function StatCard({ icon: Icon, label, value, sub, color, delay }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay || 0 }}
    >
      <GlassCard hover className="flex items-start gap-4">
        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          <div className="absolute inset-0 rounded-xl opacity-50 blur-md bg-current" style={{ color: 'transparent' }} />
          <Icon className="w-6 h-6 text-white relative z-10" />
        </div>
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="font-heading text-3xl font-extrabold text-white tabular-nums">
            <AnimatedValue value={value} />
          </p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function DashboardPage() {
  const t = useTranslation();
  const { language } = useLanguage();
  const { scanHistory } = useScan();
  const allScans = useMemo(
    () => [...scanHistory, ...getMockRecentScans(language)],
    [scanHistory, language]
  );

  const topScamTypes = t.dashboard.scamTypes.types.map((s, i) => ({ ...s, color: scamTypeColors[i] }));

  const stats = useMemo(() => {
    const total = allScans.length;
    const flagged = allScans.filter(s => ['high', 'critical', 'medium'].includes(s.threatLevel)).length;
    const safe = allScans.filter(s => s.threatLevel === 'safe').length;
    return { total, flagged, safe, accuracy: '98.7%' };
  }, [allScans]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card rounded-xl p-3 text-sm">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-gray-400">{payload[0].value} {t.dashboard.weeklyActivity.scansLabel}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-heading text-4xl font-extrabold text-white mb-2">
                {t.dashboard.titlePrefix} <span className="gradient-text">{t.dashboard.titleHighlight}</span>
              </h1>
              <p className="text-gray-400">{t.dashboard.subtitle}</p>
            </div>
            <Link to="/analyze" className="btn-cyber flex items-center gap-2 py-3 px-5 text-sm">
              <Zap className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{t.dashboard.newScan}</span>
            </Link>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Scans — yellow/green gradient */}
          <StatCard
            icon={Activity}
            label={t.dashboard.stats.totalScans.label}
            value={stats.total}
            sub={t.dashboard.stats.totalScans.sub}
            color="bg-primary-gradient"
            delay={0}
          />
          <StatCard icon={AlertTriangle} label={t.dashboard.stats.flagged.label} value={stats.flagged} sub={t.dashboard.stats.flagged.sub} color="bg-gradient-to-br from-red-600 to-red-700" delay={0.1} />
          <StatCard icon={CheckCircle} label={t.dashboard.stats.clean.label} value={stats.safe} sub={t.dashboard.stats.clean.sub} color="bg-gradient-to-br from-emerald-600 to-emerald-700" delay={0.2} />
          {/* Accuracy — lime/green gradient */}
          <StatCard
            icon={TrendingUp}
            label={t.dashboard.stats.accuracy.label}
            value={stats.accuracy}
            sub={t.dashboard.stats.accuracy.sub}
            color="bg-gradient-to-br from-lime-600 to-green-700"
            delay={0.3}
          />
        </div>

        {/* AI Recommendation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
          <div style={{ borderLeft: '4px solid rgba(255,214,10,0.6)', borderRadius: '22px' }}>
            <GlassCard className="corner-frame">
              <div className="flex items-start gap-4">
                <div className="relative w-11 h-11 rounded-xl bg-primary-gradient flex items-center justify-center flex-shrink-0 shadow-glow-yellow">
                  <Zap className="w-5 h-5 text-navy-950" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-widest font-mono mb-1" style={{ color: '#FFD60A' }}>{t.dashboard.aiRecommendation.heading}</p>
                  <p className="text-white text-sm sm:text-base leading-relaxed">
                    {t.dashboard.aiRecommendation.message}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-400">
                    <span>{t.dashboard.aiRecommendation.suggestedActionLabel} <span className="text-white font-medium">{t.dashboard.aiRecommendation.suggestedAction}</span></span>
                    <span className="text-emerald-400">{t.dashboard.aiRecommendation.confidence}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Area Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <GlassCard className="h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-bold text-white text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: '#FFD60A' }} />
                  {t.dashboard.weeklyActivity.title}
                </h2>
                <span className="text-xs text-gray-500 px-2 py-1 bg-white/5 rounded-md">{t.dashboard.weeklyActivity.last7Days}</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaData}>
                  <defs>
                    {/* Scans line — yellow */}
                    <linearGradient id="scansGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFD60A" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#FFD60A" stopOpacity={0} />
                    </linearGradient>
                    {/* Flagged line — red (semantic) */}
                    <linearGradient id="flaggedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="scans" name={t.dashboard.weeklyActivity.legendTotal} stroke="#FFD60A" fill="url(#scansGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="flagged" name={t.dashboard.weeklyActivity.legendFlagged} stroke="#ef4444" fill="url(#flaggedGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-3 h-0.5 inline-block" style={{ background: '#FFD60A' }} />
                  {t.dashboard.weeklyActivity.legendTotal}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-3 h-0.5 bg-red-500 inline-block" />
                  {t.dashboard.weeklyActivity.legendFlagged}
                </span>
              </div>
            </GlassCard>
          </motion.div>

          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="h-full">
              <h2 className="font-heading font-bold text-white text-lg mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: '#A3E635' }} />
                {t.dashboard.scamTypes.title}
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={topScamTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {topScamTypes.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="glass-card rounded-xl p-3 text-sm">
                          <p className="text-white font-semibold">{payload[0].name}</p>
                          <p className="text-gray-400">{payload[0].value}%</p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {topScamTypes.map((tItem, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-400">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tItem.color }} />
                      {tItem.name}
                    </span>
                    <span className="text-gray-300 font-medium">{tItem.value}%</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Recent Scans */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-white text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: '#A3E635' }} />
                {t.dashboard.recentScans.title}
              </h2>
              <span className="text-xs text-gray-500">{allScans.length} {t.dashboard.recentScans.total}</span>
            </div>
            <div className="space-y-3">
              {allScans.slice(0, 8).map((scan, i) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl transition-colors border border-transparent"
                  style={{}}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  {/* Score circle */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm"
                    style={{ background: `${COLORS[scan.threatLevel]}20`, color: COLORS[scan.threatLevel], border: `1px solid ${COLORS[scan.threatLevel]}30` }}
                  >
                    {scan.score}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm truncate">{scan.input || t.dashboard.recentScans.screenshotFallback}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{new Date(scan.timestamp).toLocaleString()}</p>
                  </div>
                  <ThreatBadge level={scan.threatLevel} size="sm" pulse={false} />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
