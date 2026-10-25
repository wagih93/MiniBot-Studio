import { arStrings } from './shared/i18n/ar.js';
import {
  getLevelById,
  listLevelIds,
  validateLevelData
} from './features/levels/index.js';
import { createRobotState } from './features/robot-simulation/index.js';
import {
  createLocalStorageProgramRepository,
  createLocalStorageProgressRepository
} from './features/learning-progress/index.js';
import {
  createProgramEditor,
  createProgramWorkspaceView
} from './features/program-editing/index.js';
import {
  compileProgram,
  createObjectiveProgress,
  getCollectedCollectibleCount,
  isCollectibleCollected,
  runProgram
} from './features/program-execution/index.js';
import { createConsoleLogger, reportRuntimeError } from './features/shell/index.js';
import { createDefaultRuntimeConfig } from './runtime-config.js';

const statusElement = document.querySelector('#status');
const startButton = document.querySelector('#start-button');
const continueButton = document.querySelector('#continue-button');
const parentsButton = document.querySelector('#parents-button');
const playButton = document.querySelector('#play-button');
const stopButton = document.querySelector('#stop-button');
const resetButton = document.querySelector('#reset-button');
const blockListElement = document.querySelector('#block-list');
const programWorkspaceElement = document.querySelector('#program-workspace');
const programListElement = document.querySelector('#program-list');
const programDemoElement = document.querySelector('#program-demo');
const levelErrorElement = document.querySelector('#level-error');
const levelErrorMessageElement = document.querySelector('#level-error-message');
const retryLevelButton = document.querySelector('#retry-level-button');
const returnHomeButton = document.querySelector('#return-home-button');
const saveProgramButton = document.querySelector('#save-program-button');
const worldGridElement = document.querySelector('#world-grid');
const collectionSummaryElement = document.querySelector('#collection-summary');
const levelHintElement = document.querySelector('#level-hint');
const objectiveConditionElement = document.querySelector('#success-condition');
const levelIndicatorElement = document.querySelector('#level-indicator');
const defaultRuntimeConfig = createDefaultRuntimeConfig();

const playableLevelIds = listLevelIds();
const statusByState = arStrings.status;
const directionSymbolByName = {
  north: '↑',
  east: '→',
  south: '↓',
  west: '←'
};

const fallbackLevel = {
  id: 'fallback-safe-level',
  title: arStrings.levelMeta.fallbackLevelTitle,
  grid: {
    rows: 3,
    columns: 3
  },
  robot: {
    row: 0,
    column: 0,
    direction: 'east'
  },
  collectibles: [{ row: 2, column: 2, type: 'star' }],
  obstacles: [],
  availableBlocks: ['moveForward', 'turnRight', 'turnLeft'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  hints: [arStrings.levelMeta.defaultHint]
};
const defaultExecutionConfig = {
  maxStepsPerRun: 12,
  repeatSelectedBlockCount: 1,
  stepDelayMilliseconds: 220
};
const progressRepository = createLocalStorageProgressRepository({
  allowedLevelIds: playableLevelIds
});
const programRepository = createLocalStorageProgramRepository({
  allowedLevelIds: playableLevelIds
});

let activeRunToken = 0;
let activeRunController = null;
let blockButtons = [];
let selectedBlockType = null;
let activeLevel = fallbackLevel;
let robotState = createRobotState(fallbackLevel.robot);
let objectiveProgress = createObjectiveProgress(fallbackLevel);
let isRunInProgress = false;
let runtimeConfig = defaultRuntimeConfig;
let runtimeLogger = createConsoleLogger();
let runtimeErrorListenersAttached = false;
let hasInitialized = false;
let currentRequestedLevelId = defaultRuntimeConfig.initialLevelId;
const programEditor = createProgramEditor(fallbackLevel.availableBlocks);
const programWorkspaceView = createProgramWorkspaceView({
  programWorkspaceElement,
  programListElement,
  programDemoElement,
  getProgramEditor: () => programEditor,
  getBlockPresentation,
  deleteStepLabel: arStrings.controls.deleteStep,
  emptyProgramLabel: arStrings.blockArea.emptyProgram,
  isRunInProgress: () => isRunInProgress,
  isFirstLevel: () => activeLevel.id === 'level-001',
  onInvalidDrop: () => setStatus('invalidDrop'),
  onProgramChanged: () => setStatus('programUpdated'),
  onProgramRemoved: () => setStatus('programRemoved'),
  onProgramReordered: () => setStatus('programReordered')
});

function setStatus(state) {
  statusElement.dataset.state = state;
  statusElement.textContent = statusByState[state];
}

function createAbortError() {
  const abortError = new Error('Execution cancelled');
  abortError.name = 'AbortError';
  return abortError;
}

function delay(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeoutId = setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
      resolve();
    }, milliseconds);

    function handleAbort() {
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', handleAbort);
      reject(createAbortError());
    }

    if (signal) {
      signal.addEventListener('abort', handleAbort, { once: true });
    }
  });
}

function describeSuccessCondition(level) {
  const needsAllCollectibles = Boolean(level.successConditions.collectAllCollectibles);
  if (needsAllCollectibles) {
    return arStrings.levelMeta.defaultSuccess;
  }
  return `${arStrings.levelMeta.successPrefix} ${arStrings.levelMeta.reachGoalSuccess}`;
}

function readSavedProgressLevelId() {
  return progressRepository.loadSavedLevelId();
}

function saveProgressLevelId(levelId) {
  progressRepository.saveSavedLevelId(levelId);
}

function readBoundedIntegerOverride(rawValue, fallback, min, max) {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return fallback;
  }

  const parsedValue = Number.parseInt(String(rawValue), 10);
  if (!Number.isInteger(parsedValue)) {
    return fallback;
  }

  if (parsedValue < min || parsedValue > max) {
    return fallback;
  }

  return parsedValue;
}

function getExecutionConfig(level) {
  const configuredMaxSteps = level.executionLimits?.maxStepsPerRun;
  const maxStepsFallback = Number.isInteger(configuredMaxSteps) && configuredMaxSteps > 0
    ? configuredMaxSteps
    : defaultExecutionConfig.maxStepsPerRun;
  const executionOverrides = runtimeConfig.executionOverrides ?? {};

  return {
    maxStepsPerRun: readBoundedIntegerOverride(
      executionOverrides.maximumStepsPerRun,
      maxStepsFallback,
      1,
      300
    ),
    repeatSelectedBlockCount: readBoundedIntegerOverride(
      executionOverrides.selectedBlockRepeatCount,
      defaultExecutionConfig.repeatSelectedBlockCount,
      1,
      300
    ),
    stepDelayMilliseconds: readBoundedIntegerOverride(
      executionOverrides.stepDelayMilliseconds,
      defaultExecutionConfig.stepDelayMilliseconds,
      0,
      500
    )
  };
}

function logRuntimeWarning(message, details) {
  if (!runtimeLogger || typeof runtimeLogger.warn !== 'function') {
    return;
  }

  runtimeLogger.warn({
    code: 'runtime.warning',
    message,
    ...details
  });
}

function handleUnexpectedRuntimeError(error, context) {
  const safeMessage = error instanceof Error ? error.message : String(error ?? 'unknown-error');
  reportRuntimeError(runtimeLogger, {
    context,
    message: safeMessage
  });
  setStatus('unexpectedError');
}

function attachRuntimeErrorListeners() {
  if (runtimeErrorListenersAttached) {
    return;
  }

  window.addEventListener('error', (event) => {
    handleUnexpectedRuntimeError(event.error ?? event.message, 'window.error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    handleUnexpectedRuntimeError(event.reason, 'window.unhandledrejection');
    event.preventDefault();
  });

  runtimeErrorListenersAttached = true;
}

function resolveLevel(levelId) {
  const overrideLevel = Array.isArray(runtimeConfig.levelOverrides)
    ? runtimeConfig.levelOverrides.find((level) => level.id === levelId)
    : null;
  const level = overrideLevel ?? getLevelById(levelId);
  if (!level) {
    logRuntimeWarning('Requested level not found.', { levelId });
    return { level: fallbackLevel, usedFallback: true, errorType: 'missing' };
  }

  const validation = validateLevelData(level);
  if (!validation.isValid) {
    logRuntimeWarning('Level validation failed.', {
      levelId,
      errors: validation.errors
    });
    return { level: fallbackLevel, usedFallback: true, errorType: 'invalid' };
  }

  return { level, usedFallback: false, errorType: null };
}

function hideLevelError() {
  levelErrorElement.hidden = true;
  levelErrorMessageElement.textContent = '';
}

function showLevelError() {
  levelErrorElement.hidden = false;
  levelErrorMessageElement.textContent =
    `${arStrings.levelError.fallbackMessage} ${arStrings.levelError.retryHint}`;
}

function isRobotCell(robot, row, column) {
  return robot.row === row && robot.column === column;
}

function isCollectibleCell(level, row, column) {
  const collectibles = Array.isArray(level.collectibles) ? level.collectibles : [];
  return collectibles.some((collectible) => collectible.row === row && collectible.column === column);
}

function isObstacleCell(level, row, column) {
  return level.obstacles.some((obstacle) => obstacle.row === row && obstacle.column === column);
}

function getBlockPresentation(blockType) {
  return {
    label: arStrings.blockArea.labelsByType[blockType] ?? blockType,
    icon: arStrings.blockArea.iconsByType?.[blockType] ?? '⬜'
  };
}

function renderWorldGrid(level, robot, robotAnimation = null) {
  worldGridElement.style.gridTemplateColumns = `repeat(${level.grid.columns}, minmax(36px, 1fr))`;
  const cells = [];

  for (let row = 0; row < level.grid.rows; row += 1) {
    for (let column = 0; column < level.grid.columns; column += 1) {
      const cellElement = document.createElement('span');
      cellElement.classList.add('cell');
      cellElement.dataset.row = String(row);
      cellElement.dataset.column = String(column);

      if (isRobotCell(robot, row, column)) {
        cellElement.classList.add('robot');
        cellElement.dataset.direction = robot.direction;
        cellElement.textContent = `🤖 ${directionSymbolByName[robot.direction] ?? ''}`;

        if (robotAnimation && robotAnimation.row === row && robotAnimation.column === column) {
          if (robotAnimation.kind === 'move') {
            cellElement.classList.add(`moving-${robotAnimation.direction}`);
          }
          if (robotAnimation.kind === 'turn') {
            cellElement.classList.add(`rotating-${robotAnimation.turnDirection}`);
          }
        }
      } else if (isCollectibleCell(level, row, column)) {
        const collected = isCollectibleCollected(objectiveProgress, row, column);
        cellElement.classList.add(collected ? 'target-collected' : 'target');
        cellElement.textContent = collected ? '✨' : '⭐';
      } else if (isObstacleCell(level, row, column)) {
        cellElement.classList.add('wall');
        cellElement.textContent = '⬛';
      }

      cells.push(cellElement);
    }
  }

  worldGridElement.replaceChildren(...cells);
}

function updateCollectionSummary() {
  const collectedCount = getCollectedCollectibleCount(objectiveProgress);
  collectionSummaryElement.textContent =
    `${arStrings.levelMeta.collectionPrefix} ${collectedCount}/${objectiveProgress.totalCollectibles}`;
}

function setActiveProgramStep(stepId) {
  if (programEditor.getActiveProgramStepId() === stepId) {
    return;
  }
  programEditor.setActiveProgramStep(stepId);
  programWorkspaceView.render();
}

function renderProgramWorkspace() {
  programWorkspaceView.render();
}

function resetProgramWorkspace() {
  programEditor.reset();
  renderProgramWorkspace();
}

function addProgramStep(blockType, insertIndex = programEditor.getProgramSteps().length) {
  const wasAdded = programEditor.addProgramStep(blockType, insertIndex);
  if (!wasAdded) {
    setStatus('invalidDrop');
    return false;
  }

  renderProgramWorkspace();
  setStatus('programUpdated');
  return true;
}

function removeProgramStep(stepId) {
  const wasRemoved = programEditor.removeProgramStep(stepId);
  if (!wasRemoved) {
    return false;
  }

  renderProgramWorkspace();
  setStatus('programRemoved');
  return true;
}

function moveProgramStep(stepId, insertIndex) {
  const wasMoved = programEditor.moveProgramStep(stepId, insertIndex);
  if (!wasMoved) {
    setStatus('invalidDrop');
    return false;
  }

  renderProgramWorkspace();
  setStatus('programReordered');
  return true;
}

function saveCurrentProgramForLevel(levelId) {
  const blockTypes = programEditor.getProgramBlockTypes();
  const wasSaved = programRepository.saveProgram(levelId, blockTypes);
  if (wasSaved) {
    setStatus('programSaved');
  } else {
    setStatus('programLoadFailed');
  }

  return wasSaved;
}

function restoreProgramForLevel(levelId) {
  const { blockTypes: savedProgram, failed } = programRepository.loadProgram(levelId);
  if (!Array.isArray(savedProgram) || savedProgram.length === 0) {
    return { restored: false, failed };
  }

  const restoredBlocks = savedProgram.filter((blockType) => activeLevel.availableBlocks.includes(blockType));
  if (restoredBlocks.length === 0) {
    return { restored: false, failed };
  }

  const wasRestored = programEditor.restoreProgram(restoredBlocks);
  if (!wasRestored) {
    return { restored: false, failed };
  }

  renderProgramWorkspace();
  return { restored: true, failed: false };
}

function clearSelectedBlocks() {
  for (const button of blockButtons) {
    button.dataset.selected = 'false';
  }
}

function syncPrimaryActions() {
  const hasSavedProgress = readSavedProgressLevelId() !== null;
  continueButton.hidden = !hasSavedProgress;
  startButton.disabled = isRunInProgress;
  continueButton.disabled = isRunInProgress || !hasSavedProgress;
  parentsButton.disabled = isRunInProgress;
}

function setProgramEditingEnabled(enabled) {
  playButton.disabled = !enabled;
  retryLevelButton.disabled = !enabled;
  returnHomeButton.disabled = !enabled;
  saveProgramButton.disabled = !enabled;
  for (const button of blockButtons) {
    button.disabled = !enabled;
  }
  for (const removeButton of programListElement.querySelectorAll('.program-step__remove')) {
    removeButton.disabled = !enabled;
  }
  programWorkspaceElement.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  syncPrimaryActions();
}

function setSelectedBlock(button, blockType) {
  clearSelectedBlocks();
  button.dataset.selected = 'true';
  selectedBlockType = blockType;
  const selectedLabel = button.dataset.label ?? button.textContent;
  statusElement.dataset.state = 'idle';
  statusElement.textContent = `${statusByState.blockSelectedPrefix} ${selectedLabel}`;
}

function createBlockButton(blockType) {
  const blockLabel = arStrings.blockArea.labelsByType[blockType] ?? blockType;
  const blockIcon = arStrings.blockArea.iconsByType?.[blockType] ?? '⬜';
  let lastPointerType = 'mouse';
  const button = document.createElement('button');
  button.type = 'button';
  button.id = `block-${blockType}`;
  button.classList.add('block-item', `block-item--${blockType}`);
  button.draggable = true;
  button.dataset.label = blockLabel;
  button.dataset.blockType = blockType;
  button.setAttribute('aria-label', blockLabel);
  button.dataset.selected = 'false';

  const icon = document.createElement('span');
  icon.classList.add('block-item__icon');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = blockIcon;

  const label = document.createElement('span');
  label.classList.add('block-item__label');
  label.textContent = blockLabel;

  button.append(icon, label);
  button.addEventListener('pointerdown', (event) => {
    lastPointerType = event.pointerType;
  });
  button.addEventListener('click', () => {
    setSelectedBlock(button, blockType);
    if (lastPointerType === 'touch') {
      addProgramStep(blockType);
    }
  });
  button.addEventListener('dragstart', (event) => {
    programEditor.setProgramInsertPreview(
      programEditor.getPendingProgramInsertIndex(),
      blockType,
      null
    );
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', blockType);
    }
  });
  button.addEventListener('dragend', () => {
    programEditor.clearProgramInsertPreview();
    renderProgramWorkspace();
  });
  return button;
}

function renderAvailableBlocks(level) {
  programEditor.setAvailableBlockTypes(level.availableBlocks);
  blockButtons = level.availableBlocks.map((blockType) => createBlockButton(blockType));
  blockListElement.replaceChildren(...blockButtons);
  selectedBlockType = null;
  renderProgramWorkspace();
  setProgramEditingEnabled(!isRunInProgress);
}

function renderLevelMeta(level) {
  const firstHint = level.hints[0] ?? arStrings.levelMeta.defaultHint;
  levelHintElement.textContent = `${arStrings.levelMeta.hintPrefix} ${firstHint}`;
  objectiveConditionElement.textContent = describeSuccessCondition(level);
}

function updateLevelIndicator(levelId) {
  const levelIndex = playableLevelIds.indexOf(levelId);
  if (levelIndex >= 0) {
    levelIndicatorElement.textContent = arStrings.levelMeta.levelIndicatorTemplate
      .replace('{current}', String(levelIndex + 1))
      .replace('{total}', String(playableLevelIds.length));
    return;
  }
  levelIndicatorElement.textContent = arStrings.levelIndicator;
}

function buildInstructionSequence(executionConfig) {
  return compileProgram(
    programEditor.getProgramSteps(),
    selectedBlockType,
    executionConfig.repeatSelectedBlockCount
  );
}

function handleProgramExecutionEvent(runToken, event) {
  if (runToken !== activeRunToken) {
    return;
  }

  if (event.type === 'activeStepChanged') {
    setActiveProgramStep(event.stepId ?? null);
    return;
  }

  if (event.type === 'robotUpdated') {
    robotState = event.robotState;
    renderWorldGrid(activeLevel, robotState, event.animation);
    return;
  }

  if (event.type === 'objectiveUpdated') {
    objectiveProgress = event.objectiveProgress;
    updateCollectionSummary();
    return;
  }

  if (event.type === 'statusChanged') {
    if (event.status === 'levelComplete') {
      saveProgressLevelId(activeLevel.id);
      syncPrimaryActions();
    }
    setStatus(event.status);
  }
}

async function runRobotSession(runToken, signal, executionConfig) {
  const instructionSequence = buildInstructionSequence(executionConfig);
  const runResult = await runProgram({
    level: activeLevel,
    instructionSequence,
    initialRobotState: robotState,
    initialObjectiveProgress: objectiveProgress,
    executionConfig,
    delay,
    signal,
    onEvent: (event) => handleProgramExecutionEvent(runToken, event)
  });

  if (runToken !== activeRunToken) {
    return;
  }

  robotState = runResult.robotState;
  objectiveProgress = runResult.objectiveProgress;
}

function resetRobotPosition() {
  robotState = createRobotState(activeLevel.robot);
  objectiveProgress = createObjectiveProgress(activeLevel);
  renderWorldGrid(activeLevel, robotState);
  updateCollectionSummary();
}

function applyStaticLabels() {
  document.title = arStrings.pageTitle;
  document.querySelector('#app-heading').textContent = arStrings.heading;
  document.querySelector('#start-button-label').textContent = arStrings.primaryActions.start;
  document.querySelector('#continue-button-label').textContent = arStrings.primaryActions.continue;
  document.querySelector('#parents-button-label').textContent = arStrings.primaryActions.parents;
  document.querySelector('#world-heading').textContent = arStrings.world.heading;
  document.querySelector('#block-area-heading').textContent = arStrings.blockArea.heading;
  document.querySelector('#program-heading').textContent = arStrings.blockArea.programHeading;
  programDemoElement.textContent = arStrings.blockArea.firstLevelDemo;
  saveProgramButton.textContent = arStrings.controls.saveProgram;
  document.querySelector('#movement-heading').textContent = arStrings.movementGuideHeading;
  document.querySelector('#move-forward-label').textContent = arStrings.movement.forward;
  document.querySelector('#turn-right-label').textContent = arStrings.movement.right;
  document.querySelector('#turn-left-label').textContent = arStrings.movement.left;
  playButton.textContent = arStrings.controls.play;
  stopButton.textContent = arStrings.controls.stop;
  resetButton.textContent = arStrings.controls.reset;
  retryLevelButton.textContent = arStrings.controls.retryLevel;
  returnHomeButton.textContent = arStrings.controls.returnHome;
}

function initializeLevel(levelId) {
  currentRequestedLevelId = levelId;
  const { level, usedFallback } = resolveLevel(levelId);
  activeLevel = level;
  robotState = createRobotState(level.robot);
  objectiveProgress = createObjectiveProgress(level);
  resetProgramWorkspace();

  updateLevelIndicator(level.id);
  renderWorldGrid(level, robotState);
  renderAvailableBlocks(level);
  const restoreResult = restoreProgramForLevel(level.id);
  updateCollectionSummary();
  renderLevelMeta(level);
  if (usedFallback) {
    setStatus('fallback');
  } else if (restoreResult.failed) {
    setStatus('programLoadFailed');
  } else if (restoreResult.restored) {
    setStatus('programRestored');
  } else {
    setStatus('idle');
  }
  if (usedFallback) {
    showLevelError();
  } else {
    hideLevelError();
  }
}

function startRun() {
  if (isRunInProgress) {
    return;
  }

  activeRunToken += 1;
  if (activeRunController) {
    activeRunController.abort();
  }

  const runToken = activeRunToken;
  const runController = new AbortController();
  activeRunController = runController;
  const executionConfig = getExecutionConfig(activeLevel);
  isRunInProgress = true;
  setProgramEditingEnabled(false);

  void runRobotSession(runToken, runController.signal, executionConfig)
    .catch((error) => {
      if (runToken === activeRunToken) {
        handleUnexpectedRuntimeError(error, 'run.session');
      }
    })
    .finally(() => {
      isRunInProgress = false;
      setActiveProgramStep(null);
      setProgramEditingEnabled(true);
      if (runToken === activeRunToken && activeRunController === runController) {
        activeRunController = null;
      }
    });
}

function cancelActiveRun(nextStatus = null) {
  activeRunToken += 1;
  if (activeRunController) {
    activeRunController.abort();
    activeRunController = null;
  }
  isRunInProgress = false;
  setActiveProgramStep(null);
  setProgramEditingEnabled(true);

  if (nextStatus) {
    setStatus(nextStatus);
  }
}

playButton.addEventListener('click', () => {
  startRun();
});

startButton.addEventListener('click', () => {
  cancelActiveRun();
  initializeLevel(playableLevelIds[0] ?? 'level-001');
});

continueButton.addEventListener('click', () => {
  const savedLevelId = readSavedProgressLevelId();
  if (!savedLevelId) {
    setStatus('continueUnavailable');
    return;
  }

  cancelActiveRun();
  initializeLevel(savedLevelId);
});

parentsButton.addEventListener('click', () => {
  setStatus('parentsAreaPending');
});

retryLevelButton.addEventListener('click', () => {
  cancelActiveRun();
  initializeLevel(currentRequestedLevelId);
});

returnHomeButton.addEventListener('click', () => {
  cancelActiveRun();
  initializeLevel(playableLevelIds[0] ?? 'level-001');
});

saveProgramButton.addEventListener('click', () => {
  saveCurrentProgramForLevel(activeLevel.id);
});

stopButton.addEventListener('click', () => {
  cancelActiveRun('stopped');
});

resetButton.addEventListener('click', () => {
  cancelActiveRun();
  resetRobotPosition();
  setStatus('reset');
});

function getInitialLevelId() {
  const configuredLevelId = runtimeConfig.initialLevelId;
  return typeof configuredLevelId === 'string' && configuredLevelId.length > 0
    ? configuredLevelId
    : defaultRuntimeConfig.initialLevelId;
}

export function initializeRobotLab(config = defaultRuntimeConfig) {
  if (hasInitialized) {
    return;
  }

  runtimeConfig = config;
  runtimeLogger = runtimeConfig.logger ?? createConsoleLogger();
  currentRequestedLevelId = getInitialLevelId();
  attachRuntimeErrorListeners();
  applyStaticLabels();
  programWorkspaceView.attachInteractions();
  initializeLevel(getInitialLevelId());
  syncPrimaryActions();
  hasInitialized = true;
}
