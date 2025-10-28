import { NextResponse } from 'next/server';
import { getCached, setCached } from '@/lib/cache';
import type { EnergyResponse, EnergySnapshot, GenerationBreakdown } from '@/types/energy';

const CACHE_KEY = 'energy:latest';

async function fetchEntsoeData(): Promise<EnergySnapshot[]> {
  const token = process.env.ENTSOE_API_TOKEN;
  const mock: EnergySnapshot = {
    regionId: 'eu-central',
    regionName: 'Central Europe',
    timestamp: new Date().toISOString(),
    consumptionMw: 98000,
    generationMw: 102500,
    renewableShare: 0.58,
    carbonIntensity: 220,
    mix: {
      solar: 18000,
      wind: 24000,
      hydro: 12000,
      fossil: 38000,
      other: 10500
    },
    history: generateHistory(24, 102500 - 98000, 0.58)
  };

  if (!token) {
    return [mock];
  }

  // Placeholder implementation using mock structure. Replace with actual API call.
  // Documentation: https://transparency.entsoe.eu/content/static_content/Static%20content/web%20api/Guide.html
  return [mock];
}

async function fetchUsData(): Promise<EnergySnapshot[]> {
  const apiKey = process.env.EIA_API_KEY;
  const mock: EnergySnapshot = {
    regionId: 'us-conus',
    regionName: 'United States',
    timestamp: new Date().toISOString(),
    consumptionMw: 430000,
    generationMw: 425000,
    renewableShare: 0.33,
    carbonIntensity: 410,
    mix: {
      solar: 75000,
      wind: 95000,
      hydro: 30000,
      fossil: 215000,
      other: 10000
    },
    history: generateHistory(24, 425000 - 430000, 0.33)
  };

  if (!apiKey) {
    return [mock];
  }

  // Placeholder; integrate with https://www.eia.gov/opendata/ in production
  return [mock];
}

async function fetchGlobalIntensity(): Promise<EnergySnapshot[]> {
  const token = process.env.ELECTRICITYMAP_TOKEN;
  const mock: EnergySnapshot = {
    regionId: 'br-iso',
    regionName: 'Brazil',
    timestamp: new Date().toISOString(),
    consumptionMw: 68000,
    generationMw: 72000,
    renewableShare: 0.87,
    carbonIntensity: 85,
    mix: {
      solar: 8000,
      wind: 18000,
      hydro: 40000,
      fossil: 6000,
      other: 0
    },
    history: generateHistory(24, 72000 - 68000, 0.87)
  };

  if (!token) {
    return [mock];
  }

  // Placeholder for ElectricityMap or Open-Meteo integration.
  return [mock];
}

function generateHistory(hours: number, balanceMw: number, renewableShare: number) {
  const data: EnergySnapshot['history'] = [];
  for (let i = hours; i >= 1; i -= 1) {
    const ts = new Date(Date.now() - i * 60 * 60 * 1000).toISOString();
    const variation = balanceMw * (0.6 + Math.random() * 0.8);
    const renewables = Math.min(1, Math.max(0, renewableShare + (Math.random() - 0.5) * 0.1));
    data.push({
      timestamp: ts,
      netBalanceMw: variation,
      renewableShare: renewables
    });
  }
  return data;
}

function mergeSnapshots(list: EnergySnapshot[][]): EnergySnapshot[] {
  return list.flat().reduce<EnergySnapshot[]>((acc, snapshot) => {
    if (!snapshot.regionId) {
      return acc;
    }
    const existingIndex = acc.findIndex((item) => item.regionId === snapshot.regionId);
    if (existingIndex >= 0) {
      const existing = acc[existingIndex];
      const merged: EnergySnapshot = {
        ...existing,
        ...snapshot,
        mix: mergeMix(existing.mix, snapshot.mix),
        history: snapshot.history.length ? snapshot.history : existing.history
      };
      acc[existingIndex] = merged;
      return acc;
    }
    acc.push(snapshot);
    return acc;
  }, []);
}

function mergeMix(a: GenerationBreakdown, b: GenerationBreakdown): GenerationBreakdown {
  return {
    solar: b.solar ?? a.solar,
    wind: b.wind ?? a.wind,
    hydro: b.hydro ?? a.hydro,
    fossil: b.fossil ?? a.fossil,
    other: b.other ?? a.other
  };
}

export async function GET() {
  const cached = getCached<EnergyResponse>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached);
  }

  const [entsoe, usa, global] = await Promise.all([
    fetchEntsoeData(),
    fetchUsData(),
    fetchGlobalIntensity()
  ]);

  const regions = mergeSnapshots([entsoe, usa, global]);

  const payload: EnergyResponse = {
    updatedAt: new Date().toISOString(),
    regions
  };

  setCached(CACHE_KEY, payload, 60 * 60);

  return NextResponse.json(payload, {
    headers: {
      'cache-control': 'public, max-age=60'
    }
  });
}
