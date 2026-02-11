const FACTORY_GRID_SIZE = 6;
const FACTORY_DIRECTIONS = ['up', 'right', 'down', 'left'];
const FACTORY_DIRECTION_VECTORS = {
  up: { dx: 0, dy: -1, label: '↑' },
  right: { dx: 1, dy: 0, label: '→' },
  down: { dx: 0, dy: 1, label: '↓' },
  left: { dx: -1, dy: 0, label: '←' }
};
const FACTORY_PROCESSING = {
  ironOre: 'ironPlate',
  copperOre: 'wire'
};
const FACTORY_SIMPLE_ITEMS = ['ironPlate', 'wire'];
const FACTORY_STORAGE_KEY = 'oeFactoryProgress';

export function setupFactoryBuilder(elements) {
  const {
    gridEl,
    statusEl,
    targetEl,
    tickEl,
    collectorEl,
    directionLabel,
    newLevelBtn,
    startBtn,
    stepBtn,
    resetBtn,
    rotateBtn,
    toolButtons = []
  } = elements;

  if (!gridEl || !statusEl || !targetEl || !tickEl || !collectorEl || !directionLabel) {
    return;
  }

  let factoryLevel = null;
  let factoryState = null;

  function readProgress() {
    try {
      const raw = localStorage.getItem(FACTORY_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveProgress() {
    if (!factoryState || !factoryLevel) return;
    try {
      localStorage.setItem(
        FACTORY_STORAGE_KEY,
        JSON.stringify({ level: factoryLevel, state: factoryState, placement: factoryPlacement, savedAt: Date.now() })
      );
    } catch {
      // ignore
    }
  }
  let factoryInterval = null;
  const factoryPlacement = { tool: 'conveyor', direction: 'right' };
  const factoryCellElements = [];

  renderFactoryGrid();
  bindFactoryControls();

  const restored = readProgress();
  if (restored?.level?.grid && restored?.state?.grid) {
    factoryLevel = { grid: cloneFactoryGrid(restored.level.grid), target: { ...restored.level.target } };
    factoryState = {
      ...restored.state,
      grid: cloneFactoryGrid(restored.state.grid),
      target: { ...restored.state.target },
      collectorCounts: { ...(restored.state.collectorCounts || {}) }
    };
    if (restored.placement?.tool) {
      factoryPlacement.tool = restored.placement.tool;
    }
    if (restored.placement?.direction && FACTORY_DIRECTIONS.includes(restored.placement.direction)) {
      factoryPlacement.direction = restored.placement.direction;
      directionLabel.textContent = factoryPlacement.direction.replace(/^(\w)/, (m) => m.toUpperCase());
    }
    renderFactoryHud('Recovered your previous factory run.');
  } else {
    loadFactoryLevel(generateFactoryLevel());
  }

  function bindFactoryControls() {
    toolButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const tool = button.dataset.tool;
        if (!tool) return;
        selectFactoryTool(tool);
      });
    });

    if (rotateBtn) {
      rotateBtn.addEventListener('click', cycleFactoryDirection);
    }

    if (newLevelBtn) {
      newLevelBtn.addEventListener('click', () => loadFactoryLevel(generateFactoryLevel()));
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', resetFactoryLayout);
    }

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (factoryInterval) {
          stopFactoryLoop();
        } else {
          startFactoryLoop();
        }
      });
    }

    if (stepBtn) {
      stepBtn.addEventListener('click', () => {
        stopFactoryLoop();
        stepFactory();
      });
    }
  }

  function loadFactoryLevel(level) {
    factoryLevel = level;
    factoryState = {
      grid: cloneFactoryGrid(level.grid),
      target: level.target,
      tick: 0,
      completedTick: null,
      collectorCounts: {},
      failed: false,
      won: false
    };
    stopFactoryLoop();
    renderFactoryHud('New level ready — place components, then press Start.');
  }

  function generateFactoryLevel() {
    const grid = createEmptyFactoryGrid();
    const targetItem = FACTORY_SIMPLE_ITEMS[Math.floor(Math.random() * FACTORY_SIMPLE_ITEMS.length)];
    const targetCount = randomInt(5, 20);
    const maxTicks = randomInt(15, 40);

    const collectorPosition = pickRandomEmptyCell(grid);
    grid[collectorPosition.y][collectorPosition.x] = createFactoryCell('collector');

    const spawnerCount = randomInt(1, 2);
    const spawnerItems = targetItem === 'ironPlate' ? ['ironOre', 'ironPlate'] : ['copperOre', 'wire'];
    let usesOre = false;
    const placedSpawners = [];
    for (let index = 0; index < spawnerCount; index += 1) {
      const position = pickRandomEmptyCell(grid);
      const cell = createFactoryCell('spawner');
      cell.itemType = spawnerItems[Math.floor(Math.random() * spawnerItems.length)];
      cell.direction = FACTORY_DIRECTIONS[Math.floor(Math.random() * FACTORY_DIRECTIONS.length)];
      usesOre = usesOre || FACTORY_PROCESSING[cell.itemType];
      grid[position.y][position.x] = cell;
      placedSpawners.push(cell);
    }

    if (!placedSpawners.some((cell) => producesTarget(cell.itemType, targetItem))) {
      placedSpawners[0].itemType = targetItem;
    }

    usesOre = placedSpawners.some((cell) => Boolean(FACTORY_PROCESSING[cell.itemType]));

    let furnacesToPlace = usesOre ? Math.max(1, randomInt(0, 2)) : randomInt(0, 2);
    while (furnacesToPlace > 0) {
      const position = pickRandomEmptyCell(grid);
      const cell = createFactoryCell('furnace');
      cell.direction = FACTORY_DIRECTIONS[Math.floor(Math.random() * FACTORY_DIRECTIONS.length)];
      grid[position.y][position.x] = cell;
      furnacesToPlace -= 1;
    }

    if (Math.random() < 0.5) {
      const position = pickRandomEmptyCell(grid);
      const cell = createFactoryCell('splitter');
      cell.direction = FACTORY_DIRECTIONS[Math.floor(Math.random() * FACTORY_DIRECTIONS.length)];
      grid[position.y][position.x] = cell;
    }

    return {
      grid,
      target: { item: targetItem, count: targetCount, maxTicks }
    };
  }

  function createEmptyFactoryGrid() {
    return Array.from({ length: FACTORY_GRID_SIZE }, () =>
      Array.from({ length: FACTORY_GRID_SIZE }, () => createFactoryCell('empty'))
    );
  }

  function cloneFactoryGrid(grid) {
    return grid.map((row) =>
      row.map((cell) => ({ ...cell, item: cell.item ? { ...cell.item } : null, processing: cell.processing ? { ...cell.processing } : null }))
    );
  }

  function createFactoryCell(type) {
    return {
      type,
      direction: 'right',
      item: null,
      itemType: 'ironOre',
      processing: null,
      nextSide: 'left'
    };
  }

  function pickRandomEmptyCell(grid) {
    const empties = [];
    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell.type === 'empty') {
          empties.push({ x, y });
        }
      });
    });
    if (!empties.length) {
      return { x: 0, y: 0 };
    }
    return empties[Math.floor(Math.random() * empties.length)];
  }

  function renderFactoryGrid() {
    gridEl.textContent = '';
    factoryCellElements.length = 0;
    for (let y = 0; y < FACTORY_GRID_SIZE; y += 1) {
      for (let x = 0; x < FACTORY_GRID_SIZE; x += 1) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'factory-cell';
        cell.dataset.x = String(x);
        cell.dataset.y = String(y);
        cell.setAttribute('role', 'gridcell');
        cell.addEventListener('click', () => handleFactoryCellClick(x, y));
        factoryCellElements.push(cell);
        gridEl.append(cell);
      }
    }
  }

  function renderFactoryHud(statusOverride) {
    if (!factoryState) return;
    updateFactoryCells();
    const target = factoryState.target;
    targetEl.textContent = `${target.count}× ${target.item} · par ${target.maxTicks} ticks`;
    tickEl.textContent = String(factoryState.tick);
    statusEl.textContent = statusOverride || statusEl.textContent || 'Ready.';
    renderCollectorCounts();
    saveProgress();
  }

  function updateFactoryCells() {
    if (!factoryState) return;
    factoryState.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const node = factoryCellElements[y * FACTORY_GRID_SIZE + x];
        if (!node) return;
        node.textContent = '';
        const glyph = document.createElement('div');
        glyph.className = 'glyph';
        glyph.textContent = describeCellGlyph(cell);
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = describeCellLabel(cell);
        node.append(glyph, label);
        if (cell.direction && cell.type !== 'collector' && cell.type !== 'empty') {
          const dir = document.createElement('span');
          dir.className = 'direction-indicator';
          dir.textContent = FACTORY_DIRECTION_VECTORS[cell.direction]?.label || '';
          node.append(dir);
        }
      });
    });
  }

  function describeCellGlyph(cell) {
    if (cell.item) {
      return '⬤';
    }
    switch (cell.type) {
      case 'conveyor':
        return '⇅';
      case 'spawner':
        return '⚙️';
      case 'furnace':
        return '🔥';
      case 'splitter':
        return '⅂';
      case 'collector':
        return '🎯';
      default:
        return '·';
    }
  }

  function describeCellLabel(cell) {
    if (cell.item) {
      return cell.item.type;
    }
    if (cell.type === 'spawner') {
      return `${cell.itemType}`;
    }
    if (cell.type === 'furnace' && cell.processing) {
      return `Processing ${cell.processing.output}`;
    }
    return cell.type;
  }

  function producesTarget(itemType, targetItem) {
    return itemType === targetItem || FACTORY_PROCESSING[itemType] === targetItem;
  }

  function selectFactoryTool(tool) {
    factoryPlacement.tool = tool;
    toolButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.tool === tool);
    });
  }

  function cycleFactoryDirection() {
    const currentIndex = FACTORY_DIRECTIONS.indexOf(factoryPlacement.direction);
    const nextIndex = (currentIndex + 1) % FACTORY_DIRECTIONS.length;
    factoryPlacement.direction = FACTORY_DIRECTIONS[nextIndex];
    directionLabel.textContent = factoryPlacement.direction.replace(/^(\w)/, (m) => m.toUpperCase());
  }

  function handleFactoryCellClick(x, y) {
    if (!factoryState) return;
    const cell = factoryState.grid[y][x];
    const tool = factoryPlacement.tool;

    if (cell.type === 'spawner' && tool !== 'erase') {
      rotateFactoryCell(cell);
      renderFactoryHud();
      return;
    }

    if (tool === 'erase') {
      factoryState.grid[y][x] = createFactoryCell('empty');
    } else if (tool === 'conveyor' || tool === 'furnace' || tool === 'splitter') {
      if (cell.type === tool) {
        rotateFactoryCell(cell);
      } else {
        const next = createFactoryCell(tool);
        next.direction = factoryPlacement.direction;
        factoryState.grid[y][x] = next;
      }
    } else if (tool === 'collector') {
      factoryState.grid[y][x] = createFactoryCell('collector');
    }

    renderFactoryHud();
  }

  function rotateFactoryCell(cell) {
    if (!cell.direction) return;
    const currentIndex = FACTORY_DIRECTIONS.indexOf(cell.direction);
    cell.direction = FACTORY_DIRECTIONS[(currentIndex + 1) % FACTORY_DIRECTIONS.length];
  }

  function resetFactoryLayout() {
    if (!factoryLevel) return;
    stopFactoryLoop();
    factoryState = {
      grid: cloneFactoryGrid(factoryLevel.grid),
      target: { ...factoryLevel.target },
      tick: 0,
      completedTick: null,
      collectorCounts: {},
      failed: false,
      won: false
    };
    renderFactoryHud('Layout reset to the generated puzzle.');
  }

  function startFactoryLoop() {
    if (factoryInterval || !factoryState || factoryState.won || factoryState.failed) return;
    factoryInterval = setInterval(stepFactory, 600);
    if (startBtn) {
      startBtn.textContent = 'Pause';
    }
    statusEl.textContent = 'Simulation running…';
  }

  function stopFactoryLoop() {
    if (factoryInterval) {
      clearInterval(factoryInterval);
      factoryInterval = null;
    }
    if (startBtn) {
      startBtn.textContent = 'Start';
    }
  }

  function stepFactory() {
    if (!factoryState || factoryState.won || factoryState.failed) return;
    simulateFactoryTick();
  }

  function simulateFactoryTick() {
    finishFactoryProcessing();
    spawnFactoryItems();
    startFactoryProcessing();
    applyFactoryMovement();
    factoryState.tick += 1;
    evaluateFactoryOutcome();
    renderFactoryHud();
  }

  function finishFactoryProcessing() {
    factoryState.grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.processing) {
          cell.processing.remaining -= 1;
          if (cell.processing.remaining <= 0 && !cell.item) {
            cell.item = { type: cell.processing.output };
            cell.processing = null;
          }
        }
      });
    });
  }

  function spawnFactoryItems() {
    factoryState.grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type === 'spawner' && !cell.item) {
          cell.item = { type: cell.itemType };
        }
      });
    });
  }

  function startFactoryProcessing() {
    factoryState.grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell.type !== 'furnace') return;
        if (!cell.item || cell.processing) return;
        const output = FACTORY_PROCESSING[cell.item.type];
        if (!output) return;
        cell.processing = { output, remaining: 1 };
        cell.item = null;
      });
    });
  }

  function applyFactoryMovement() {
    const intents = [];

    factoryState.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (!cell.item) return;
        const direction = getMovementDirection(cell);
        if (!direction) return;
        const vector = FACTORY_DIRECTION_VECTORS[direction];
        const target = { x: x + vector.dx, y: y + vector.dy };
        if (target.x < 0 || target.y < 0 || target.x >= FACTORY_GRID_SIZE || target.y >= FACTORY_GRID_SIZE) {
          return;
        }
        const targetCell = factoryState.grid[target.y][target.x];
        if (!canEnterFactoryCell(targetCell)) return;
        intents.push({ from: { x, y }, to: target, item: cell.item, type: cell.type });
        if (cell.type === 'splitter') {
          cell.nextSide = cell.nextSide === 'left' ? 'right' : 'left';
        }
      });
    });

    const destinations = new Map();
    intents.forEach((intent) => {
      const key = `${intent.to.x},${intent.to.y}`;
      if (!destinations.has(key)) {
        destinations.set(key, []);
      }
      destinations.get(key).push(intent);
    });

    destinations.forEach((moves) => {
      if (moves.length === 1) {
        executeFactoryMove(moves[0]);
      }
    });
  }

  function getMovementDirection(cell) {
    if (!cell.item) return null;
    if (cell.type === 'conveyor' || cell.type === 'spawner' || cell.type === 'furnace') {
      return cell.direction;
    }
    if (cell.type === 'splitter') {
      return pickSplitterDirection(cell);
    }
    return null;
  }

  function pickSplitterDirection(cell) {
    if (!cell.direction) return null;
    const index = FACTORY_DIRECTIONS.indexOf(cell.direction);
    const offset = cell.nextSide === 'left' ? -1 : 1;
    const targetIndex = (index + FACTORY_DIRECTIONS.length + offset) % FACTORY_DIRECTIONS.length;
    return FACTORY_DIRECTIONS[targetIndex];
  }

  function canEnterFactoryCell(cell) {
    if (cell.type === 'collector') return true;
    if (cell.type === 'furnace') {
      return !cell.item && !cell.processing;
    }
    return cell.item === null;
  }

  function executeFactoryMove(intent) {
    const { from, to, item } = intent;
    const origin = factoryState.grid[from.y][from.x];
    const destination = factoryState.grid[to.y][to.x];
    origin.item = null;
    if (destination.type === 'collector') {
      incrementCollector(item.type);
      return;
    }
    destination.item = { ...item };
  }

  function incrementCollector(itemType) {
    factoryState.collectorCounts[itemType] = (factoryState.collectorCounts[itemType] || 0) + 1;
  }

  function renderCollectorCounts() {
    collectorEl.textContent = '';
    const entries = Object.entries(factoryState.collectorCounts);
    if (!entries.length) {
      const empty = document.createElement('li');
      empty.textContent = 'None yet';
      collectorEl.append(empty);
      return;
    }
    entries.forEach(([item, count]) => {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = item;
      const value = document.createElement('span');
      value.className = 'value';
      value.textContent = String(count);
      li.append(label, value);
      collectorEl.append(li);
    });
  }

  function evaluateFactoryOutcome() {
    const { item, count, maxTicks } = factoryState.target;
    const collected = factoryState.collectorCounts[item] || 0;
    if (collected >= count) {
      factoryState.won = true;
      factoryState.completedTick = factoryState.tick;
      stopFactoryLoop();
      const parResult = factoryState.completedTick <= maxTicks ? 'You met the par pace.' : 'Over par, but victory nonetheless!';
      statusEl.textContent = `Victory! Delivered the target in ${factoryState.completedTick} ticks. ${parResult}`;
      window.dispatchEvent(new CustomEvent('oe:factory-win'));
      return;
    }
    if (factoryState.tick > maxTicks && !factoryState.failed) {
      statusEl.textContent = 'Par exceeded — keep iterating to finish the build.';
    }
  }

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
