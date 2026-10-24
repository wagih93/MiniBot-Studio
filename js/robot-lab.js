import { arStrings } from './i18n/ar.js';
import {
  createChallengeState,
  getCollectedCount,
  isGoalCollected,
  updateChallengeProgress
} from './levels/challenge-manager.js';
import { getLevelById, listLevelIds } from './levels/level-registry.js';
import { validateLevelData } from './levels/level-validator.js';
import { createRobotState, moveForward, turnLeft, turnRight } from './simulator/robot.js';
import { canMoveForward } from './simulator/world.js';

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
const worldGridElement = document.querySelector('#world-grid');
const collectionSummaryElement = document.querySelector('#collection-summary');
const levelHintElement = document.querySelector('#level-hint');
const successConditionElement = document.querySelector('#success-condition');
const levelIndicatorElement = document.querySelector('#level-indicator');
const runtimeSearchParams = new URLSearchParams(window.location.search);

const playableLevelIds = listLevelIds().filter(
  (levelId) => levelId !== 'broken-level' && !levelId.startsWith('test-')
);
const statusByState = arStrings.status;
const directionSymbolByName = {
  north: '↑',
  east: '→',
  south: '↓',
  west: '←'
};

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
const defaultExecutionConfig = {
  maxStepsPerRun: 12,
  repeatSelectedBlockCount: 1,
  stepDelayMs: 220
};
const progressStorageKey = 'minibot.progress.levelId';

let activeRunToken = 0;
let activeRunController = null;
let blockButtons = [];
let selectedBlockType = null;
let activeLevel = fallbackLevel;
let robotState = createRobotState(fallbackLevel.robot);
let challengeState = createChallengeState(fallbackLevel);
let isRunInProgress = false;
let programSteps = [];
let nextProgramStepId = 1;
let pendingDraggedBlockType = null;
let pendingDraggedProgramStepId = null;
let pendingProgramInsertIndex = null;
let activeProgramStepId = null;

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
  const needsAllGoals = Boolean(level.successConditions.collectAllGoals);
  if (needsAllGoals) {
    return arStrings.levelMeta.defaultSuccess;
  }
  return `${arStrings.levelMeta.successPrefix} وصل إلى الهدف المحدد.`;
}

function getActiveLevelId() {
  const requestedLevelId = runtimeSearchParams.get('level');
  return requestedLevelId && requestedLevelId.length > 0 ? requestedLevelId : 'level-001';
}

function readSavedProgressLevelId() {
  try {
    const savedLevelId = window.localStorage.getItem(progressStorageKey);
    if (!savedLevelId) {
      return null;
    }
    return playableLevelIds.includes(savedLevelId) ? savedLevelId : null;
  } catch (error) {
    console.warn('Failed to read saved progress level.', error);
    return null;
  }
}

function saveProgressLevelId(levelId) {
  if (!playableLevelIds.includes(levelId)) {
    return;
  }

  try {
    window.localStorage.setItem(progressStorageKey, levelId);
  } catch (error) {
    console.warn('Failed to save progress level.', error);
  }
}

function readBoundedIntegerQuery(name, fallback, min, max) {
  const rawValue = runtimeSearchParams.get(name);
  if (rawValue === null) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
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

  return {
    maxStepsPerRun: readBoundedIntegerQuery('maxSteps', maxStepsFallback, 1, 300),
    repeatSelectedBlockCount: readBoundedIntegerQuery(
      'repeat',
      defaultExecutionConfig.repeatSelectedBlockCount,
      1,
      300
    ),
    stepDelayMs: readBoundedIntegerQuery('stepDelayMs', defaultExecutionConfig.stepDelayMs, 0, 500)
  };
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

function isRobotCell(robot, row, column) {
  return robot.row === row && robot.column === column;
}

function isGoalCell(level, row, column) {
  return level.goals.some((goal) => goal.row === row && goal.column === column);
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
      } else if (isGoalCell(level, row, column)) {
        const collected = isGoalCollected(challengeState, row, column);
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
  const collectedCount = getCollectedCount(challengeState);
  collectionSummaryElement.textContent =
    `${arStrings.levelMeta.collectionPrefix} ${collectedCount}/${challengeState.totalGoals}`;
}

function setActiveProgramStep(stepId) {
  if (activeProgramStepId === stepId) {
    return;
  }
  activeProgramStepId = stepId;
  renderProgramWorkspace();
}

function renderProgramWorkspace() {
  const stepElements = [];

  if (programSteps.length === 0 && pendingProgramInsertIndex === null) {
    const emptyState = document.createElement('li');
    emptyState.classList.add('program-empty');
    emptyState.textContent = arStrings.blockArea.emptyProgram;
    stepElements.push(emptyState);
  } else {
    for (let index = 0; index < programSteps.length; index += 1) {
      if (pendingProgramInsertIndex === index) {
        const placeholder = document.createElement('li');
        placeholder.classList.add('program-placeholder');
        placeholder.setAttribute('aria-hidden', 'true');
        stepElements.push(placeholder);
      }

      const step = programSteps[index];
      const presentation = getBlockPresentation(step.blockType);
      const stepElement = document.createElement('li');
      stepElement.classList.add('program-step');
      stepElement.dataset.stepId = String(step.id);
      stepElement.dataset.active = String(step.id) === String(activeProgramStepId) ? 'true' : 'false';
      stepElement.draggable = true;

      const icon = document.createElement('span');
      icon.classList.add('program-step__icon');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = presentation.icon;

      const label = document.createElement('span');
      label.classList.add('program-step__label');
      label.textContent = presentation.label;

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.classList.add('program-step__remove');
      removeButton.setAttribute('aria-label', `${arStrings.controls.deleteStep} ${presentation.label}`);
      removeButton.textContent = '✕';
      removeButton.addEventListener('click', () => {
        removeProgramStep(step.id);
      });

      stepElement.addEventListener('dragstart', (event) => {
        pendingDraggedProgramStepId = String(step.id);
        pendingDraggedBlockType = null;
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('application/x-program-step-id', String(step.id));
        }
      });
      stepElement.addEventListener('dragend', () => {
        clearProgramInsertPreview();
      });

      stepElement.append(icon, label, removeButton);
      stepElements.push(stepElement);
    }

    if (pendingProgramInsertIndex === programSteps.length) {
      const placeholder = document.createElement('li');
      placeholder.classList.add('program-placeholder');
      placeholder.setAttribute('aria-hidden', 'true');
      stepElements.push(placeholder);
    }
  }

  programListElement.replaceChildren(...stepElements);
  for (const removeButton of programListElement.querySelectorAll('.program-step__remove')) {
    removeButton.disabled = isRunInProgress;
  }
}

function resetProgramWorkspace() {
  programSteps = [];
  nextProgramStepId = 1;
  pendingDraggedBlockType = null;
  pendingDraggedProgramStepId = null;
  pendingProgramInsertIndex = null;
  activeProgramStepId = null;
  renderProgramWorkspace();
}

function getProgramInsertIndex(clientY) {
  const stepElements = Array.from(programListElement.querySelectorAll('.program-step'));
  if (stepElements.length === 0) {
    return 0;
  }

  for (let index = 0; index < stepElements.length; index += 1) {
    const rect = stepElements[index].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return index;
    }
  }

  return stepElements.length;
}

function setProgramInsertPreview(insertIndex, draggedBlockType) {
  if (pendingProgramInsertIndex === insertIndex && pendingDraggedBlockType === draggedBlockType) {
    return;
  }
  pendingProgramInsertIndex = insertIndex;
  pendingDraggedBlockType = draggedBlockType;
  renderProgramWorkspace();
}

function clearProgramInsertPreview() {
  if (
    pendingProgramInsertIndex === null &&
    pendingDraggedBlockType === null &&
    pendingDraggedProgramStepId === null
  ) {
    return;
  }
  pendingProgramInsertIndex = null;
  pendingDraggedBlockType = null;
  pendingDraggedProgramStepId = null;
  renderProgramWorkspace();
}

function addProgramStep(blockType, insertIndex = programSteps.length) {
  if (!activeLevel.availableBlocks.includes(blockType)) {
    setStatus('invalidDrop');
    return false;
  }

  const normalizedInsertIndex = Math.max(0, Math.min(insertIndex, programSteps.length));
  const newStep = { id: nextProgramStepId, blockType };
  nextProgramStepId += 1;
  programSteps.splice(normalizedInsertIndex, 0, newStep);
  pendingProgramInsertIndex = null;
  pendingDraggedBlockType = null;
  pendingDraggedProgramStepId = null;
  renderProgramWorkspace();
  setStatus('programUpdated');
  return true;
}

function removeProgramStep(stepId) {
  const stepIndex = programSteps.findIndex((step) => String(step.id) === String(stepId));
  if (stepIndex < 0) {
    return false;
  }

  programSteps.splice(stepIndex, 1);
  renderProgramWorkspace();
  setStatus('programRemoved');
  return true;
}

function moveProgramStep(stepId, insertIndex) {
  const sourceIndex = programSteps.findIndex((step) => String(step.id) === String(stepId));
  if (sourceIndex < 0) {
    setStatus('invalidDrop');
    return false;
  }

  const [stepToMove] = programSteps.splice(sourceIndex, 1);
  const normalizedInsertIndex = Math.max(0, Math.min(insertIndex, programSteps.length));
  programSteps.splice(normalizedInsertIndex, 0, stepToMove);
  pendingProgramInsertIndex = null;
  pendingDraggedProgramStepId = null;
  renderProgramWorkspace();
  setStatus('programReordered');
  return true;
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
    pendingDraggedBlockType = blockType;
    pendingDraggedProgramStepId = null;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('text/plain', blockType);
    }
  });
  button.addEventListener('dragend', () => {
    clearProgramInsertPreview();
  });
  return button;
}

function renderAvailableBlocks(level) {
  blockButtons = level.availableBlocks.map((blockType) => createBlockButton(blockType));
  blockListElement.replaceChildren(...blockButtons);
  selectedBlockType = null;
  setProgramEditingEnabled(!isRunInProgress);
}

function setupProgramWorkspaceInteractions() {
  programWorkspaceElement.addEventListener('dragover', (event) => {
    if (isRunInProgress) {
      return;
    }

    const draggedProgramStepId =
      event.dataTransfer?.getData('application/x-program-step-id') || pendingDraggedProgramStepId;
    const draggedBlockType = event.dataTransfer?.getData('text/plain') || pendingDraggedBlockType;
    if (!draggedProgramStepId && !draggedBlockType) {
      return;
    }

    event.preventDefault();
    const insertIndex = getProgramInsertIndex(event.clientY);
    pendingDraggedProgramStepId = draggedProgramStepId || null;
    setProgramInsertPreview(insertIndex, draggedBlockType || null);
  });

  programWorkspaceElement.addEventListener('dragleave', (event) => {
    if (event.relatedTarget && programWorkspaceElement.contains(event.relatedTarget)) {
      return;
    }
    clearProgramInsertPreview();
  });

  programWorkspaceElement.addEventListener('drop', (event) => {
    event.preventDefault();
    if (isRunInProgress) {
      clearProgramInsertPreview();
      return;
    }

    const droppedProgramStepId =
      event.dataTransfer?.getData('application/x-program-step-id') || pendingDraggedProgramStepId;
    if (droppedProgramStepId) {
      const insertIndex = pendingProgramInsertIndex ?? programSteps.length;
      const wasMoved = moveProgramStep(droppedProgramStepId, insertIndex);
      if (!wasMoved) {
        clearProgramInsertPreview();
      }
      return;
    }

    const droppedBlockType = event.dataTransfer?.getData('text/plain') || pendingDraggedBlockType;
    if (!droppedBlockType) {
      setStatus('invalidDrop');
      clearProgramInsertPreview();
      return;
    }

    const insertIndex = pendingProgramInsertIndex ?? programSteps.length;
    const wasAdded = addProgramStep(droppedBlockType, insertIndex);
    if (!wasAdded) {
      clearProgramInsertPreview();
    }
  });
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

async function executeMoveForward(runToken, signal, executionConfig) {
  if (!canMoveForward(activeLevel, robotState)) {
    setStatus('blocked');
    return 'blocked';
  }

  const nextRobotState = moveForward(robotState);
  robotState = nextRobotState;

  renderWorldGrid(activeLevel, robotState, {
    kind: 'move',
    row: robotState.row,
    column: robotState.column,
    direction: robotState.direction
  });
  setStatus('running');
  try {
    await delay(executionConfig.stepDelayMs, signal);
  } catch (error) {
    if (error.name === 'AbortError') {
      return 'aborted';
    }
    throw error;
  }

  if (runToken !== activeRunToken || signal.aborted) {
    return 'aborted';
  }

  const progress = updateChallengeProgress(activeLevel, challengeState, robotState);
  renderWorldGrid(activeLevel, robotState);
  updateCollectionSummary();

  if (progress.collectedGoalKey) {
    setStatus('collected');
    try {
      await delay(180, signal);
    } catch (error) {
      if (error.name === 'AbortError') {
        return 'aborted';
      }
      throw error;
    }
    if (runToken !== activeRunToken || signal.aborted) {
      return 'aborted';
    }
  }

  if (progress.isComplete) {
    saveProgressLevelId(activeLevel.id);
    syncPrimaryActions();
    setStatus('levelComplete');
    return 'levelComplete';
  }

  return 'advanced';
}

async function executeTurn(runToken, signal, direction, executionConfig) {
  const nextRobotState = direction === 'right' ? turnRight(robotState) : turnLeft(robotState);
  robotState = nextRobotState;

  renderWorldGrid(activeLevel, robotState, {
    kind: 'turn',
    row: robotState.row,
    column: robotState.column,
    turnDirection: direction
  });
  setStatus('running');
  try {
    await delay(executionConfig.stepDelayMs, signal);
  } catch (error) {
    if (error.name === 'AbortError') {
      return 'aborted';
    }
    throw error;
  }

  if (runToken !== activeRunToken || signal.aborted) {
    return 'aborted';
  }

  renderWorldGrid(activeLevel, robotState);
  return 'advanced';
}

function buildInstructionSequence(executionConfig) {
  if (programSteps.length > 0) {
    return programSteps.map((step) => ({ blockType: step.blockType, stepId: step.id }));
  }

  if (!selectedBlockType) {
    return [];
  }

  return Array.from({ length: executionConfig.repeatSelectedBlockCount }, () => ({
    blockType: selectedBlockType,
    stepId: null
  }));
}

function validateProgramForRun(level, instructionSequence) {
  try {
    const validationRules = level.programValidation ?? {};
    const blockTypes = instructionSequence.map((step) => step.blockType);
    const allowEmptyProgram = validationRules.allowEmptyProgram === true;
    if (!allowEmptyProgram && blockTypes.length === 0) {
      return 'programEmpty';
    }

    if (blockTypes.length === 0) {
      return null;
    }

    if (validationRules.requiresStartBlock && blockTypes[0] !== 'start') {
      return 'startRequired';
    }

    if (Array.isArray(validationRules.requiredBlocks)) {
      for (const requiredBlockType of validationRules.requiredBlocks) {
        if (!blockTypes.includes(requiredBlockType)) {
          return 'requiredBlockMissing';
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Program validation failed unexpectedly.', error);
    return 'validationInternalError';
  }
}

async function runRobotSession(runToken, signal, executionConfig, instructionSequence) {
  const validationFailure = validateProgramForRun(activeLevel, instructionSequence);
  if (validationFailure) {
    setStatus(validationFailure);
    return;
  }

  if (instructionSequence.length === 0) {
    setStatus('complete');
    return;
  }

  for (let stepNumber = 0; stepNumber < instructionSequence.length; stepNumber += 1) {
    if (runToken !== activeRunToken || signal.aborted) {
      return;
    }

    if (stepNumber >= executionConfig.maxStepsPerRun) {
      setStatus('stepLimitExceeded');
      return;
    }

    const instruction = instructionSequence[stepNumber];
    const instructionType = instruction.blockType;
    setActiveProgramStep(instruction.stepId);
    let stepResult = 'unsupported';
    if (instructionType === 'start') {
      stepResult = 'advanced';
    } else if (instructionType === 'moveForward') {
      stepResult = await executeMoveForward(runToken, signal, executionConfig);
    } else if (instructionType === 'turnRight') {
      stepResult = await executeTurn(runToken, signal, 'right', executionConfig);
    } else if (instructionType === 'turnLeft') {
      stepResult = await executeTurn(runToken, signal, 'left', executionConfig);
    } else {
      setStatus('unsupported');
      return;
    }

    if (stepResult === 'aborted') {
      return;
    }

    if (stepResult === 'blocked' || stepResult === 'levelComplete') {
      return;
    }
  }

  setStatus('complete');
}

function resetRobotPosition() {
  robotState = createRobotState(activeLevel.robot);
  challengeState = createChallengeState(activeLevel);
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
  document.querySelector('#movement-heading').textContent = arStrings.movementGuideHeading;
  document.querySelector('#move-forward-label').textContent = arStrings.movement.forward;
  document.querySelector('#turn-right-label').textContent = arStrings.movement.right;
  document.querySelector('#turn-left-label').textContent = arStrings.movement.left;
  playButton.textContent = arStrings.controls.play;
  stopButton.textContent = arStrings.controls.stop;
  resetButton.textContent = arStrings.controls.reset;
}

function initializeLevel(levelId) {
  const { level, usedFallback } = resolveLevel(levelId);
  activeLevel = level;
  robotState = createRobotState(level.robot);
  challengeState = createChallengeState(level);
  resetProgramWorkspace();

  updateLevelIndicator(level.id);
  renderWorldGrid(level, robotState);
  renderAvailableBlocks(level);
  updateCollectionSummary();
  renderLevelMeta(level);
  setStatus(usedFallback ? 'fallback' : 'idle');
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
  const instructionSequence = buildInstructionSequence(executionConfig);
  isRunInProgress = true;
  setProgramEditingEnabled(false);

  void runRobotSession(runToken, runController.signal, executionConfig, instructionSequence).finally(() => {
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

stopButton.addEventListener('click', () => {
  cancelActiveRun('stopped');
});

resetButton.addEventListener('click', () => {
  cancelActiveRun();
  resetRobotPosition();
  setStatus('reset');
});

applyStaticLabels();
setupProgramWorkspaceInteractions();
initializeLevel(getActiveLevelId());
syncPrimaryActions();
