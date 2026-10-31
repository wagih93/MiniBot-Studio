import { arStrings } from './shared/i18n/ar.js';
import { getLevelById, listLevelIds, validateLevelData, createLevelMetaView } from './features/levels/index.js';
import { createRobotState, createWorldGridView } from './features/robot-simulation/index.js';
import { createLearningProgressSummary, createLocalStorageParentSettingsRepository, createLocalStorageProgramRepository, createLocalStorageProgressRepository } from './features/learning-progress/index.js';
import { createProgramEditor, createProgramWorkspaceView, createBlockToolboxView } from './features/program-editing/index.js';
import { compileProgram, createObjectiveProgress, createRunSessionController, getCollectedCollectibleCount, isCollectibleCollected, runProgram, createExecutionStatusView } from './features/program-execution/index.js';
import { createAudioFeedback, createConsoleLogger, createLocalStorageAppDataRepository, createLocalStorageTutorialStateRepository, createTutorialController, reportRuntimeError, createShellView, createRobotLabRuntimeController, createShellEventBindings } from './features/shell/index.js';
import { createDefaultRuntimeConfig } from './shared/runtime-config.js';
import { createAbortSignalDelay } from './shared/abort-signal-delay.js';

const qs = (selector) => document.querySelector(selector);

const fallbackLevel = {
  id: 'fallback-safe-level',
  title: arStrings.levelMeta.fallbackLevelTitle,
  grid: { rows: 3, columns: 3 },
  robot: { row: 0, column: 0, direction: 'east' },
  collectibles: [{ row: 2, column: 2, type: 'star' }],
  obstacles: [],
  availableBlocks: ['moveForward', 'turnRight', 'turnLeft'],
  successConditions: { reachGoal: true, collectAllCollectibles: true },
  hints: [arStrings.levelMeta.defaultHint]
};

const defaultExecutionConfig = {
  maxStepsPerRun: 12,
  repeatSelectedBlockCount: 1,
  stepDelayMilliseconds: 220
};

const playableLevelIds = listLevelIds();
const playableLevelsById = Object.fromEntries(playableLevelIds.map((levelId) => [levelId, getLevelById(levelId)]));
const progressRepository = createLocalStorageProgressRepository({ allowedLevelIds: playableLevelIds });
const programRepository = createLocalStorageProgramRepository({ allowedLevelIds: playableLevelIds });
const parentSettingsRepository = createLocalStorageParentSettingsRepository();
const appDataRepository = createLocalStorageAppDataRepository();
const tutorialStateRepository = createLocalStorageTutorialStateRepository();
const runSessionController = createRunSessionController();
const delay = createAbortSignalDelay();
const fallbackLogger = createConsoleLogger();

let runtimeErrorListenersAttached = false;
let hasInitialized = false;
let runtimeController;

const audioFeedback = createAudioFeedback({
  readLogger: () => runtimeController?.getRuntimeLogger() ?? fallbackLogger
});

const tutorialController = createTutorialController({
  steps: arStrings.tutorial.steps,
  hasCompletedTutorial: () => tutorialStateRepository.hasCompletedTutorial(),
  markCompletedTutorial: () => tutorialStateRepository.markCompletedTutorial()
});

const programEditor = createProgramEditor(fallbackLevel.availableBlocks);
const statusView = createExecutionStatusView({ statusElement: qs('#status'), labels: arStrings.status });
const gridView = createWorldGridView({ worldGridElement: qs('#world-grid'), isCollectibleCollected });

const toolboxView = createBlockToolboxView({
  blockListElement: qs('#block-list'),
  labels: arStrings.blockArea,
  programEditor,
  isRunInProgress: () => runSessionController.isRunInProgress(),
  onBlockSelected: (_blockType, label) => {
    statusView.setBlockSelected(label);
  },
  onTouchAdd: (blockType) => {
    if (programEditor.addProgramStep(blockType)) {
      workspaceView.render();
      statusView.setStatus('programUpdated');
    }
  }
});

const workspaceView = createProgramWorkspaceView({
  programWorkspaceElement: qs('#program-workspace'),
  programListElement: qs('#program-list'),
  programDemoElement: qs('#program-demo'),
  getProgramEditor: () => programEditor,
  getBlockPresentation: (blockType) => ({
    label: arStrings.blockArea.labelsByType[blockType] ?? blockType,
    icon: arStrings.blockArea.iconsByType?.[blockType] ?? '⬜'
  }),
  deleteStepLabel: arStrings.controls.deleteStep,
  emptyProgramLabel: arStrings.blockArea.emptyProgram,
  repeatBodyEmptyLabel: arStrings.blockArea.repeatBodyEmpty,
  repeatCountTemplate: arStrings.blockArea.repeatCountTemplate,
  isRunInProgress: () => runSessionController.isRunInProgress(),
  isFirstLevel: () => runtimeController?.getActiveLevelId() === 'level-001',
  onInvalidDrop: () => statusView.setStatus('invalidDrop'),
  onProgramChanged: () => statusView.setStatus('programUpdated'),
  onProgramRemoved: () => statusView.setStatus('programRemoved'),
  onProgramReordered: () => statusView.setStatus('programReordered'),
  onAddToBody: (repeatStepId) => {
    const selectedBlockType = toolboxView.getSelectedBlockType();
    if (selectedBlockType && programEditor.addBodyStep(repeatStepId, selectedBlockType)) {
      workspaceView.render();
      statusView.setStatus('programUpdated');
    }
  },
  onRemoveFromBody: (repeatStepId, bodyStepId) => {
    if (programEditor.removeBodyStep(repeatStepId, bodyStepId)) {
      workspaceView.render();
      statusView.setStatus('programRemoved');
    }
  }
});

const metaView = createLevelMetaView({
  levelHintElement: qs('#level-hint'),
  hintButtonElement: qs('#hint-button'),
  objectiveConditionElement: qs('#success-condition'),
  collectionSummaryElement: qs('#collection-summary'),
  levelIndicatorElement: qs('#level-indicator'),
  labels: arStrings.levelMeta,
  playableLevelIds,
  getCollectedCollectibleCount
});

const shellElements = {
  startButton: qs('#start-button'),
  continueButton: qs('#continue-button'),
  parentsButton: qs('#parents-button'),
  tutorialButton: qs('#tutorial-button'),
  playButton: qs('#play-button'),
  stopButton: qs('#stop-button'),
  resetButton: qs('#reset-button'),
  nextLevelButton: qs('#next-level-button'),
  retryLevelButton: qs('#retry-level-button'),
  returnHomeButton: qs('#return-home-button'),
  saveProgramButton: qs('#save-program-button'),
  blockListElement: qs('#block-list'),
  programWorkspaceElement: qs('#program-workspace'),
  playInstructionAudioButton: qs('#play-instruction-audio-button'),
  parentAreaElement: qs('#parent-area'),
  parentProgressSummaryElement: qs('#parent-progress-summary'),
  parentConceptListElement: qs('#parent-concept-list'),
  soundEffectsToggle: qs('#sound-effects-toggle'),
  clearProgressButton: qs('#clear-progress-button'),
  closeParentAreaButton: qs('#close-parent-area-button'),
  tutorialPanelElement: qs('#tutorial-panel'),
  tutorialStepIndicatorElement: qs('#tutorial-step-indicator'),
  tutorialHeadingElement: qs('#tutorial-heading'),
  tutorialBodyElement: qs('#tutorial-body'),
  tutorialNextButton: qs('#tutorial-next-button'),
  tutorialSkipButton: qs('#tutorial-skip-button'),
  tutorialCloseButton: qs('#tutorial-close-button'),
  tutorialAudioButton: qs('#tutorial-audio-button'),
  hintButton: qs('#hint-button'),
  levelErrorElement: qs('#level-error'),
  levelErrorMessageElement: qs('#level-error-message'),
  levelCompletionElement: qs('#level-completion'),
  levelCompletionMessageElement: qs('#level-completion-message')
};

let shellView;
const shellEventBindings = createShellEventBindings({
  readRuntimeController: () => runtimeController,
  readShellView: () => shellView,
  statusView,
  tutorialController,
  renderActiveTutorialStep,
  audioFeedback,
  metaView,
  labels: arStrings,
  playableLevelIds,
  programRepository,
  programEditor,
  openLevel,
  readInstructionText: () => [qs('#level-hint')?.textContent ?? '', qs('#success-condition')?.textContent ?? ''].join(' ').trim()
});

shellView = createShellView({
  elements: shellElements,
  labels: arStrings,
  ...shellEventBindings
});

runtimeController = createRobotLabRuntimeController({
  fallbackLevel,
  defaultExecutionConfig,
  playableLevelIds,
  playableLevelsById,
  getLevelById,
  validateLevelData,
  createRobotState,
  createObjectiveProgress,
  createLearningProgressSummary,
  compileProgram,
  runProgram,
  progressRepository,
  programRepository,
  parentSettingsRepository,
  appDataRepository,
  runSessionController,
  delay,
  audioFeedback,
  programEditor,
  toolboxView,
  workspaceView,
  metaView,
  gridView,
  shellView,
  statusView,
  programListElement: qs('#program-list'),
  onRunError: handleError,
  runtimeConfig: createDefaultRuntimeConfig(),
  runtimeLogger: fallbackLogger
});

function openLevel(levelId) {
  const levelState = runtimeController.initializeLevel(levelId);
  if (levelState.usedFallback) {
    shellView.showLevelError(`${arStrings.levelError.fallbackMessage} ${arStrings.levelError.retryHint}`);
    statusView.setStatus('fallback');
    return;
  }
  shellView.hideLevelError();
  statusView.setStatus(levelState.status);
}

function handleError(error, context) {
  const logger = runtimeController?.getRuntimeLogger() ?? fallbackLogger;
  reportRuntimeError(logger, { context, message: error instanceof Error ? error.message : String(error ?? 'unknown-error') });
  statusView.setStatus('unexpectedError');
}

function attachRuntimeErrorListeners() {
  if (runtimeErrorListenersAttached) {
    return;
  }
  window.addEventListener('error', (event) => handleError(event.error ?? event.message, 'window.error'));
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason, 'window.unhandledrejection');
    event.preventDefault();
  });
  runtimeErrorListenersAttached = true;
}

function renderActiveTutorialStep() {
  const activeTutorialStep = tutorialController.getCurrentStep();
  if (!activeTutorialStep) {
    shellView.hideTutorial();
    return;
  }
  shellView.renderTutorialStep(activeTutorialStep);
}

export function initializeRobotLab(config = createDefaultRuntimeConfig()) {
  if (hasInitialized) {
    return;
  }

  runtimeController.setRuntimeConfig(config);
  runtimeController.setRuntimeLogger(config.logger ?? createConsoleLogger());
  attachRuntimeErrorListeners();
  shellView.applyStaticLabels();
  shellView.attachEvents();
  workspaceView.attachInteractions();
  openLevel(runtimeController.getCurrentRequestedLevelId());
  shellView.syncPrimaryActions(false);
  if (tutorialController.openTutorialIfNeeded()) {
    renderActiveTutorialStep();
  } else {
    shellView.hideTutorial();
  }
  hasInitialized = true;
}
