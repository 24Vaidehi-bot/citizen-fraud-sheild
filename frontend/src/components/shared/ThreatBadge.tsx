import React from 'react';
import { cn } from '../../lib/utils';
import type { ThreatLevel } from '../../lib/mockAnalysis';
import { useTranslation } from '../../hooks/useTranslation';

const styleConfigs: Record<ThreatLevel, { bg: string; text: string; border: string; dot: string }> = {
  safe: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  low: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  medium: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    dot: 'bg-orange-400',
  },
  high: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
  },
  critical: {
    bg: 'bg-red-900/20',
    text: 'text-red-300',
    border: 'border-red-500/50',
    dot: 'bg-red-400',
  },
};

interface ThreatBadgeProps {
  level: ThreatLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
}

export default function ThreatBadge({ level, size = 'md', className, pulse = true }: ThreatBadgeProps) {
  const t = useTranslation();
  const cfg = styleConfigs[level];
  const label = t.threatBadge[level];
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-full border font-mono tracking-wider',
        cfg.bg, cfg.text, cfg.border,
        sizeClasses[size],
        className
      )}
    >
      <span className="relative flex items-center">
        <span className={cn('rounded-full', cfg.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
        {pulse && (
          <span className={cn('absolute rounded-full animate-ping', cfg.dot, 'opacity-60', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')} />
        )}
      </span>
      {label}
    </span>
  );
}
