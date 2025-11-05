const mapEl = document.getElementById('map');
const statusEl = document.getElementById('status');
const timestampEl = document.getElementById('timestamp');
const tooltipEl = document.getElementById('tooltip');
const tooltipTitle = document.getElementById('tooltip-title');
const tooltipBalance = document.getElementById('tooltip-balance');
const tooltipMix = document.getElementById('tooltip-mix');
const tooltipChart = document.getElementById('tooltip-chart');
const tooltipFootnote = document.getElementById('tooltip-footnote');
const tooltipClose = document.getElementById('tooltip-close');
const tooltipInsights = document.getElementById('tooltip-insights');
const tooltipInsightsList = document.getElementById('tooltip-insights-list');
const tooltipInsightsNote = document.getElementById('tooltip-insights-note');
const tabButtons = Array.from(document.querySelectorAll('[data-tab]'));
const tabPanels = Array.from(document.querySelectorAll('[data-panel]'));
const daylightPanel = document.getElementById('daylight-panel');
const daylightDial = document.getElementById('daylight-dial');
const sunriseTimeEl = document.getElementById('sunrise-time');
const sunsetTimeEl = document.getElementById('sunset-time');
const daylightLengthEl = document.getElementById('daylight-length');
const daylightStatusEl = document.getElementById('daylight-status');

let activeRegionId = null;
let regions = [];
let animationFrame = null;
let tooltipAnchor = null;
const BREATHING_SPEED = 4000;
const OPEN_DATA_TIMEOUT = 5500;
const DEFAULT_TAB_ID = 'grid';
const DAYLIGHT_TAB_ID = 'daylight';
const OSLO_COORDS = { latitude: 59.9139, longitude: 10.7522 };
const OSLO_TIME_ZONE = 'Europe/Oslo';
const DAYLIGHT_REFRESH_INTERVAL = 60 * 1000;

const insightsCache = new Map();

if (tabButtons.length) {
  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab || DEFAULT_TAB_ID;
      switchTab(tabId);
    });
  });
  switchTab(DEFAULT_TAB_ID);
}

if (daylightDial) {
  updateDaylight();
  setInterval(updateDaylight, DAYLIGHT_REFRESH_INTERVAL);
}

fetch('data/energy.json')
  .then((response) => {
    if (!response.ok) {
      throw new Error('Unable to load energy data');
    }
    return response.json();
  })
  .then((payload) => {
    regions = payload.regions;
    statusEl.textContent = 'Live grid signals updated';
    timestampEl.textContent = `Updated ${new Date(payload.updatedAt).toLocaleTimeString()}`;
    renderRegions();
    startAnimation();
  })
  .catch((error) => {
    statusEl.textContent = 'Unable to reach energy services.';
    statusEl.classList.add('error');
    console.error(error);
  });

tooltipClose.addEventListener('click', () => {
  activeRegionId = null;
  tooltipEl.hidden = true;
  resetTooltipInsights();
  tooltipAnchor = null;
  for (const element of mapEl.querySelectorAll('.region')) {
    element.dataset.state = '';
  }
});

function switchTab(tabId) {
  const target = tabId || DEFAULT_TAB_ID;
  if (tabButtons.length) {
    tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === target;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
      button.setAttribute('tabindex', isActive ? '0' : '-1');
    });
  }
  if (tabPanels.length) {
    tabPanels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== target;
    });
  }
  if (target === DAYLIGHT_TAB_ID) {
    updateDaylight();
  }
}

function renderRegions() {
  mapEl.textContent = '';
  regions.forEach((region) => {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'region';
    if (Array.isArray(region.mapPosition) && region.mapPosition.length === 2) {
      element.style.left = `${region.mapPosition[0]}%`;
      element.style.top = `${region.mapPosition[1]}%`;
    } else {
      element.style.left = '50%';
      element.style.top = '50%';
    }
    element.setAttribute('aria-label', `${region.regionName} energy pulse`);

    const core = document.createElement('span');
    core.className = 'core';
    element.append(core);

    element.addEventListener('mouseenter', () => {
      if (activeRegionId) return;
      showTooltip(region, element);
    });

    element.addEventListener('mouseleave', () => {
      if (activeRegionId) return;
      tooltipEl.hidden = true;
      tooltipAnchor = null;
      element.dataset.state = '';
    });

    element.addEventListener('click', () => {
      if (activeRegionId === region.regionId) {
        activeRegionId = null;
        tooltipEl.hidden = true;
        resetTooltipInsights();
        tooltipAnchor = null;
        element.dataset.state = '';
        return;
      }
      activeRegionId = region.regionId;
      for (const other of mapEl.querySelectorAll('.region')) {
        other.dataset.state = other === element ? 'active' : '';
      }
      showTooltip(region, element);
    });

    mapEl.append(element);
  });
}

function startAnimation() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }

  const start = performance.now();
  const elements = Array.from(mapEl.querySelectorAll('.region'));

  const tick = () => {
    const elapsed = performance.now() - start;
    const pulse = (Math.sin(((elapsed % BREATHING_SPEED) / BREATHING_SPEED) * Math.PI * 2) + 1) / 2;

    elements.forEach((element, index) => {
      const region = regions[index];
      if (!region) return;
      const balance = region.generationMw - region.consumptionMw;
      const normalized = Math.max(-1, Math.min(1, balance / Math.max(region.consumptionMw, 1)));
      const strength = Math.abs(normalized);
      const hue = normalized >= 0 ? 140 : 30;
      const saturation = 70 + strength * 30;
      const lightness = 45 + pulse * 10;
      const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      const coreLightness = Math.max(30, 40 - strength * 10);
      const coreColor = `hsl(${hue}, ${Math.min(100, saturation + 10)}%, ${coreLightness}%)`;
      const glowOpacity = 0.35 + strength * 0.25;

      element.style.setProperty('--pulse-scale', 0.6 + pulse * 0.7 + strength * 0.3);
      element.style.setProperty('--pulse-color', color);
      element.style.setProperty('--core-color', coreColor);
      element.style.setProperty('--glow-opacity', glowOpacity.toFixed(2));
    });

    animationFrame = requestAnimationFrame(tick);
  };

  tick();
}

function showTooltip(region, element) {
  tooltipAnchor = element;
  tooltipTitle.textContent = region.regionName;

  const balance = region.generationMw - region.consumptionMw;
  const status = balance >= 0 ? 'surplus' : 'deficit';
  const balanceMagnitude = Math.abs(balance).toLocaleString();
  const prefix = balance >= 0 ? 'Surplus' : 'Deficit';
  tooltipBalance.textContent = `${prefix} of ${balanceMagnitude} MW`;

  tooltipMix.textContent = '';
  for (const [key, value] of Object.entries(region.mix)) {
    const term = document.createElement('dt');
    term.textContent = key.replace(/^(\w)/, (m) => m.toUpperCase());
    const definition = document.createElement('dd');
    definition.textContent = `${Number((value / region.generationMw) * 100).toFixed(1)}% (${value.toLocaleString()} MW)`;
    tooltipMix.append(term, definition);
  }

  tooltipFootnote.textContent = `Carbon intensity: ${region.carbonIntensity} gCO₂/kWh · Renewable share ${(region.renewableShare * 100).toFixed(0)}%`;

  renderHistoryChart(region.history, status);
  prepareTooltipInsights(region);

  tooltipEl.hidden = false;
  positionTooltip(element);
}

function positionTooltip(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const viewportPadding = 16;
  const tooltipWidth = tooltipEl.offsetWidth;
  const tooltipHeight = tooltipEl.offsetHeight;
  const maxLeft = window.innerWidth - viewportPadding - tooltipWidth / 2;
  const minLeft = viewportPadding + tooltipWidth / 2;
  let left;
  if (minLeft > maxLeft) {
    left = window.innerWidth / 2;
  } else {
    left = Math.min(Math.max(rect.left + rect.width / 2, minLeft), maxLeft);
  }

  let top = rect.top - 12;
  let verticalTransform = '-100%';

  if (top - tooltipHeight < viewportPadding) {
    top = rect.bottom + 12;
    verticalTransform = '0';
    const maxTop = window.innerHeight - viewportPadding - tooltipHeight;
    top = Math.min(top, maxTop);
  }

  if (verticalTransform === '-100%') {
    const minTop = viewportPadding + tooltipHeight;
    if (top < minTop) {
      top = minTop;
    }
  } else if (top < viewportPadding) {
    top = viewportPadding;
  }

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
  tooltipEl.style.transform = `translate(-50%, ${verticalTransform})`;
}

function renderHistoryChart(history, status) {
  tooltipChart.textContent = '';
  if (!history.length) {
    return;
  }
  const width = 240;
  const height = 110;
  const max = Math.max(...history.map((d) => d.netBalanceMw));
  const min = Math.min(...history.map((d) => d.netBalanceMw));
  const range = Math.max(1, max - min);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const midline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  const zeroY = height - ((0 - min) / range) * height;
  midline.setAttribute('x1', '0');
  midline.setAttribute('x2', String(width));
  midline.setAttribute('y1', String(zeroY));
  midline.setAttribute('y2', String(zeroY));
  midline.setAttribute('stroke', 'rgba(148, 163, 184, 0.25)');
  midline.setAttribute('stroke-dasharray', '4 6');
  svg.append(midline);

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const points = history
    .map((entry, index) => {
      const x = (index / Math.max(1, history.length - 1)) * width;
      const y = height - ((entry.netBalanceMw - min) / range) * height;
      return [x, y];
    });

  const d = points
    .map((point, index) => (index === 0 ? `M ${point[0]} ${point[1]}` : `L ${point[0]} ${point[1]}`))
    .join(' ');

  path.setAttribute('d', d);
  const gradient = status === 'surplus' ? 'url(#surplusGradient)' : 'url(#deficitGradient)';
  path.setAttribute('stroke', gradient);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-width', '2.5');
  svg.append(path);

  const gradientDef = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  const gradientId = status === 'surplus' ? 'surplusGradient' : 'deficitGradient';
  gradientDef.setAttribute('id', gradientId);
  gradientDef.setAttribute('x1', '0%');
  gradientDef.setAttribute('x2', '100%');
  gradientDef.setAttribute('y1', '0%');
  gradientDef.setAttribute('y2', '0%');

  const stopA = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stopA.setAttribute('offset', '0%');
  stopA.setAttribute('stop-color', status === 'surplus' ? '#22d3ee' : '#f97316');
  const stopB = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stopB.setAttribute('offset', '100%');
  stopB.setAttribute('stop-color', status === 'surplus' ? '#a3e635' : '#f43f5e');

  gradientDef.append(stopA, stopB);

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.append(gradientDef);
  svg.insertBefore(defs, svg.firstChild);

  tooltipChart.append(svg);
}

function resetTooltipInsights() {
  tooltipInsights.hidden = true;
  tooltipInsights.classList.remove('loading', 'error');
  tooltipInsightsList.textContent = '';
  tooltipInsightsNote.textContent = '';
}

function prepareTooltipInsights(region) {
  const cached = insightsCache.get(region.regionId);
  resetTooltipInsights();
  tooltipInsights.hidden = false;
  tooltipInsights.classList.add('loading');
  const placeholder = document.createElement('li');
  placeholder.innerHTML = '<span class="label">Loading open data…</span>';
  tooltipInsightsList.append(placeholder);
  if (tooltipAnchor) {
    positionTooltip(tooltipAnchor);
  }

  if (cached) {
    renderTooltipInsights(cached);
    return;
  }

  fetchLiveIndicators(region)
    .then((data) => {
      insightsCache.set(region.regionId, data);
      renderTooltipInsights(data);
    })
    .catch((error) => {
      tooltipInsights.classList.remove('loading');
      tooltipInsights.classList.add('error');
      tooltipInsightsList.textContent = '';
      const message = document.createElement('li');
      message.innerHTML = '<span class="label">Live indicators unavailable</span>';
      tooltipInsightsList.append(message);
      tooltipInsightsNote.textContent = 'Showing generated grid metrics while open data is unreachable.';
      if (tooltipAnchor) {
        positionTooltip(tooltipAnchor);
      }
      console.error('Unable to load open data for region', region.regionId, error);
    });
}

function renderTooltipInsights(data) {
  tooltipInsights.classList.remove('loading', 'error');
  tooltipInsightsList.textContent = '';

  data.entries.forEach((entry) => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = entry.label;
    const value = document.createElement('span');
    value.className = 'value';
    value.textContent = entry.value;
    item.append(label, value);
    tooltipInsightsList.append(item);
  });

  if (!data.entries.length) {
    const empty = document.createElement('li');
    empty.innerHTML = '<span class="label">No supporting data available</span>';
    tooltipInsightsList.append(empty);
    tooltipInsightsNote.textContent = 'Open datasets did not return contextual readings for this region.';
    if (tooltipAnchor) {
      positionTooltip(tooltipAnchor);
    }
    return;
  }

  tooltipInsightsNote.textContent = `Powered by ${data.sources.join(' • ')}`;
  if (tooltipAnchor) {
    positionTooltip(tooltipAnchor);
  }
}

function handleTooltipReposition() {
  if (!tooltipAnchor || tooltipEl.hidden) {
    return;
  }
  positionTooltip(tooltipAnchor);
}

window.addEventListener('resize', handleTooltipReposition);
window.addEventListener('scroll', handleTooltipReposition, true);

async function fetchLiveIndicators(region) {
  const [lon, lat] = region.coordinates;
  const meteoUrl = new URL('https://api.open-meteo.com/v1/forecast');
  meteoUrl.searchParams.set('latitude', lat.toFixed(4));
  meteoUrl.searchParams.set('longitude', lon.toFixed(4));
  meteoUrl.searchParams.set('current', 'temperature_2m,wind_speed_10m,solar_radiation');
  meteoUrl.searchParams.set('hourly', 'direct_radiation');
  meteoUrl.searchParams.set('forecast_days', '1');
  meteoUrl.searchParams.set('timezone', 'UTC');

  const airUrl = new URL('https://api.openaq.org/v2/latest');
  airUrl.searchParams.set('coordinates', `${lat.toFixed(4)},${lon.toFixed(4)}`);
  airUrl.searchParams.set('radius', '100000');
  airUrl.searchParams.set('limit', '1');
  airUrl.searchParams.set('order_by', 'datetime');
  airUrl.searchParams.set('sort', 'desc');
  airUrl.searchParams.set('parameter', 'pm25');

  const emissionsUrl = new URL('https://api.emissions-api.org/api/v2/carbonmonoxide/average.json');
  emissionsUrl.searchParams.set('point', `${lon.toFixed(4)},${lat.toFixed(4)}`);
  emissionsUrl.searchParams.set('limit', '1');

  const [meteo, air, emissions] = await Promise.allSettled([
    fetchJson(meteoUrl, OPEN_DATA_TIMEOUT),
    fetchJson(airUrl, OPEN_DATA_TIMEOUT),
    fetchJson(emissionsUrl, OPEN_DATA_TIMEOUT)
  ]);

  const entries = [];
  const sources = new Set();

  if (meteo.status === 'fulfilled') {
    const before = entries.length;
    const { current, hourly } = meteo.value ?? {};
    if (current) {
      if (typeof current.temperature_2m === 'number') {
        entries.push({ label: 'Air temperature', value: `${Math.round(current.temperature_2m)}°C` });
      }
      if (typeof current.wind_speed_10m === 'number') {
        entries.push({ label: 'Wind speed', value: `${current.wind_speed_10m.toFixed(1)} m/s` });
      }
      if (typeof current.solar_radiation === 'number') {
        entries.push({ label: 'Solar radiation', value: `${Math.round(current.solar_radiation)} W/m²` });
      }
    }
    if (hourly && Array.isArray(hourly.direct_radiation) && hourly.direct_radiation.length) {
      const recent = hourly.direct_radiation[hourly.direct_radiation.length - 1];
      if (typeof recent === 'number') {
        entries.push({ label: 'Direct irradiance', value: `${Math.round(recent)} W/m²` });
      }
    }
    if (entries.length > before) {
      sources.add('Open-Meteo');
    }
  }

  if (air.status === 'fulfilled') {
    const result = air.value?.results?.[0];
    const measurement = result?.measurements?.find((m) => typeof m.value === 'number');
    if (measurement) {
      const unit = measurement.unit ?? 'µg/m³';
      entries.push({ label: 'PM₂.₅ concentration', value: `${measurement.value.toFixed(1)} ${unit}` });
      sources.add('OpenAQ');
    }
  }

  if (emissions.status === 'fulfilled') {
    const record = Array.isArray(emissions.value) ? emissions.value[0] : null;
    const average = record && typeof record.average === 'number' ? record.average : record && typeof record.value === 'number' ? record.value : null;
    if (typeof average === 'number') {
      entries.push({ label: 'CO column density', value: `${average.toFixed(3)} mol/m²` });
      sources.add('Emissions API');
    }
  }

  return { entries, sources: Array.from(sources) };
}

async function fetchJson(url, timeout) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(id);
  }
}

function updateDaylight() {
  if (!daylightDial || !sunriseTimeEl || !sunsetTimeEl || !daylightLengthEl || !daylightStatusEl) {
    return;
  }

  const now = new Date();
  const zonedNow = getZonedDateParts(now, OSLO_TIME_ZONE);
  if (!zonedNow) {
    return;
  }

  const baseDate = new Date(Date.UTC(zonedNow.year, zonedNow.month - 1, zonedNow.day));
  const sunTimes = computeSunTimes(baseDate, OSLO_COORDS.latitude, OSLO_COORDS.longitude);

  if (!Number.isFinite(sunTimes.sunrise.getTime()) || !Number.isFinite(sunTimes.sunset.getTime())) {
    sunriseTimeEl.textContent = '—';
    sunsetTimeEl.textContent = '—';
    daylightLengthEl.textContent = '—';
    daylightStatusEl.textContent = 'Daylight data unavailable for today.';
    daylightDial.style.setProperty('--daylight-start', '0deg');
    daylightDial.style.setProperty('--daylight-end', '360deg');
    daylightDial.style.setProperty('--sun-angle', '0deg');
    if (daylightPanel) {
      daylightPanel.classList.remove('is-day');
      daylightPanel.classList.add('is-night');
    }
    return;
  }

  sunriseTimeEl.textContent = formatTime(sunTimes.sunrise, OSLO_TIME_ZONE);
  sunsetTimeEl.textContent = formatTime(sunTimes.sunset, OSLO_TIME_ZONE);

  const sunriseParts = getTimeParts(sunTimes.sunrise, OSLO_TIME_ZONE);
  const sunsetParts = getTimeParts(sunTimes.sunset, OSLO_TIME_ZONE);

  const sunriseSeconds = toSeconds(sunriseParts);
  const sunsetSeconds = toSeconds(sunsetParts);
  const nowSeconds = toSeconds({ hours: zonedNow.hours, minutes: zonedNow.minutes, seconds: zonedNow.seconds });
  const secondsInDay = 24 * 60 * 60;

  const daylightSeconds = Math.max(0, Math.round((sunTimes.sunset - sunTimes.sunrise) / 1000));
  daylightLengthEl.textContent = formatDuration(daylightSeconds);

  let sunriseAngle = ((sunriseSeconds / secondsInDay) * 360) % 360;
  let sunsetAngle = ((sunsetSeconds / secondsInDay) * 360) % 360;
  const nowAngle = ((nowSeconds / secondsInDay) * 360) % 360;

  if (sunsetAngle <= sunriseAngle) {
    sunsetAngle += 360;
  }

  daylightDial.style.setProperty('--daylight-start', `${sunriseAngle}deg`);
  daylightDial.style.setProperty('--daylight-end', `${sunsetAngle}deg`);
  daylightDial.style.setProperty('--sun-angle', `${nowAngle}deg`);

  const isDay = sunriseSeconds <= sunsetSeconds
    ? nowSeconds >= sunriseSeconds && nowSeconds < sunsetSeconds
    : nowSeconds >= sunriseSeconds || nowSeconds < sunsetSeconds;

  if (daylightPanel) {
    daylightPanel.classList.toggle('is-day', isDay);
    daylightPanel.classList.toggle('is-night', !isDay);
  }

  const untilSunset = (sunsetSeconds - nowSeconds + secondsInDay) % secondsInDay;
  const untilSunrise = (sunriseSeconds - nowSeconds + secondsInDay) % secondsInDay;

  if (isDay) {
    daylightStatusEl.textContent = untilSunset === 0 ? 'The sun is setting over Oslo now.' : `Sunset in ${formatDuration(untilSunset)}.`;
  } else {
    daylightStatusEl.textContent = untilSunrise === 0 ? 'Dawn is breaking in Oslo.' : `Sunrise in ${formatDuration(untilSunrise)}.`;
  }
}

function getZonedDateParts(date, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const lookup = (type) => {
      const part = parts.find((entry) => entry.type === type);
      return part ? Number(part.value) : 0;
    };
    return {
      year: lookup('year'),
      month: lookup('month'),
      day: lookup('day'),
      hours: lookup('hour'),
      minutes: lookup('minute'),
      seconds: lookup('second')
    };
  } catch (error) {
    console.error('Unable to resolve zoned date parts', error);
    return null;
  }
}

function getTimeParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const lookup = (type) => {
    const part = parts.find((entry) => entry.type === type);
    return part ? Number(part.value) : 0;
  };
  return {
    hours: lookup('hour'),
    minutes: lookup('minute'),
    seconds: lookup('second')
  };
}

function toSeconds(parts) {
  return parts.hours * 3600 + parts.minutes * 60 + parts.seconds;
}

function formatTime(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(date);
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes}m`;
}

function computeSunTimes(date, latitude, longitude) {
  const rad = Math.PI / 180;
  const dayMs = 1000 * 60 * 60 * 24;
  const J1970 = 2440588;
  const J2000 = 2451545;

  const toJulian = (value) => value / dayMs - 0.5 + J1970;
  const fromJulian = (julian) => new Date((julian + 0.5 - J1970) * dayMs);
  const toDays = (value) => toJulian(value) - J2000;

  const lw = -longitude * rad;
  const phi = latitude * rad;

  const d = toDays(date);
  const M = rad * (357.5291 + 0.98560028 * d);
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const P = rad * 102.9372;
  const L = M + C + P + Math.PI;
  const D = Math.asin(Math.sin(L) * Math.sin(rad * 23.4397));
  const Jtransit = J2000 + d + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const cosOmega = (Math.sin(rad * -0.83) - Math.sin(phi) * Math.sin(D)) / (Math.cos(phi) * Math.cos(D));
  if (cosOmega > 1 || cosOmega < -1) {
    const invalid = new Date(Number.NaN);
    return { sunrise: invalid, sunset: invalid };
  }
  const omega = Math.acos(cosOmega);
  const Jset = Jtransit + omega / (2 * Math.PI);
  const Jrise = Jtransit - omega / (2 * Math.PI);

  return {
    sunrise: fromJulian(Jrise),
    sunset: fromJulian(Jset)
  };
}
