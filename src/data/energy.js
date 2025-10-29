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
  },
  'in-national': {
    name: 'India',
    coordinates: [78.9629, 22.5937]
  },
  'za-grid': {
    name: 'South Africa',
    coordinates: [24.9916, -28.4793]
  },
  'au-nem': {
    name: 'Australia',
    coordinates: [134.491, -25.734968]
  },
  'cn-state': {
    name: 'China',
    coordinates: [104.1954, 35.8617]
  },
  'gb-grid': {
    name: 'United Kingdom',
    coordinates: [-3.435973, 55.378051]
  },
  'jp-main': {
    name: 'Japan',
    coordinates: [138.2529, 36.2048]
  }
};

function createHistory(hours, balanceMw) {
  const records = [];
  for (let i = hours; i >= 1; i -= 1) {
    const baseSwing = balanceMw * (0.4 + Math.random() * 0.6);
    const modulation = (Math.random() - 0.5) * Math.abs(balanceMw) * 0.25;
    records.push({
      netBalanceMw: Math.round(baseSwing + modulation)
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
    generationMw,
    consumptionMw,
    renewableShare,
    carbonIntensity: overrides.carbonIntensity,
    mix: { ...overrides.mix },
    history: createHistory(24, generationMw - consumptionMw)
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
    createRegion('in-national', {
      generationMw: 182000,
      consumptionMw: 178000,
      renewableShare: 0.41,
      carbonIntensity: 640,
      mix: {
        solar: 28000,
        wind: 39000,
        hydro: 25000,
        fossil: 84000,
        other: 7000
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
    }),
    createRegion('za-grid', {
      generationMw: 45000,
      consumptionMw: 47000,
      renewableShare: 0.18,
      carbonIntensity: 780,
      mix: {
        solar: 4000,
        wind: 6000,
        hydro: 2000,
        fossil: 32000,
        other: 1000
      }
    }),
    createRegion('au-nem', {
      generationMw: 58000,
      consumptionMw: 61000,
      renewableShare: 0.36,
      carbonIntensity: 520,
      mix: {
        solar: 12000,
        wind: 15000,
        hydro: 5000,
        fossil: 25000,
        other: 1000
      }
    }),
    createRegion('cn-state', {
      generationMw: 780000,
      consumptionMw: 770000,
      renewableShare: 0.29,
      carbonIntensity: 690,
      mix: {
        solar: 95000,
        wind: 120000,
        hydro: 200000,
        fossil: 350000,
        other: 15000
      }
    }),
    createRegion('gb-grid', {
      generationMw: 42000,
      consumptionMw: 41000,
      renewableShare: 0.54,
      carbonIntensity: 280,
      mix: {
        solar: 5000,
        wind: 16000,
        hydro: 1500,
        fossil: 15000,
        other: 4500
      }
    }),
    createRegion('jp-main', {
      generationMw: 98000,
      consumptionMw: 102000,
      renewableShare: 0.27,
      carbonIntensity: 520,
      mix: {
        solar: 18000,
        wind: 6000,
        hydro: 9000,
        fossil: 64000,
        other: 1000
      }
    })
  ];

  return {
    updatedAt: new Date().toISOString(),
    regions
  };
}
