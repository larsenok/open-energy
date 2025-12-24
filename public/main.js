import { setupFactoryBuilder } from './factory.js';
import { GEN1_POKEMON, GEN2_POKEMON, GEN3_POKEMON } from './pokemon-data.js';

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
const todayDateEl = document.getElementById('today-date');
const factoryGridEl = document.getElementById('factory-grid');
const factoryStatusEl = document.getElementById('factory-status');
const factoryTargetEl = document.getElementById('factory-target');
const factoryTickEl = document.getElementById('factory-tick');
const factoryCollectorEl = document.getElementById('factory-collector');
const factoryDirectionLabel = document.getElementById('factory-direction-label');
const factoryNewLevelBtn = document.getElementById('factory-new-level');
const factoryStartBtn = document.getElementById('factory-start');
const factoryStepBtn = document.getElementById('factory-step');
const factoryResetBtn = document.getElementById('factory-reset');
const factoryRotateBtn = document.getElementById('factory-rotate');
const factoryToolButtons = Array.from(document.querySelectorAll('[data-tool]'));
const factoryInfoButton = document.getElementById('factory-info-button');
const factoryHelpButton = document.getElementById('factory-help-button');
const factoryInfoPopup = document.getElementById('factory-info-popup');
const factoryHelpPopup = document.getElementById('factory-help-popup');
const quizGridEl = document.getElementById('quiz-grid');
const quizCountEl = document.getElementById('quiz-count');
const quizTimerEl = document.getElementById('quiz-timer');
const quizInputEl = document.getElementById('quiz-input');
const quizFeedbackEl = document.getElementById('quiz-feedback');
const quizResetBtn = document.getElementById('quiz-reset');
const quizGenerationEl = document.getElementById('quiz-generation');
const quizTotalEl = document.getElementById('quiz-total');

let activeRegionId = null;
let regions = [];
let animationFrame = null;
let tooltipAnchor = null;
const BREATHING_SPEED = 4000;
const DEFAULT_TAB_ID = 'quiz';
const DAYLIGHT_TAB_ID = 'daylight';
const OSLO_COORDS = { latitude: 59.9139, longitude: 10.7522 };
const OSLO_TIME_ZONE = 'Europe/Oslo';
const DAYLIGHT_REFRESH_INTERVAL = 1000;
const SVG_NS = 'http://www.w3.org/2000/svg';
const SKY_TRANSITION_SECONDS = 90 * 60;
const SKY_COLORS = {
  night: [6, 10, 26],
  sunrise: [246, 153, 168],
  day: [125, 211, 252],
  sunset: [217, 119, 74]
};
const QUIZ_GENERATIONS = {
  gen1: {
    label: 'Gen 1 — Kanto',
    entries: GEN1_POKEMON,
  },
  gen2: {
    label: 'Gen 2 — Johto',
    entries: GEN2_POKEMON,
  },
  gen3: {
    label: 'Gen 3 — Hoenn',
    entries: GEN3_POKEMON,
  },
};

const insightsByRegion = new Map();
let insightsUpdatedAt = null;
const quizSlots = new Map();
const quizFound = new Set();
let quizStartTime = null;
let quizTimerInterval = null;
let activeQuizKey = 'gen1';
let activeQuizEntries = QUIZ_GENERATIONS[activeQuizKey].entries;
let quizPokemonById = new Map(activeQuizEntries.map((entry) => [entry.id, entry]));
let quizGridOrder = activeQuizEntries.map((entry) => entry.id);
const quizLookup = new Map();

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

if (todayDateEl) {
  updateTodayDate();
  setInterval(updateTodayDate, 60 * 1000);
}

setupFactoryBuilder({
  gridEl: factoryGridEl,
  statusEl: factoryStatusEl,
  targetEl: factoryTargetEl,
  tickEl: factoryTickEl,
  collectorEl: factoryCollectorEl,
  directionLabel: factoryDirectionLabel,
  newLevelBtn: factoryNewLevelBtn,
  startBtn: factoryStartBtn,
  stepBtn: factoryStepBtn,
  resetBtn: factoryResetBtn,
  rotateBtn: factoryRotateBtn,
  toolButtons: factoryToolButtons
});

setupInfoPopups();
setupQuiz();

const energyRequest = fetch('data/energy.json').then((response) => {
  if (!response.ok) {
    throw new Error('Unable to load energy data');
  }
  return response.json();
});

const insightsRequest = fetch('data/insights.json')
  .then((response) => (response.ok ? response.json() : null))
  .catch((error) => {
    console.warn('Cached insights unavailable', error);
    return null;
  });

Promise.all([energyRequest, insightsRequest])
  .then(([payload, insights]) => {
    regions = payload.regions;
    statusEl.textContent = 'Live grid signals updated';
    timestampEl.textContent = `Updated ${new Date(payload.updatedAt).toLocaleTimeString()}`;

    insightsByRegion.clear();
    if (insights && insights.regions) {
      insightsUpdatedAt = insights.updatedAt ?? null;
      Object.entries(insights.regions).forEach(([regionId, record]) => {
        insightsByRegion.set(regionId, record);
      });
    } else {
      insightsUpdatedAt = null;
    }

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
      const isActivePanel = panel.dataset.panel === target;
      panel.hidden = !isActivePanel;
      panel.setAttribute('aria-hidden', String(!isActivePanel));
      panel.classList.toggle('is-active', isActivePanel);
    });
  }
  if (target === DAYLIGHT_TAB_ID) {
    updateDaylight();
  }
}

function setupInfoPopups() {
  const pairs = [
    [factoryInfoButton, factoryInfoPopup],
    [factoryHelpButton, factoryHelpPopup],
  ].filter(([button, popup]) => button && popup);

  if (!pairs.length) return;

  const closePopups = () => {
    pairs.forEach(([button, popup]) => {
      popup.hidden = true;
      button.setAttribute('aria-expanded', 'false');
    });
  };

  pairs.forEach(([button, popup]) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = !popup.hidden;
      closePopups();
      if (!isOpen) {
        popup.hidden = false;
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', (event) => {
    const clickedPair = pairs.some(([button, popup]) =>
      button.contains(event.target) || popup.contains(event.target)
    );
    if (!clickedPair) {
      closePopups();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePopups();
    }
  });
}

function setupQuiz() {
  if (!quizGridEl || !quizInputEl || !quizFeedbackEl) return;

  const defaultGeneration = quizGenerationEl?.value || activeQuizKey;
  applyQuizGeneration(defaultGeneration);

  quizInputEl.addEventListener('input', handleQuizAutoCheck);
  quizInputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      handleQuizSubmit();
    }
  });

  quizResetBtn?.addEventListener('click', resetQuiz);
  quizGenerationEl?.addEventListener('change', (event) => {
    const { value } = event.target;
    applyQuizGeneration(value, { announce: true });
  });
}

function applyQuizGeneration(generationKey, { announce = false } = {}) {
  const generation = QUIZ_GENERATIONS[generationKey] || QUIZ_GENERATIONS.gen1;
  activeQuizKey = generationKey in QUIZ_GENERATIONS ? generationKey : 'gen1';
  activeQuizEntries = generation.entries;
  quizPokemonById = new Map(activeQuizEntries.map((entry) => [entry.id, entry]));
  quizGridOrder = activeQuizEntries.map((entry) => entry.id);
  quizFound.clear();
  quizStartTime = null;
  rebuildQuizLookup();
  renderQuizGrid();
  updateQuizStats();
  quizInputEl.value = '';
  stopQuizTimer();
  updateQuizTimerDisplay(0);
  if (quizTotalEl) quizTotalEl.textContent = String(activeQuizEntries.length);
  if (announce) {
    setQuizFeedback(`Region switched to ${generation.label}.`, 'info');
  } else {
    setQuizFeedback('', '');
  }
}

function rebuildQuizLookup() {
  quizLookup.clear();
  activeQuizEntries.forEach((entry) => {
    if (!entry.name.includes('Nidoran')) {
      const normalizedName = normalizeQuizAnswer(entry.name);
      quizLookup.set(normalizedName, entry.id);
    }
    (entry.aliases || []).forEach((alias) => {
      const normalizedAlias = normalizeQuizAnswer(alias);
      quizLookup.set(normalizedAlias, entry.id);
    });
  });
}

function normalizeQuizAnswer(value) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function handleQuizAutoCheck() {
  const rawValue = quizInputEl.value.trim();
  if (!rawValue) return;

  const normalized = normalizeQuizAnswer(rawValue);

  const pokemonId = quizLookup.get(normalized);
  if (!pokemonId || quizFound.has(pokemonId)) return;

  handleQuizSubmit();
}

function handleQuizSubmit() {
  const rawValue = quizInputEl.value.trim();
  if (!rawValue) return;

  if (!quizStartTime) {
    quizStartTime = Date.now();
    startQuizTimer();
  }

  const normalized = normalizeQuizAnswer(rawValue);
  quizInputEl.value = '';
  quizInputEl.focus();

  const pokemonId = quizLookup.get(normalized);
  if (!pokemonId) {
    setQuizFeedback(`"${rawValue}" is not in this Pokédex.`, 'error');
    updateQuizStats();
    return;
  }

  if (quizFound.has(pokemonId)) {
    return;
  }

  quizFound.add(pokemonId);
  revealQuizEntry(pokemonId);
  updateQuizStats();
  setQuizFeedback(`Caught ${quizPokemonById.get(pokemonId).name}!`, 'success');

  if (quizFound.size === activeQuizEntries.length) {
    setQuizFeedback('Pokédex complete! Legendary memory unlocked.', 'success');
    stopQuizTimer();
  }
}

function renderQuizGrid() {
  quizGridEl.textContent = '';
  quizSlots.clear();
  quizGridOrder.forEach((id) => {
    const entry = quizPokemonById.get(id);
    if (!entry) return;
    const card = document.createElement('div');
    card.className = 'quiz-entry';
    card.dataset.pokemonId = String(entry.id);
    card.innerHTML = `
      <span class="dex-number">#${String(entry.id).padStart(3, '0')}</span>
      <span class="dex-name">???</span>
      <span class="dex-glow" aria-hidden="true"></span>
    `;
    quizGridEl.appendChild(card);
    quizSlots.set(entry.id, card);
    if (quizFound.has(entry.id)) {
      revealQuizEntry(entry.id);
    }
  });
}

function revealQuizEntry(pokemonId) {
  const slot = quizSlots.get(pokemonId);
  if (!slot) return;
  const entry = quizPokemonById.get(pokemonId);
  const nameEl = slot.querySelector('.dex-name');
  if (nameEl) {
    nameEl.textContent = entry ? entry.name : '???';
  }
  slot.classList.add('caught');
}

function updateQuizStats() {
  if (quizCountEl) quizCountEl.textContent = String(quizFound.size);
}

function setQuizFeedback(message, state) {
  quizFeedbackEl.textContent = message;
  quizFeedbackEl.dataset.state = state || '';
}

function resetQuiz() {
  quizFound.clear();
  quizGridOrder = activeQuizEntries.map((entry) => entry.id);
  renderQuizGrid();
  updateQuizStats();
  quizInputEl.value = '';
  setQuizFeedback('Pokédex wiped. New run ready.', 'info');
  stopQuizTimer();
  quizStartTime = null;
  updateQuizTimerDisplay(0);
}

function startQuizTimer() {
  stopQuizTimer();
  quizTimerInterval = window.setInterval(() => {
    if (!quizStartTime) return;
    const elapsed = Date.now() - quizStartTime;
    updateQuizTimerDisplay(elapsed);
  }, 500);
}

function stopQuizTimer() {
  if (quizTimerInterval) {
    clearInterval(quizTimerInterval);
    quizTimerInterval = null;
  }
}

function updateQuizTimerDisplay(elapsedMs) {
  if (!quizTimerEl) return;
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  quizTimerEl.textContent = `${minutes}:${seconds}`;
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

  renderHistoryChart(region.history);
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

function renderHistoryChart(history) {
  tooltipChart.textContent = '';
  if (!Array.isArray(history) || !history.length) {
    return;
  }

  const width = 260;
  const height = 86;
  const balances = history.map((entry) => Number(entry.netBalanceMw) || 0);
  const max = Math.max(...balances, 0);
  const min = Math.min(...balances, 0);
  const range = Math.max(1, max - min || 1);
  const zeroLine = height - ((0 - min) / range) * height;
  const zeroY = Math.max(0, Math.min(height, zeroLine));

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.classList.add('sparkline');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  const baseline = document.createElementNS(SVG_NS, 'line');
  baseline.classList.add('sparkline__baseline');
  baseline.setAttribute('x1', '0');
  baseline.setAttribute('x2', String(width));
  baseline.setAttribute('y1', String(zeroY));
  baseline.setAttribute('y2', String(zeroY));
  svg.append(baseline);

  const points = history.map((entry, index) => {
    const x = history.length === 1 ? width : (index / Math.max(1, history.length - 1)) * width;
    const y = height - ((balances[index] - min) / range) * height;
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  });

  for (let index = 1; index < points.length; index += 1) {
    const prevPoint = points[index - 1];
    const currPoint = points[index];
    const prevValue = balances[index - 1];
    const currValue = balances[index];

    if ((prevValue >= 0 && currValue >= 0) || (prevValue <= 0 && currValue <= 0) || prevValue === currValue) {
      const segment = document.createElementNS(SVG_NS, 'path');
      segment.setAttribute('d', `M ${prevPoint[0]} ${prevPoint[1]} L ${currPoint[0]} ${currPoint[1]}`);
      segment.classList.add('sparkline__segment');
      segment.classList.add(prevValue >= 0 ? 'sparkline__segment--surplus' : 'sparkline__segment--deficit');
      svg.append(segment);
      continue;
    }

    const delta = Math.abs(currValue - prevValue) || 1;
    const proportion = Math.abs(prevValue) / delta;
    const zeroX = prevPoint[0] + (currPoint[0] - prevPoint[0]) * proportion;
    const zeroPoint = [Number(zeroX.toFixed(2)), Number(zeroY.toFixed(2))];

    const first = document.createElementNS(SVG_NS, 'path');
    first.setAttribute('d', `M ${prevPoint[0]} ${prevPoint[1]} L ${zeroPoint[0]} ${zeroPoint[1]}`);
    first.classList.add('sparkline__segment');
    first.classList.add(prevValue >= 0 ? 'sparkline__segment--surplus' : 'sparkline__segment--deficit');
    svg.append(first);

    const second = document.createElementNS(SVG_NS, 'path');
    second.setAttribute('d', `M ${zeroPoint[0]} ${zeroPoint[1]} L ${currPoint[0]} ${currPoint[1]}`);
    second.classList.add('sparkline__segment');
    second.classList.add(currValue >= 0 ? 'sparkline__segment--surplus' : 'sparkline__segment--deficit');
    svg.append(second);
  }

  const lastPoint = points[points.length - 1];
  const lastValue = balances[balances.length - 1];
  const marker = document.createElementNS(SVG_NS, 'circle');
  marker.classList.add('sparkline__marker');
  marker.classList.add(lastValue >= 0 ? 'sparkline__marker--surplus' : 'sparkline__marker--deficit');
  marker.setAttribute('cx', String(lastPoint[0]));
  marker.setAttribute('cy', String(lastPoint[1]));
  marker.setAttribute('r', '3.5');
  svg.append(marker);

  tooltipChart.append(svg);
}

function resetTooltipInsights() {
  tooltipInsights.hidden = true;
  tooltipInsights.classList.remove('loading', 'error');
  tooltipInsightsList.textContent = '';
  tooltipInsightsNote.textContent = '';
}

function prepareTooltipInsights(region) {
  resetTooltipInsights();
  tooltipInsights.hidden = false;

  const record = insightsByRegion.get(region.regionId);
  if (!record) {
    tooltipInsights.classList.add('error');
    const placeholder = document.createElement('li');
    placeholder.innerHTML = '<span class="label">Cached open data unavailable</span>';
    tooltipInsightsList.append(placeholder);
    tooltipInsightsNote.textContent = 'Build pipeline did not provide live insights for this region.';
    if (tooltipAnchor) {
      positionTooltip(tooltipAnchor);
    }
    return;
  }

  renderTooltipInsights(record);
}

function renderTooltipInsights(record) {
  tooltipInsights.classList.remove('loading');
  tooltipInsights.classList.toggle('error', record.status !== 'ok');
  tooltipInsightsList.textContent = '';

  const entries = Array.isArray(record.entries) ? record.entries : [];
  if (entries.length) {
    entries.forEach((entry) => {
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
  } else {
    const empty = document.createElement('li');
    empty.innerHTML = '<span class="label">No supporting data available</span>';
    tooltipInsightsList.append(empty);
  }

  const noteParts = [];
  const updatedAt = record.updatedAt ?? insightsUpdatedAt;
  if (updatedAt) {
    noteParts.push(`Last updated ${formatInsightTimestamp(updatedAt)}`);
  }
  if (Array.isArray(record.sources) && record.sources.length) {
    noteParts.push(`Sources: ${record.sources.join(' • ')}`);
  }
  if (record.status !== 'ok') {
    noteParts.push(record.error || 'Open data feeds were unavailable; showing modelled metrics.');
  }
  tooltipInsightsNote.textContent = noteParts.join(' • ') || 'Open datasets did not return contextual readings for this region.';

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

function updateDaylight() {
  if (!daylightDial || !sunriseTimeEl || !sunsetTimeEl || !daylightLengthEl || !daylightStatusEl) {
    return;
  }

  const now = new Date();
  const zonedNow = getZonedDateParts(now, OSLO_TIME_ZONE);
  if (!zonedNow) {
    daylightDial.style.setProperty('--hour-angle', '0deg');
    daylightDial.style.setProperty('--minute-angle', '0deg');
    daylightDial.style.setProperty('--second-angle', '0deg');
    return;
  }

  const hourAngle = ((zonedNow.hours % 12) + zonedNow.minutes / 60 + zonedNow.seconds / 3600) * 30;
  const minuteAngle = (zonedNow.minutes + zonedNow.seconds / 60) * 6;
  const secondAngle = zonedNow.seconds * 6;
  daylightDial.style.setProperty('--hour-angle', `${hourAngle}deg`);
  daylightDial.style.setProperty('--minute-angle', `${minuteAngle}deg`);
  daylightDial.style.setProperty('--second-angle', `${secondAngle}deg`);

  const baseDate = new Date(Date.UTC(zonedNow.year, zonedNow.month - 1, zonedNow.day, 12));
  const sunTimes = computeSunTimes(baseDate, OSLO_COORDS.latitude, OSLO_COORDS.longitude);

  if (!Number.isFinite(sunTimes.sunrise.getTime()) || !Number.isFinite(sunTimes.sunset.getTime())) {
    sunriseTimeEl.textContent = '—';
    sunsetTimeEl.textContent = '—';
    daylightLengthEl.textContent = '—';
    daylightStatusEl.textContent = 'Daylight data unavailable for today.';
    daylightDial.style.setProperty('--daylight-start', '0deg');
    daylightDial.style.setProperty('--sunrise-end', '0deg');
    daylightDial.style.setProperty('--sunset-start', '0deg');
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
  const secondsOnDial = 12 * 60 * 60;

  const daylightSeconds = Math.max(0, Math.round((sunTimes.sunset - sunTimes.sunrise) / 1000));
  daylightLengthEl.textContent = formatDuration(daylightSeconds);

  const normalizeSeconds = (value) => ((value % secondsInDay) + secondsInDay) % secondsInDay;
  const toDialAngle = (value) => (value / secondsOnDial) * 360;
  const ensureForwardProgress = (angle, previous) => {
    let result = angle;
    while (result < previous) {
      result += 360;
    }
    return result;
  };

  const sunriseSecondsNormalized = normalizeSeconds(sunriseSeconds);
  let sunsetSecondsAdjusted = normalizeSeconds(sunsetSeconds);
  if (sunsetSecondsAdjusted <= sunriseSecondsNormalized) {
    sunsetSecondsAdjusted += secondsInDay;
  }

  const transitionSeconds = Math.min(3600, Math.max(0, daylightSeconds / 2));
  const sunriseTransitionEndSeconds = Math.min(sunsetSecondsAdjusted, sunriseSecondsNormalized + transitionSeconds);
  const sunsetTransitionStartSeconds = Math.max(sunriseSecondsNormalized, sunsetSecondsAdjusted - transitionSeconds);

  const sunriseAngle = toDialAngle(sunriseSecondsNormalized);
  const sunriseTransitionEndAngle = ensureForwardProgress(toDialAngle(sunriseTransitionEndSeconds), sunriseAngle);
  const sunsetTransitionStartAngle = ensureForwardProgress(toDialAngle(sunsetTransitionStartSeconds), sunriseTransitionEndAngle);
  const sunsetAngle = ensureForwardProgress(toDialAngle(sunsetSecondsAdjusted), sunsetTransitionStartAngle);

  let nowAngle = toDialAngle(normalizeSeconds(nowSeconds));
  if (sunsetAngle > 360 && nowAngle < sunriseAngle) {
    nowAngle += 360;
  }

  daylightDial.style.setProperty('--daylight-start', `${sunriseAngle}deg`);
  daylightDial.style.setProperty('--sunrise-end', `${sunriseTransitionEndAngle}deg`);
  daylightDial.style.setProperty('--sunset-start', `${sunsetTransitionStartAngle}deg`);
  daylightDial.style.setProperty('--daylight-end', `${sunsetAngle}deg`);
  daylightDial.style.setProperty('--sun-angle', `${nowAngle}deg`);

  const skyColors = resolveDialSkyColors({
    nowSeconds,
    sunriseSeconds: sunriseSecondsNormalized,
    sunsetSeconds: sunsetSecondsAdjusted,
    secondsInDay
  });

  daylightDial.style.setProperty('--dial-sky-inner', skyColors.inner);
  daylightDial.style.setProperty('--dial-sky-outer', skyColors.outer);

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

function resolveDialSkyColors({ nowSeconds, sunriseSeconds, sunsetSeconds, secondsInDay }) {
  const transition = SKY_TRANSITION_SECONDS;
  let sunriseStart = sunriseSeconds - transition;
  let sunriseEnd = sunriseSeconds + transition;
  let sunsetStart = sunsetSeconds - transition;
  let sunsetEnd = sunsetSeconds + transition;
  let current = nowSeconds;

  if (current < sunriseStart) {
    current += secondsInDay;
    sunriseStart += secondsInDay;
    sunriseSeconds += secondsInDay;
    sunriseEnd += secondsInDay;
    sunsetStart += secondsInDay;
    sunsetSeconds += secondsInDay;
    sunsetEnd += secondsInDay;
  }

  const segments = [
    { start: sunriseStart, end: sunriseSeconds, from: SKY_COLORS.night, to: SKY_COLORS.sunrise },
    { start: sunriseSeconds, end: sunriseEnd, from: SKY_COLORS.sunrise, to: SKY_COLORS.day },
    { start: sunriseEnd, end: sunsetStart, solid: SKY_COLORS.day },
    { start: sunsetStart, end: sunsetSeconds, from: SKY_COLORS.day, to: SKY_COLORS.sunset },
    { start: sunsetSeconds, end: sunsetEnd, from: SKY_COLORS.sunset, to: SKY_COLORS.night }
  ];

  let base = SKY_COLORS.night;
  for (const segment of segments) {
    if (current >= segment.start && current <= segment.end) {
      if (segment.solid) {
        base = segment.solid;
      } else {
        const progress = Math.min(1, Math.max(0, (current - segment.start) / (segment.end - segment.start)));
        base = mixColors(segment.from, segment.to, progress);
      }
      break;
    }
  }

  const inner = toRgbString(mixColors(base, [255, 255, 255], 0.15));
  const outer = toRgbString(mixColors(base, [0, 0, 0], 0.2));
  return { inner, outer };
}

function updateTodayDate() {
  if (!todayDateEl) {
    return;
  }

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  todayDateEl.textContent = formatter.format(now);
  todayDateEl.setAttribute('datetime', now.toISOString().split('T')[0]);
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

function mixColors(start, end, amount) {
  const clamped = Math.min(1, Math.max(0, amount));
  return start.map((value, index) => Math.round(value + (end[index] - value) * clamped));
}

function toRgbString(color) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function formatInsightTimestamp(value) {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value ?? '');
    }
    const formatter = new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    return formatter.format(date);
  } catch (error) {
    console.error('Unable to format insight timestamp', error);
    return String(value ?? '');
  }
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
