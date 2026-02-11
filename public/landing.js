const STORAGE_KEYS = {
  stats: 'oePrototypeStats',
  quiz: 'oeQuizProgress',
  lockbox: 'oeLockboxState'
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function emptyStats() {
  return {
    views: { quiz: 0, factory: 0, grid: 0, daylight: 0, lockbox: 0 },
    totalViews: 0,
    factoryWins: 0,
    lockboxUnlocks: 0,
    quizCompletions: 0,
    cardClicks: { quiz: 0, factory: 0, grid: 0, daylight: 0, lockbox: 0 }
  };
}

function hydrateStats() {
  const base = emptyStats();
  const stored = readJson(STORAGE_KEYS.stats, {});
  return {
    ...base,
    ...stored,
    views: { ...base.views, ...(stored.views || {}) },
    cardClicks: { ...base.cardClicks, ...(stored.cardClicks || {}) }
  };
}

function renderStats() {
  const stats = hydrateStats();
  const quiz = readJson(STORAGE_KEYS.quiz, { foundByGeneration: {} });
  const lockbox = readJson(STORAGE_KEYS.lockbox, { unlocked: false });

  const discovered = Object.values(quiz.foundByGeneration || {}).reduce((sum, list) => sum + (list?.length || 0), 0);
  const totalPokemon = 151 + 100 + 135;
  const quizPercent = Math.round((Math.min(discovered, totalPokemon) / totalPokemon) * 100);

  setStat('totalViews', String(stats.totalViews || 0));
  setStat('quizProgress', `${quizPercent}%`);
  setStat('factoryWins', String(stats.factoryWins || 0));
  setStat('lockboxUnlocked', lockbox.unlocked ? 'Yes' : 'No');
}

function setStat(name, value) {
  const node = document.querySelector(`[data-stat="${name}"]`);
  if (node) node.textContent = value;
}

function bindCardTracking() {
  document.querySelectorAll('[data-track]').forEach((node) => {
    node.addEventListener('click', () => {
      const key = node.getAttribute('data-track');
      if (!key) return;
      const stats = hydrateStats();
      stats.cardClicks[key] = (stats.cardClicks[key] || 0) + 1;
      writeJson(STORAGE_KEYS.stats, stats);
    });
  });
}

bindCardTracking();
renderStats();
