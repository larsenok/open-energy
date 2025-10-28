'use client';

import { useMemo } from 'react';
import type { GenerationBreakdown } from '@/types/energy';
import styles from './tooltip.module.css';

type RadialMixChartProps = {
  mix: GenerationBreakdown;
};

const MIX_COLORS: Record<keyof GenerationBreakdown, string> = {
  solar: 'rgba(255, 209, 102, 0.9)',
  wind: 'rgba(115, 203, 255, 0.85)',
  hydro: 'rgba(120, 220, 200, 0.9)',
  fossil: 'rgba(255, 120, 120, 0.85)',
  other: 'rgba(200, 200, 200, 0.5)'
};

const LABELS: Record<keyof GenerationBreakdown, string> = {
  solar: 'Solar',
  wind: 'Wind',
  hydro: 'Hydro',
  fossil: 'Fossil',
  other: 'Other'
};

export default function RadialMixChart({ mix }: RadialMixChartProps) {
  const segments = useMemo(() => {
    const values = Object.entries(mix).filter(([, value]) => typeof value === 'number' && value > 0) as Array<[
      keyof GenerationBreakdown,
      number
    ]>;
    const total = values.reduce((acc, [, value]) => acc + value, 0);
    if (!total) {
      return [
        {
          key: 'other' as keyof GenerationBreakdown,
          path: 'M 40 40 m 0 -36 a 36 36 0 1 1 -0.01 0',
          displayValue: 100
        }
      ];
    }
    let startAngle = -Math.PI / 2;

    return values.map(([key, value]) => {
      const angle = (value / total) * Math.PI * 2;
      const endAngle = startAngle + angle;
      const largeArc = angle > Math.PI ? 1 : 0;
      const radius = 36;
      const startX = 40 + radius * Math.cos(startAngle);
      const startY = 40 + radius * Math.sin(startAngle);
      const endX = 40 + radius * Math.cos(endAngle);
      const endY = 40 + radius * Math.sin(endAngle);
      const path = `M 40 40 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
      const displayValue = Math.round((value / total) * 100);
      startAngle = endAngle;

      return {
        key,
        path,
        displayValue
      };
    });
  }, [mix]);

  return (
    <div className={styles.radialWrap}>
      <svg className={styles.radial} viewBox="0 0 80 80" role="img">
        <title>Generation mix</title>
        {segments.map((segment) => (
          <path
            key={segment.key}
            d={segment.path}
            fill={MIX_COLORS[segment.key]}
            opacity={0.85}
            stroke="rgba(0,0,0,0.18)"
            strokeWidth={0.4}
          />
        ))}
        <circle cx="40" cy="40" r="18" fill="rgba(4, 6, 10, 0.92)" />
        <text x="40" y="40" textAnchor="middle" dominantBaseline="middle" className={styles.radialLabel}>
          Mix
        </text>
      </svg>
      <ul className={styles.legend}>
        {segments.map((segment) => (
          <li key={segment.key}>
            <span className={styles.swatch} style={{ background: MIX_COLORS[segment.key] }} />
            {LABELS[segment.key]} — {segment.displayValue}%
          </li>
        ))}
      </ul>
    </div>
  );
}
