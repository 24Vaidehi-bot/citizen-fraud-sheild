import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Cpu, Activity } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

interface ScanAnimationProps {
  isScanning: boolean;
}

export default function ScanAnimation({ isScanning }: ScanAnimationProps) {
  const t = useTranslation();
  if (!isScanning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-md" style={{ backgroundColor: 'rgba(5,5,5,0.88)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Outer rings — yellow/green tint */}
        <div className="relative flex items-center justify-center mb-8">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 100 + i * 60,
                height: 100 + i * 60,
                border: `1px solid rgba(255,214,10,${0.15 + i * 0.05})`,
              }}
              animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}

          {/* Core shield — yellow/green gradient */}
          <motion.div
            className="relative w-24 h-24 rounded-2xl bg-primary-gradient flex items-center justify-center shadow-glow-yellow"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield className="w-12 h-12 text-navy-950" />
            {/* Scan line */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <motion.div
                className="absolute left-0 right-0 h-0.5"
                style={{ background: 'linear-gradient(90deg, transparent, #A3E635, #FFD60A, transparent)' }}
                animate={{ top: ['-5%', '105%', '-5%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </div>

        {/* Text */}
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <h3 className="font-heading text-2xl font-bold gradient-text mb-2">{t.scanAnimation.title}</h3>
          <p className="text-gray-400 text-sm">{t.scanAnimation.subtitle}</p>
        </motion.div>

        {/* Loading dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[Cpu, Activity, Shield].map((Icon, i) => (
            <motion.div
              key={i}
              className="w-8 h-8 glass-card rounded-lg flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, delay: i * 0.3, repeat: Infinity }}
            >
              <Icon className="w-4 h-4" style={{ color: i % 2 === 0 ? '#FFD60A' : '#A3E635' }} />
            </motion.div>
          ))}
        </div>

        {/* Progress bar — yellow → green gradient */}
        <div className="mt-8 w-64 mx-auto">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div
              className="h-full rounded-full bg-primary-gradient"
              animate={{ width: ['0%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
