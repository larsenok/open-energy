export type GenerationBreakdown = {
  solar: number;
  wind: number;
  hydro: number;
  fossil: number;
  other?: number;
};

export type EnergySnapshot = {
  regionId: string;
  regionName: string;
  timestamp: string;
  consumptionMw: number;
  generationMw: number;
  renewableShare: number; // 0-1 scale
  carbonIntensity: number; // gCO2eq/kWh
  mix: GenerationBreakdown;
  history: Array<{
    timestamp: string;
    netBalanceMw: number;
    renewableShare: number;
  }>;
};

export type EnergyResponse = {
  updatedAt: string;
  regions: EnergySnapshot[];
};
