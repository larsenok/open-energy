'use client';

import { useMemo } from 'react';
import type { EnergySnapshot } from '@/types/energy';
import styles from './tooltip.module.css';

type SparklineProps = {
  history: EnergySnapshot['history'];
};

export default function Sparkline({ history }: SparklineProps) {
  const path = useMemo(() => {
    if (!history.length) return '';
    const values = history.map((entry) => entry.netBalanceMw);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const range = max - min || 1;

    return history
      .map((entry, index) => {
        const denominator = Math.max(history.length - 1, 1);
        const x = (index / denominator) * 100;
        const y = 50 - ((entry.netBalanceMw - min) / range) * 50;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [history]);

  return (
    <svg viewBox="0 0 100 50" className={styles.sparkline} role="img">
      <title>24 hour balance history</title>
      <defs>
        <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(120, 220, 200, 0.4)" />
          <stop offset="50%" stopColor="rgba(255, 209, 102, 0.5)" />
          <stop offset="100%" stopColor="rgba(255, 120, 120, 0.4)" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="url(#sparklineGradient)" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}
