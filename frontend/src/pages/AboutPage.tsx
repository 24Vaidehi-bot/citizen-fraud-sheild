import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Brain, Lock, Zap, Users, Globe, ChevronDown, ChevronUp,
  Code2, Database, Cpu, Eye, Heart, Award, ArrowRight
} from 'lucide-react';
import GlassCard from '../components/shared/GlassCard';
import { useTranslation } from '../hooks/useTranslation';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const howAiWorksIcons = [Eye, Brain, Database, Cpu, Shield];
const valuesIcons = [Shield, Lock, Users, Heart];
const techStackIcons = [Brain, Code2, Database, Lock, Zap, Globe];

// Updated: yellow/green/amber palette — no blue/purple/pink
const techStackColors = [
  'text-yellow-400 bg-yellow-500/10',
  'text-lime-400 bg-lime-500/10',
  'text-amber-400 bg-amber-500/10',
  'text-emerald-400 bg-emerald-500/10',
  'text-green-400 bg-green-500/10',
  'text-yellow-300 bg-yellow-400/10',
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
    >
      <div className="glass-card rounded-xl overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/3"
        >
          <span className="font-medium text-white pr-4">{q}</span>
          {open
            ? <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: '#FFD60A' }} />
            : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
        </button>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="px-5 pb-5"
          >
            <div className="pt-3 border-t border-white/5">
              <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function AboutPage() {
  const t = useTranslation();

  const howAiWorksSteps = t.about.howAiWorks.steps.map((s, i) => ({ ...s, step: i + 1, icon: howAiWorksIcons[i] }));
  const values = t.about.values.items.map((v, i) => ({ ...v, icon: valuesIcons[i] }));
  const techStack = t.about.techStack.items.map((item, i) => ({ ...item, icon: techStackIcons[i], color: techStackColors[i] }));

  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 hero-grid opacity-30" />
        {/* Hero neon glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(57,255,20,0.12) 0%, transparent 70%)' }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div variants={fadeUp} initial="initial" animate="animate">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
              style={{
                border: '1px solid rgba(255,214,10,0.35)',
                background: 'rgba(255,214,10,0.08)',
                color: '#FFD60A',
              }}
            >
              <Award className="w-4 h-4" />
              {t.about.badge}
            </div>
            <h1 className="font-heading text-5xl font-extrabold text-white mb-6">
              {t.about.heroTitlePrefix} <span className="gradient-text">{t.about.heroTitleHighlight}</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
              {t.about.heroSubtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* How AI Works */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              {t.about.howAiWorks.titlePrefix} <span className="gradient-text">{t.about.howAiWorks.titleHighlight}</span> {t.about.howAiWorks.titleSuffix}
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              {t.about.howAiWorks.subtitle}
            </p>
          </motion.div>

          <div className="space-y-4">
            {howAiWorksSteps.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard hover className="flex items-start gap-5">
                  {/* Step icon — yellow/green gradient */}
                  <div className="w-12 h-12 rounded-xl bg-primary-gradient flex items-center justify-center flex-shrink-0 shadow-glow-yellow">
                    <item.icon className="w-6 h-6 text-navy-950" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono font-semibold" style={{ color: '#FFD60A' }}>
                        {t.about.howAiWorks.stepLabel} {item.step}
                      </span>
                      <h3 className="font-heading font-bold text-white">{item.title}</h3>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24" style={{ background: 'rgba(16,16,16,0.5)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              {t.about.values.titlePrefix} <span className="gradient-text">{t.about.values.titleHighlight}</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard hover className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-gradient flex items-center justify-center flex-shrink-0">
                    <v.icon className="w-6 h-6 text-navy-950" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white mb-1">{v.title}</h3>
                    <p className="text-gray-400 text-sm">{v.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              {t.about.techStack.titlePrefix} <span className="gradient-text">{t.about.techStack.titleHighlight}</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {techStack.map((tItem, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard hover className="text-center">
                  <div className={`w-12 h-12 rounded-xl ${tItem.color} flex items-center justify-center mx-auto mb-3`}>
                    <tItem.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1">{tItem.name}</h3>
                  <p className="text-gray-500 text-xs">{tItem.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24" style={{ background: 'rgba(16,16,16,0.5)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-heading text-4xl font-bold text-white mb-4">
              {t.about.faq.titlePrefix} <span className="gradient-text">{t.about.faq.titleHighlight}</span>
            </h2>
          </motion.div>
          <div className="space-y-3">
            {t.about.faq.items.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <GlassCard className="relative overflow-hidden">
              {/* Subtle yellow/green gradient overlay */}
              <div
                className="absolute inset-0 opacity-8 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,214,10,0.07), rgba(163,230,53,0.05))' }}
              />
              {/* Top accent line */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, #A3E635, transparent)' }}
              />
              <div className="relative z-10">
                <Shield className="w-14 h-14 mx-auto mb-4" style={{ color: '#FFD60A' }} />
                <h2 className="font-heading text-3xl font-bold text-white mb-4">{t.about.cta.title}</h2>
                <p className="text-gray-400 mb-8">{t.about.cta.desc}</p>
                <Link to="/analyze" className="btn-cyber inline-flex items-center gap-2 py-4 px-8 text-base">
                  <span className="relative z-10 flex items-center gap-2">
                    {t.about.cta.button} <ArrowRight className="w-5 h-5" />
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
