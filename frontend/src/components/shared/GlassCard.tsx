import React from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'blue' | 'purple' | 'cyan' | 'red' | 'none';
  onClick?: () => void;
}

// Mapped to new yellow/green theme — "blue" and "cyan" → yellow glow, "purple" → green glow
const glowClasses = {
  blue: 'hover:shadow-glow-yellow',
  purple: 'hover:shadow-glow-green',
  cyan: 'hover:shadow-glow-yellow',
  red: 'hover:shadow-glow-red',
  none: '',
};

const glowBorderStyles = {
  blue: 'rgba(255,214,10,0.35)',
  purple: 'rgba(163,230,53,0.35)',
  cyan: 'rgba(255,214,10,0.35)',
  red: 'rgba(239,68,68,0.35)',
  none: '',
};

export default function GlassCard({ children, className, hover = false, glow = 'blue', onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass-card rounded-[22px] p-6',
        hover && `transition-all duration-300 ${glow !== 'none' ? glowClasses[glow] : ''} hover:-translate-y-1`,
        onClick && 'cursor-pointer',
        className
      )}
      style={hover && glow !== 'none' ? {
        '--hover-border': glowBorderStyles[glow],
      } as React.CSSProperties : {}}
    >
      {children}
    </div>
  );
}
