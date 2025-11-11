const MAP_DIMENSIONS = { width: 1400, height: 1060 };

const REGION_BASELINES = [
  {
    regionId: 'new-york',
    regionName: 'New York',
    coordinates: [-74, 40.7],
    mapPixel: [412, 289],
    baseline: {
      carbonIntensity: 320,
      generationMw: 98000,
      consumptionMw: 93000,
      mix: { solar: 12000, wind: 16000, hydro: 11000, fossil: 52000, other: 7000 },
      referenceTemperature: 20
    }
  },
  {
    regionId: 'los-angeles',
    regionName: 'Los Angeles',
    coordinates: [-118.2, 34],
    mapPixel: [240, 331],
    baseline: {
      carbonIntensity: 290,
      generationMw: 61000,
      consumptionMw: 60000,
      mix: { solar: 18000, wind: 9000, hydro: 5000, fossil: 26000, other: 3000 },
      referenceTemperature: 24
    }
  },
  {
    regionId: 'mexico-city',
    regionName: 'Mexico City',
    coordinates: [-99.1, 19.4],
    mapPixel: [315, 416],
    baseline: {
      carbonIntensity: 470,
      generationMw: 54000,
      consumptionMw: 56000,
      mix: { solar: 8000, wind: 6000, hydro: 7000, fossil: 30000, other: 3000 },
      referenceTemperature: 25
    }
  },
  {
    regionId: 'sao-paulo',
    regionName: 'São Paulo',
    coordinates: [-46.6, -23.5],
    mapPixel: [519, 672],
    baseline: {
      carbonIntensity: 120,
      generationMw: 68000,
      consumptionMw: 64000,
      mix: { solar: 9000, wind: 14000, hydro: 33000, fossil: 9000, other: 3000 },
      referenceTemperature: 23
    }
  },
  {
    regionId: 'buenos-aires',
    regionName: 'Buenos Aires',
    coordinates: [-58.4, -34.6],
    mapPixel: [474, 643],
    baseline: {
      carbonIntensity: 350,
      generationMw: 42000,
      consumptionMw: 43000,
      mix: { solar: 5000, wind: 7000, hydro: 9000, fossil: 20000, other: 1000 },
      referenceTemperature: 18
    }
  },
  {
    regionId: 'london',
    regionName: 'London',
    coordinates: [-0.1, 51.5],
    mapPixel: [700, 226],
    baseline: {
      carbonIntensity: 220,
      generationMw: 42000,
      consumptionMw: 39000,
      mix: { solar: 6000, wind: 18000, hydro: 4000, fossil: 12000, other: 2000 },
      referenceTemperature: 16
    }
  },
  {
    regionId: 'paris',
    regionName: 'Paris',
    coordinates: [2.3, 48.9],
    mapPixel: [707, 245],
    baseline: {
      carbonIntensity: 210,
      generationMw: 41000,
      consumptionMw: 40000,
      mix: { solar: 7000, wind: 15000, hydro: 6000, fossil: 11000, other: 2000 },
      referenceTemperature: 17
    }
  },
  {
    regionId: 'moscow',
    regionName: 'Moscow',
    coordinates: [37.6, 55.8],
    mapPixel: [849, 201],
    baseline: {
      carbonIntensity: 520,
      generationMw: 76000,
      consumptionMw: 78000,
      mix: { solar: 4000, wind: 8000, hydro: 20000, fossil: 42000, other: 2000 },
      referenceTemperature: 10
    }
  },
  {
    regionId: 'cairo',
    regionName: 'Cairo',
    coordinates: [31.2, 30],
    mapPixel: [824, 354],
    baseline: {
      carbonIntensity: 430,
      generationMw: 34000,
      consumptionMw: 36000,
      mix: { solar: 9000, wind: 4000, hydro: 6000, fossil: 14000, other: 1000 },
      referenceTemperature: 28
    }
  },
  {
    regionId: 'johannesburg',
    regionName: 'Johannesburg',
    coordinates: [28, -26.2],
    mapPixel: [809, 682],
    baseline: {
      carbonIntensity: 610,
      generationMw: 28000,
      consumptionMw: 31000,
      mix: { solar: 3000, wind: 4000, hydro: 2000, fossil: 18000, other: 1000 },
      referenceTemperature: 22
    }
  },
  {
    regionId: 'new-delhi',
    regionName: 'New Delhi',
    coordinates: [77.2, 28.6],
    mapPixel: [998, 364],
    baseline: {
      carbonIntensity: 640,
      generationMw: 155000,
      consumptionMw: 158000,
      mix: { solar: 28000, wind: 24000, hydro: 19000, fossil: 81000, other: 3000 },
      referenceTemperature: 29
    }
  },
  {
    regionId: 'beijing',
    regionName: 'Beijing',
    coordinates: [116.4, 39.9],
    mapPixel: [1137, 301],
    baseline: {
      carbonIntensity: 580,
      generationMw: 220000,
      consumptionMw: 215000,
      mix: { solar: 26000, wind: 36000, hydro: 52000, fossil: 99000, other: 7000 },
      referenceTemperature: 12
    }
  },
  {
    regionId: 'tokyo',
    regionName: 'Tokyo',
    coordinates: [139.7, 35.7],
    mapPixel: [1226, 331],
    baseline: {
      carbonIntensity: 520,
      generationMw: 98000,
      consumptionMw: 103000,
      mix: { solar: 20000, wind: 7000, hydro: 11000, fossil: 58000, other: 2000 },
      referenceTemperature: 18
    }
  },
  {
    regionId: 'sydney',
    regionName: 'Sydney',
    coordinates: [151.2, -33.9],
    mapPixel: [1271, 729],
    baseline: {
      carbonIntensity: 410,
      generationMw: 46000,
      consumptionMw: 44000,
      mix: { solar: 12000, wind: 10000, hydro: 5000, fossil: 17000, other: 2000 },
      referenceTemperature: 21
    }
  }
];

const DEFAULT_HISTORY_HOURS = 24;
const REQUEST_TIMEOUT_MS = 6000;
const FOSSIL_INTENSITY_BASELINE = 0.05;

export function toPercent([x, y]) {
  const xPercent = (x / MAP_DIMENSIONS.width) * 100;
  const yPercent = (y / MAP_DIMENSIONS.height) * 100;
  return [Number(xPercent.toFixed(3)), Number(yPercent.toFixed(3))];
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function safeIso(input) {
  try {
    const date = input instanceof Date ? input : new Date(input ?? Date.now());
    if (Number.isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

function scaleIrradiance(value) {
  if (!isFiniteNumber(value)) {
    return 1;
  }
  const normalized = value / 550;
  return clamp(0.35 + normalized, 0.45, 1.8);
}

function scaleWind(value) {
  if (!isFiniteNumber(value)) {
    return 1;
  }
  const normalized = value / 13;
  return clamp(0.5 + normalized, 0.55, 1.7);
}

function scalePollution(value) {
  if (!isFiniteNumber(value)) {
    return 1;
  }
  const normalized = value / 25;
  return clamp(0.7 + normalized * 0.6, 0.6, 1.65);
}

function scaleEmissions(value) {
  if (!isFiniteNumber(value)) {
    return 1;
  }
  const normalized = value / FOSSIL_INTENSITY_BASELINE;
  return clamp(0.6 + normalized * 0.45, 0.55, 1.7);
}

function demandFromTemperature(value, reference) {
  if (!isFiniteNumber(value)) {
    return 1;
  }
  const baseline = isFiniteNumber(reference) ? reference : 20;
  const delta = Math.abs(value - baseline);
  return clamp(1 + delta * 0.018, 0.85, 1.35);
}

function deriveSnapshot(profile, reading, context = {}) {
  const { baseline } = profile;
  const totalBaselineMix = sum(Object.values(baseline.mix));
  const solarFactor = scaleIrradiance(reading.solarIrradiance);
  const windFactor = scaleWind(reading.windSpeed);
  const pollutionFactor = scalePollution(reading.pm25);
  const emissionFactor = scaleEmissions(reading.coAverage);
  const fossilFactor = Math.max(pollutionFactor, emissionFactor);

  const scaledMix = {
    solar: baseline.mix.solar * solarFactor,
    wind: baseline.mix.wind * windFactor,
    hydro: baseline.mix.hydro,
    fossil: baseline.mix.fossil * fossilFactor,
    other: baseline.mix.other
  };

  const scaledTotal = sum(Object.values(scaledMix));
  const totalRatio = scaledTotal > 0 ? scaledTotal / totalBaselineMix : 1;
  const generationMw = Math.max(1, Math.round(baseline.generationMw * clamp(totalRatio, 0.6, 1.6)));
  const normalization = generationMw / (scaledTotal || 1);

  const mix = Object.fromEntries(
    Object.entries(scaledMix).map(([key, value]) => [key, Math.max(0, Math.round(value * normalization))])
  );
  const mixTotal = sum(Object.values(mix));
  const mixKeys = Object.keys(mix);
  if (mixTotal !== generationMw && mixKeys.length) {
    const dominantKey = mixKeys.reduce((winner, key) => (mix[key] > (mix[winner] ?? 0) ? key : winner), mixKeys[0]);
    mix[dominantKey] += generationMw - mixTotal;
  }

  const renewableMw = mix.solar + mix.wind + mix.hydro;
  const renewableShare = Number(((renewableMw / Math.max(generationMw, 1)) || 0).toFixed(2));

  const temperature = isFiniteNumber(reading.temperature)
    ? reading.temperature
    : context.baseTemperature ?? baseline.referenceTemperature;
  const consumptionFactor = demandFromTemperature(temperature, baseline.referenceTemperature);
  const consumptionMw = Math.max(1, Math.round(baseline.consumptionMw * consumptionFactor));

  const carbonIntensity = Math.round(clamp(baseline.carbonIntensity * fossilFactor, 60, 950));
  const netBalanceMw = generationMw - consumptionMw;

  return {
    regionId: profile.regionId,
    regionName: profile.regionName,
    coordinates: profile.coordinates,
    mapPosition: toPercent(profile.mapPixel),
    generationMw,
    consumptionMw,
    renewableShare,
    carbonIntensity,
    mix,
    netBalanceMw,
    factors: {
      solar: solarFactor,
      wind: windFactor,
      fossil: fossilFactor,
      consumption: consumptionFactor
    }
  };
}

function createSyntheticHistory(hours, baselineBalance) {
  const now = Date.now();
  const amplitude = Math.max(250, Math.abs(baselineBalance) * 0.6 + 800);
  const history = [];
  for (let i = hours - 1; i >= 0; i -= 1) {
    const progress = (hours - i) / hours;
    const wave = Math.sin(progress * Math.PI * 2) * amplitude * 0.3;
    const timestamp = new Date(now - i * 60 * 60 * 1000);
    history.push({
      timestamp: timestamp.toISOString(),
      netBalanceMw: Math.round(baselineBalance + wave)
    });
  }
  return history;
}

function createHistoryFromWeather(profile, meteo, latestReading, baseSnapshot) {
  const times = meteo?.hourly?.time;
  const solarSeries = meteo?.hourly?.direct_radiation;
  const windSeries = meteo?.hourly?.wind_speed_10m;
  const tempSeries = meteo?.hourly?.temperature_2m;
  if (!Array.isArray(times) || !times.length) {
    return createSyntheticHistory(DEFAULT_HISTORY_HOURS, baseSnapshot.netBalanceMw);
  }

  const total = times.length;
  const start = Math.max(0, total - DEFAULT_HISTORY_HOURS);
  const history = [];
  for (let index = start; index < total; index += 1) {
    const reading = {
      solarIrradiance: solarSeries?.[index],
      windSpeed: windSeries?.[index],
      temperature: tempSeries?.[index],
      pm25: latestReading.pm25,
      coAverage: latestReading.coAverage
    };
    const snapshot = deriveSnapshot(profile, reading, {
      baseTemperature: latestReading.temperature ?? profile.baseline.referenceTemperature
    });
    history.push({
      timestamp: safeIso(times[index]),
      netBalanceMw: snapshot.netBalanceMw
    });
  }

  if (!history.length) {
    return createSyntheticHistory(DEFAULT_HISTORY_HOURS, baseSnapshot.netBalanceMw);
  }
  return history;
}

async function fetchJsonWithTimeout(url, { fetchImpl, timeoutMs }) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs ?? REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(id);
  }
}

function buildMeteoUrl(latitude, longitude) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', latitude.toFixed(4));
  url.searchParams.set('longitude', longitude.toFixed(4));
  url.searchParams.set('hourly', 'temperature_2m,wind_speed_10m,direct_radiation');
  url.searchParams.set('current', 'temperature_2m,wind_speed_10m,solar_radiation');
  url.searchParams.set('past_days', '1');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('timezone', 'UTC');
  return url;
}

function buildAirUrl(latitude, longitude) {
  const url = new URL('https://api.openaq.org/v2/latest');
  url.searchParams.set('coordinates', `${latitude.toFixed(4)},${longitude.toFixed(4)}`);
  url.searchParams.set('radius', '100000');
  url.searchParams.set('limit', '1');
  url.searchParams.set('order_by', 'datetime');
  url.searchParams.set('sort', 'desc');
  url.searchParams.set('parameter', 'pm25');
  return url;
}

function buildEmissionsUrl(latitude, longitude) {
  const url = new URL('https://api.emissions-api.org/api/v2/carbonmonoxide/average.json');
  url.searchParams.set('point', `${longitude.toFixed(4)},${latitude.toFixed(4)}`);
  url.searchParams.set('limit', '1');
  return url;
}

function extractPm25(payload) {
  const measurement = payload?.results?.[0]?.measurements?.find((entry) => isFiniteNumber(entry.value));
  if (!measurement) {
    return null;
  }
  return {
    value: measurement.value,
    unit: measurement.unit ?? 'µg/m³',
    lastUpdated: measurement.lastUpdated ?? payload?.results?.[0]?.date?.utc
  };
}

function extractEmissions(payload) {
  if (!Array.isArray(payload) || !payload.length) {
    return null;
  }
  const record = payload[0];
  const average = isFiniteNumber(record.average)
    ? record.average
    : isFiniteNumber(record.value)
    ? record.value
    : null;
  if (!isFiniteNumber(average)) {
    return null;
  }
  return {
    average,
    lastUpdated: record.time ?? record.end ?? record.begin
  };
}

function createFallbackRegion(profile) {
  const { baseline } = profile;
  const mix = { ...baseline.mix };
  const renewableShare = Number(
    ((mix.solar + mix.wind + mix.hydro) / Math.max(baseline.generationMw, 1)).toFixed(2)
  );
  return {
    regionId: profile.regionId,
    regionName: profile.regionName,
    coordinates: profile.coordinates,
    mapPosition: toPercent(profile.mapPixel),
    generationMw: baseline.generationMw,
    consumptionMw: baseline.consumptionMw,
    renewableShare,
    carbonIntensity: baseline.carbonIntensity,
    mix,
    history: createSyntheticHistory(DEFAULT_HISTORY_HOURS, baseline.generationMw - baseline.consumptionMw)
  };
}

function buildInsightEntries({ meteo, air, emissions }) {
  const entries = [];
  const sources = new Set();
  let updatedAt = null;

  const current = meteo?.current ?? null;
  if (current) {
    if (isFiniteNumber(current.temperature_2m)) {
      entries.push({ label: 'Air temperature', value: `${Math.round(current.temperature_2m)}°C` });
      updatedAt = current.time ?? updatedAt;
      sources.add('Open-Meteo');
    }
    if (isFiniteNumber(current.wind_speed_10m)) {
      entries.push({ label: 'Wind speed', value: `${current.wind_speed_10m.toFixed(1)} m/s` });
      updatedAt = current.time ?? updatedAt;
      sources.add('Open-Meteo');
    }
    if (isFiniteNumber(current.solar_radiation)) {
      entries.push({ label: 'Solar radiation', value: `${Math.round(current.solar_radiation)} W/m²` });
      updatedAt = current.time ?? updatedAt;
      sources.add('Open-Meteo');
    }
  }

  const pm25 = extractPm25(air);
  if (pm25) {
    entries.push({ label: 'PM₂.₅ concentration', value: `${pm25.value.toFixed(1)} ${pm25.unit}` });
    updatedAt = pm25.lastUpdated ?? updatedAt;
    sources.add('OpenAQ');
  }

  const co = extractEmissions(emissions);
  if (co) {
    entries.push({ label: 'CO column density', value: `${co.average.toFixed(3)} mol/m²` });
    updatedAt = co.lastUpdated ?? updatedAt;
    sources.add('Emissions API');
  }

  return { entries, sources: Array.from(sources), updatedAt: updatedAt ? safeIso(updatedAt) : null };
}

async function collectRegionDataset(profile, options) {
  const { fetchImpl, timeoutMs, logger } = options;
  if (typeof fetchImpl !== 'function') {
    const fallback = createFallbackRegion(profile);
    return {
      energy: fallback,
      insight: {
        regionId: profile.regionId,
        status: 'offline',
        entries: [],
        sources: [],
        updatedAt: null,
        error: 'No fetch implementation available'
      },
      cache: {
        openMeteo: { error: 'unavailable' },
        openAQ: { error: 'unavailable' },
        emissions: { error: 'unavailable' }
      }
    };
  }

  const { latitude, longitude } = { latitude: profile.coordinates[1], longitude: profile.coordinates[0] };
  const meteoUrl = buildMeteoUrl(latitude, longitude);
  const airUrl = buildAirUrl(latitude, longitude);
  const emissionsUrl = buildEmissionsUrl(latitude, longitude);

  const [meteoResult, airResult, emissionsResult] = await Promise.allSettled([
    fetchJsonWithTimeout(meteoUrl, { fetchImpl, timeoutMs }),
    fetchJsonWithTimeout(airUrl, { fetchImpl, timeoutMs }),
    fetchJsonWithTimeout(emissionsUrl, { fetchImpl, timeoutMs })
  ]);

  const meteo = meteoResult.status === 'fulfilled' ? meteoResult.value : null;
  const air = airResult.status === 'fulfilled' ? airResult.value : null;
  const emissions = emissionsResult.status === 'fulfilled' ? emissionsResult.value : null;

  if (meteoResult.status === 'rejected') {
    logger?.warn?.(`Open-Meteo request failed for ${profile.regionId}: ${meteoResult.reason}`);
  }
  if (airResult.status === 'rejected') {
    logger?.warn?.(`OpenAQ request failed for ${profile.regionId}: ${airResult.reason}`);
  }
  if (emissionsResult.status === 'rejected') {
    logger?.warn?.(`Emissions API request failed for ${profile.regionId}: ${emissionsResult.reason}`);
  }

  const pm25 = extractPm25(air);
  const emissionsReading = extractEmissions(emissions);

  const latestReading = {
    solarIrradiance: meteo?.current?.solar_radiation ?? meteo?.hourly?.direct_radiation?.at(-1),
    windSpeed: meteo?.current?.wind_speed_10m ?? meteo?.hourly?.wind_speed_10m?.at(-1),
    temperature: meteo?.current?.temperature_2m ?? meteo?.hourly?.temperature_2m?.at(-1),
    pm25: pm25?.value ?? null,
    coAverage: emissionsReading?.average ?? null
  };

  const snapshot = deriveSnapshot(profile, latestReading);
  const history = createHistoryFromWeather(profile, meteo, latestReading, snapshot);
  const insight = buildInsightEntries({ meteo, air, emissions });

  const status = meteo || air || emissions ? 'ok' : 'fallback';
  if (status === 'fallback') {
    insight.error = 'Open data sources unavailable during build';
  }

  return {
    energy: {
      regionId: snapshot.regionId,
      regionName: snapshot.regionName,
      coordinates: snapshot.coordinates,
      mapPosition: snapshot.mapPosition,
      generationMw: snapshot.generationMw,
      consumptionMw: snapshot.consumptionMw,
      renewableShare: snapshot.renewableShare,
      carbonIntensity: snapshot.carbonIntensity,
      mix: snapshot.mix,
      history
    },
    insight: {
      regionId: profile.regionId,
      status,
      entries: insight.entries,
      sources: insight.sources,
      updatedAt: insight.updatedAt,
      error: insight.error ?? null
    },
    cache: {
      openMeteo: meteo ?? { error: String(meteoResult.reason ?? 'unavailable') },
      openAQ: air ?? { error: String(airResult.reason ?? 'unavailable') },
      emissions: emissions ?? { error: String(emissionsResult.reason ?? 'unavailable') }
    }
  };
}

export async function generateEnergyData(options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS;
  const logger = options.logger ?? console;

  const results = await Promise.all(
    REGION_BASELINES.map((profile) =>
      collectRegionDataset(profile, {
        fetchImpl,
        timeoutMs,
        logger
      }).catch((error) => {
        logger?.error?.(`Failed to generate dataset for ${profile.regionId}:`, error);
        const fallback = createFallbackRegion(profile);
        return {
          energy: fallback,
          insight: {
            regionId: profile.regionId,
            status: 'fallback',
            entries: [],
            sources: [],
            updatedAt: null,
            error: String(error.message ?? error)
          },
          cache: {
            openMeteo: { error: 'fallback' },
            openAQ: { error: 'fallback' },
            emissions: { error: 'fallback' }
          }
        };
      })
    )
  );

  const updatedAt = new Date().toISOString();
  const energy = {
    updatedAt,
    regions: results.map((result) => result.energy)
  };

  const insights = {
    updatedAt,
    regions: Object.fromEntries(
      results.map((result) => [result.energy.regionId, { ...result.insight, updatedAt: result.insight.updatedAt ?? updatedAt }])
    )
  };

  const cache = {
    generatedAt: updatedAt,
    regions: Object.fromEntries(results.map((result) => [result.energy.regionId, result.cache]))
  };

  return { energy, insights, cache };
}
