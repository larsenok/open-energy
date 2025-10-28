'use client';

import { useMemo } from 'react';
import type { EnergySnapshot } from '@/types/energy';
import RadialMixChart from './RadialMixChart';
import Sparkline from './Sparkline';
import styles from './tooltip.module.css';

type EnergyTooltipProps = {
  feature: EnergySnapshot & {
    balance: number;
  };
  frozen: boolean;
  onClose: () => void;
};

export default function EnergyTooltip({ feature, frozen, onClose }: EnergyTooltipProps) {
  const balance = feature.balance ?? feature.generationMw - feature.consumptionMw;
  const balanceLabel = balance >= 0 ? 'Surplus' : 'Deficit';
  const balanceColor = balance >= 0 ? 'rgba(120, 220, 200, 0.9)' : 'rgba(255, 145, 110, 0.9)';

  const renewablePct = Math.round(feature.renewableShare * 100);
  const formattedHistory = useMemo(() => feature.history.slice(-24), [feature.history]);

  return (
    <aside className={`${styles.tooltip} ${frozen ? styles.frozen : ''}`}>
      <header>
        <div>
          <h2>{feature.regionName}</h2>
          <p>Last signal {new Date(feature.timestamp).toLocaleTimeString()}</p>
        </div>
        {frozen ? (
          <button type="button" onClick={onClose} aria-label="Close" className={styles.close}>
            ×
          </button>
        ) : null}
      </header>
      <section className={styles.metrics}>
        <div>
          <span>Generation</span>
          <strong>{Math.round(feature.generationMw).toLocaleString()} MW</strong>
        </div>
        <div>
          <span>Consumption</span>
          <strong>{Math.round(feature.consumptionMw).toLocaleString()} MW</strong>
        </div>
        <div>
          <span>{balanceLabel}</span>
          <strong style={{ color: balanceColor }}>{Math.abs(Math.round(balance)).toLocaleString()} MW</strong>
        </div>
        <div>
          <span>Renewables</span>
          <strong>{renewablePct}%</strong>
        </div>
        <div>
          <span>CO₂ Intensity</span>
          <strong>{Math.round(feature.carbonIntensity)} g/kWh</strong>
        </div>
      </section>
      <RadialMixChart mix={feature.mix} />
      <footer>
        <Sparkline history={formattedHistory} />
        <p className={styles.sparklineLabel}>24h net balance trend</p>
      </footer>
    </aside>
  );
}
