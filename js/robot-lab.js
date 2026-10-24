import { arStrings } from './i18n/ar.js';
import { getLevelById, listLevelIds } from './levels/level-registry.js';
import { validateLevelData } from './levels/level-validator.js';

const statusElement = document.querySelector('#status');
const playButton = document.querySelector('#play-button');
const stopButton = document.querySelector('#stop-button');
const resetButton = document.querySelector('#reset-button');
const blockListElement = document.querySelector('#block-list');
const worldGridElement = document.querySelector('#world-grid');
const levelHintElement = document.querySelector('#level-hint');
const successConditionElement = document.querySelector('#success-condition');
const levelIndicatorElement = document.querySelector('#level-indicator');

const playableLevelIds = listLevelIds().filter((levelId) => levelId !== 'broken-level');
let activeRunToken = 0;
let blockButtons = [];

const fallbackLevel = {
  id: 'fallback-safe-level',
  title: 'مستوى آمن',
  grid: {
    rows: 3,
    columns: 3
  },
  robot: {
    row: 0,
    column: 0,
    direction: 'east'
  },
  goals: [{ row: 2, column: 2, type: 'star' }],
  obstacles: [],
  availableBlocks: ['moveForward', 'turnRight', 'turnLeft'],
  successConditions: {
    reachGoal: true,
    collectAllGoals: true
  },
  hints: [arStrings.levelMeta.defaultHint]
};

const statusByState = arStrings.status;

function setStatus(state) {
  statusElement.dataset.state = state;
  statusElement.textContent = statusByState[state];
}

function setSelectedBlock(selectedButton) {
  for (const button of blockButtons) {
    button.dataset.selected = button === selectedButton ? 'true' : 'false';
  }
  statusElement.dataset.state = 'idle';
  statusElement.textContent = `${statusByState.blockSelectedPrefix} ${selectedButton.textContent}`;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function describeSuccessCondition(level) {
  const needsAllGoals = Boolean(level.successConditions.collectAllGoals);
  if (needsAllGoals) {
    return arStrings.levelMeta.defaultSuccess;
  }
  return 'الهدف: وصل إلى الهدف المحدد.';
}

function getActiveLevelId() {
  const requestedLevelId = new URLSearchParams(window.location.search).get('level');
  return requestedLevelId && requestedLevelId.length > 0 ? requestedLevelId : 'level-001';
}

function resolveLevel(levelId) {
  const level = getLevelById(levelId);
  if (!level) {
    return { level: fallbackLevel, usedFallback: true };
  }

  const validation = validateLevelData(level);
  if (!validation.isValid) {
    return { level: fallbackLevel, usedFallback: true };
  }

  return { level, usedFallback: false };
}

function renderWorldGrid(level) {
  worldGridElement.style.gridTemplateColumns = `repeat(${level.grid.columns}, minmax(36px, 1fr))`;
  const cells = [];

  const goalKey = new Set(level.goals.map((goal) => `${goal.row}-${goal.column}`));
  const obstacleKey = new Set(level.obstacles.map((obstacle) => `${obstacle.row}-${obstacle.column}`));
  const robotKey = `${level.robot.row}-${level.robot.column}`;

  for (let row = 0; row < level.grid.rows; row += 1) {
    for (let column = 0; column < level.grid.columns; column += 1) {
      const cellElement = document.createElement('span');
      cellElement.classList.add('cell');
      const key = `${row}-${column}`;

      if (key === robotKey) {
        cellElement.classList.add('robot');
        cellElement.textContent = '🤖';
      } else if (goalKey.has(key)) {
        cellElement.classList.add('target');
        cellElement.textContent = '⭐';
      } else if (obstacleKey.has(key)) {
        cellElement.classList.add('wall');
        cellElement.textContent = '⬛';
      }

      cells.push(cellElement);
    }
  }

  worldGridElement.replaceChildren(...cells);
}

function createBlockButton(blockType) {
  const button = document.createElement('button');
  button.type = 'button';
  button.id = `block-${blockType}`;
  button.classList.add('block-item');
  button.textContent = arStrings.blockArea.labelsByType[blockType] ?? blockType;
  button.addEventListener('click', () => {
    setSelectedBlock(button);
  });
  return button;
}

function renderAvailableBlocks(level) {
  blockButtons = level.availableBlocks.map((blockType) => createBlockButton(blockType));
  blockListElement.replaceChildren(...blockButtons);
}

function renderLevelMeta(level) {
  const firstHint = level.hints[0] ?? arStrings.levelMeta.defaultHint;
  levelHintElement.textContent = `${arStrings.levelMeta.hintPrefix} ${firstHint}`;
  successConditionElement.textContent = describeSuccessCondition(level);
}

function updateLevelIndicator(levelId) {
  const levelIndex = playableLevelIds.indexOf(levelId);
  if (levelIndex >= 0) {
    levelIndicatorElement.textContent = `المستوى ${levelIndex + 1}/${playableLevelIds.length}`;
    return;
  }
  levelIndicatorElement.textContent = arStrings.levelIndicator;
}

async function runRobotSession(runToken) {
  setStatus('running');
  await delay(120);
  if (runToken !== activeRunToken) {
    return;
  }
  setStatus('complete');
}

function applyStaticLabels() {
  document.title = arStrings.pageTitle;
  document.querySelector('#app-heading').textContent = arStrings.heading;
  document.querySelector('#start-button').textContent = arStrings.primaryActions.start;
  document.querySelector('#continue-button').textContent = arStrings.primaryActions.continue;
  document.querySelector('#parents-button').textContent = arStrings.primaryActions.parents;
  document.querySelector('#world-heading').textContent = arStrings.world.heading;
  document.querySelector('#block-area-heading').textContent = arStrings.blockArea.heading;
  document.querySelector('#movement-heading').textContent = arStrings.movementGuideHeading;
  document.querySelector('#move-forward-label').textContent = arStrings.movement.forward;
  document.querySelector('#turn-right-label').textContent = arStrings.movement.right;
  document.querySelector('#turn-left-label').textContent = arStrings.movement.left;
  playButton.textContent = arStrings.controls.play;
  stopButton.textContent = arStrings.controls.stop;
  resetButton.textContent = arStrings.controls.reset;
}

function initializeLevel() {
  const levelId = getActiveLevelId();
  const { level, usedFallback } = resolveLevel(levelId);
  updateLevelIndicator(level.id);
  renderWorldGrid(level);
  renderAvailableBlocks(level);
  renderLevelMeta(level);
  setStatus(usedFallback ? 'fallback' : 'idle');
}

playButton.addEventListener('click', () => {
  activeRunToken += 1;
  void runRobotSession(activeRunToken);
});

stopButton.addEventListener('click', () => {
  activeRunToken += 1;
  setStatus('stopped');
});

resetButton.addEventListener('click', () => {
  activeRunToken += 1;
  setStatus('reset');
});

applyStaticLabels();
initializeLevel();
