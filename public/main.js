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

let activeRegionId = null;
let regions = [];
let animationFrame = null;
const BREATHING_SPEED = 4000;

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
  for (const element of mapEl.querySelectorAll('.region')) {
    element.dataset.state = '';
  }
});

function renderRegions() {
  mapEl.textContent = '';
  regions.forEach((region) => {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'region';
    element.style.left = `${longitudeToPercent(region.coordinates[0])}%`;
    element.style.top = `${latitudeToPercent(region.coordinates[1])}%`;
    element.setAttribute('aria-label', `${region.regionName} energy pulse`);

    const core = document.createElement('span');
    core.className = 'core';
    element.append(core);

    element.addEventListener('mouseenter', () => {
      if (activeRegionId) return;
      showTooltip(region, element, false);
    });

    element.addEventListener('mouseleave', () => {
      if (activeRegionId) return;
      tooltipEl.hidden = true;
      element.dataset.state = '';
    });

    element.addEventListener('click', () => {
      if (activeRegionId === region.regionId) {
        activeRegionId = null;
        tooltipEl.hidden = true;
        element.dataset.state = '';
        return;
      }
      activeRegionId = region.regionId;
      for (const other of mapEl.querySelectorAll('.region')) {
        other.dataset.state = other === element ? 'active' : '';
      }
      showTooltip(region, element, true);
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

function showTooltip(region, element, frozen) {
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

  tooltipEl.hidden = false;
  const rect = element.getBoundingClientRect();
  tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
  tooltipEl.style.top = `${rect.top - 12}px`;
  tooltipEl.style.transform = 'translate(-50%, -100%)';
  tooltipEl.dataset.state = frozen ? 'frozen' : '';
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

function longitudeToPercent(lon) {
  return ((lon + 180) / 360) * 100;
}

function latitudeToPercent(lat) {
  return ((90 - lat) / 180) * 100;
}
