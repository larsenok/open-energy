import { describe, expect, test } from 'vitest';
import { generateEnergyData, toPercent } from '../src/data/energy.js';

class MockResponse {
  constructor(body) {
    this.ok = true;
    this._body = body;
  }

  async json() {
    return JSON.parse(JSON.stringify(this._body));
  }
}

const mockTimes = Array.from({ length: 48 }, (_, index) => {
  const date = new Date(Date.UTC(2024, 0, 1, index));
  return date.toISOString();
});

const mockMeteo = {
  current: {
    temperature_2m: 18.6,
    wind_speed_10m: 5.2,
    solar_radiation: 420,
    time: mockTimes.at(-1)
  },
  hourly: {
    time: mockTimes,
    direct_radiation: mockTimes.map((_, index) => (index % 24 < 12 ? 350 : 120)),
    wind_speed_10m: mockTimes.map((_, index) => 4 + (index % 6)),
    temperature_2m: mockTimes.map((_, index) => 15 + (index % 5))
  }
};

const mockAir = {
  results: [
    {
      measurements: [
        {
          parameter: 'pm25',
          value: 12.3,
          unit: 'µg/m³',
          lastUpdated: '2024-01-01T23:00:00Z'
        }
      ]
    }
  ]
};

const mockEmissions = [
  {
    average: 0.041,
    time: '2024-01-01T23:00:00Z'
  }
];

async function mockFetch(url) {
  const target = url instanceof URL ? url : new URL(String(url));
  if (target.hostname.includes('open-meteo')) {
    return new MockResponse(mockMeteo);
  }
  if (target.hostname.includes('openaq')) {
    return new MockResponse(mockAir);
  }
  if (target.hostname.includes('emissions-api')) {
    return new MockResponse(mockEmissions);
  }
  throw new Error(`Unexpected request for ${target.href}`);
}

describe('energy dataset generator', () => {
  test('produces region metrics with deterministic history length', async () => {
    const { energy, insights, cache } = await generateEnergyData({ fetchImpl: mockFetch });

    expect(Array.isArray(energy.regions)).toBe(true);
    expect(energy.regions.length).toBeGreaterThan(5);

    const firstRegion = energy.regions[0];
    expect(Array.isArray(firstRegion.history)).toBe(true);
    expect(firstRegion.history).toHaveLength(24);
    expect(firstRegion.history.every((entry) => typeof entry.timestamp === 'string')).toBe(true);

    expect(typeof firstRegion.renewableShare).toBe('number');
    expect(Number.isInteger(firstRegion.renewableShare * 100)).toBe(true);

    const insight = insights.regions[firstRegion.regionId];
    expect(insight).toBeDefined();
    expect(Array.isArray(insight.entries)).toBe(true);
    expect(insight.entries.length).toBeGreaterThan(0);

    const cachedMeteo = cache.regions[firstRegion.regionId].openMeteo;
    expect(cachedMeteo.current.temperature_2m).toBeCloseTo(18.6);
  });

  test('converts map pixels to percentages', () => {
    expect(toPercent([700, 530])).toEqual([50, 50]);
    expect(toPercent([1400, 1060])).toEqual([100, 100]);
  });
});
