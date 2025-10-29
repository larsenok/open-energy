const REGION_COORDINATES = {
  'eu-central': {
    name: 'Central Europe',
    coordinates: [10.4515, 51.1657]
  },
  'us-conus': {
    name: 'United States',
    coordinates: [-98.5795, 39.8283]
  },
  'br-iso': {
    name: 'Brazil',
    coordinates: [-51.9253, -14.235]
  }
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createHistory(hours, balanceMw, renewableShare) {
  const records = [];
  for (let i = hours; i >= 1; i -= 1) {
    const timestamp = new Date(Date.now() - i * 60 * 60 * 1000).toISOString();
    const variation = balanceMw * (0.6 + Math.random() * 0.8);
    const renewables = clamp(renewableShare + (Math.random() - 0.5) * 0.1, 0, 1);
    records.push({
      timestamp,
      netBalanceMw: Math.round(variation),
      renewableShare: Number(renewables.toFixed(2))
    });
  }
  return records;
}

function createRegion(regionId, overrides) {
  const base = REGION_COORDINATES[regionId];
  if (!base) {
    throw new Error(`Unknown region id: ${regionId}`);
  }

  const generationMw = overrides.generationMw;
  const consumptionMw = overrides.consumptionMw;
  const renewableShare = overrides.renewableShare;

  return {
    regionId,
    regionName: base.name,
    coordinates: base.coordinates,
    timestamp: new Date().toISOString(),
    generationMw,
    consumptionMw,
    renewableShare,
    carbonIntensity: overrides.carbonIntensity,
    mix: { ...overrides.mix },
    history: createHistory(24, generationMw - consumptionMw, renewableShare)
  };
}

export function generateEnergyData() {
  const regions = [
    createRegion('eu-central', {
      generationMw: 102500,
      consumptionMw: 98000,
      renewableShare: 0.58,
      carbonIntensity: 220,
      mix: {
        solar: 18000,
        wind: 24000,
        hydro: 12000,
        fossil: 38000,
        other: 10500
      }
    }),
    createRegion('us-conus', {
      generationMw: 425000,
      consumptionMw: 430000,
      renewableShare: 0.33,
      carbonIntensity: 410,
      mix: {
        solar: 75000,
        wind: 95000,
        hydro: 30000,
        fossil: 215000,
        other: 10000
      }
    }),
    createRegion('br-iso', {
      generationMw: 72000,
      consumptionMw: 68000,
      renewableShare: 0.87,
      carbonIntensity: 85,
      mix: {
        solar: 8000,
        wind: 18000,
        hydro: 40000,
        fossil: 6000,
        other: 0
      }
    })
  ];

  return {
    updatedAt: new Date().toISOString(),
    regions
  };
}
