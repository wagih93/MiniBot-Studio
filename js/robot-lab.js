import { arStrings } from './shared/i18n/ar.js';
import { getLevelById, listLevelIds, validateLevelData, createLevelMetaView } from './features/levels/index.js';
import { createRobotState, createWorldGridView } from './features/robot-simulation/index.js';
import { createLearningProgressSummary, createLocalStorageParentSettingsRepository, createLocalStorageProgramRepository, createLocalStorageProgressRepository } from './features/learning-progress/index.js';
import { createProgramEditor, createProgramWorkspaceView, createBlockToolboxView } from './features/program-editing/index.js';
import { compileProgram, createObjectiveProgress, createRunSessionController, getCollectedCollectibleCount, isCollectibleCollected, runProgram, createExecutionStatusView } from './features/program-execution/index.js';
import { createAudioFeedback, createConsoleLogger, createLocalStorageTutorialStateRepository, createTutorialController, reportRuntimeError, createShellView } from './features/shell/index.js';
import { createDefaultRuntimeConfig } from './shared/runtime-config.js';
import { createAbortSignalDelay } from './shared/abort-signal-delay.js';
const qs = (sel) => document.querySelector(sel);

const fallbackLevel = {
  id: 'fallback-safe-level', title: arStrings.levelMeta.fallbackLevelTitle,
  grid: { rows: 3, columns: 3 }, robot: { row: 0, column: 0, direction: 'east' },
  collectibles: [{ row: 2, column: 2, type: 'star' }], obstacles: [],
  availableBlocks: ['moveForward', 'turnRight', 'turnLeft'],
  successConditions: { reachGoal: true, collectAllCollectibles: true },
  hints: [arStrings.levelMeta.defaultHint]
};
const defaultExecCfg = { maxStepsPerRun: 12, repeatSelectedBlockCount: 1, stepDelayMilliseconds: 220 };

const playableLevelIds = listLevelIds();
const playableLevelsById = Object.fromEntries(
  playableLevelIds.map((levelId) => [levelId, getLevelById(levelId)])
);
const progressRepo = createLocalStorageProgressRepository({ allowedLevelIds: playableLevelIds });
const programRepo = createLocalStorageProgramRepository({ allowedLevelIds: playableLevelIds });
const parentSettingsRepo = createLocalStorageParentSettingsRepository();
const tutorialStateRepo = createLocalStorageTutorialStateRepository();
const delay = createAbortSignalDelay();
const runSessionController = createRunSessionController();
let activeLevel = fallbackLevel;
let robotState = createRobotState(fallbackLevel.robot);
let objectiveProgress = createObjectiveProgress(fallbackLevel);
let runtimeConfig = createDefaultRuntimeConfig();
let runtimeLogger = createConsoleLogger();
let runtimeErrorListenersAttached = false;
let hasInitialized = false;
let currentRequestedLevelId = runtimeConfig.initialLevelId;
let soundEffectsEnabled = parentSettingsRepo.loadSoundEffectsEnabled();
const audioFeedback = createAudioFeedback({
  readLogger: () => runtimeLogger
});
const tutorialController = createTutorialController({
  steps: arStrings.tutorial.steps,
  hasCompletedTutorial: () => tutorialStateRepo.hasCompletedTutorial(),
  markCompletedTutorial: () => tutorialStateRepo.markCompletedTutorial()
});
const programEditor = createProgramEditor(fallbackLevel.availableBlocks);
const statusView = createExecutionStatusView({ statusElement: qs('#status'), labels: arStrings.status });
const gridView = createWorldGridView({ worldGridElement: qs('#world-grid'), isCollectibleCollected });
const toolboxView = createBlockToolboxView({
  blockListElement: qs('#block-list'), labels: arStrings.blockArea, programEditor,
  isRunInProgress: () => runSessionController.isRunInProgress(),
  onBlockSelected: (_t, label) => statusView.setBlockSelected(label),
  onTouchAdd: (blockType) => {
    if (programEditor.addProgramStep(blockType)) { workspaceView.render(); statusView.setStatus('programUpdated'); }
  }
});
const workspaceView = createProgramWorkspaceView({
  programWorkspaceElement: qs('#program-workspace'), programListElement: qs('#program-list'),
  programDemoElement: qs('#program-demo'), getProgramEditor: () => programEditor,
  getBlockPresentation: (t) => ({ label: arStrings.blockArea.labelsByType[t] ?? t, icon: arStrings.blockArea.iconsByType?.[t] ?? '⬜' }),
  deleteStepLabel: arStrings.controls.deleteStep, emptyProgramLabel: arStrings.blockArea.emptyProgram, repeatBodyEmptyLabel: arStrings.blockArea.repeatBodyEmpty, repeatCountTemplate: arStrings.blockArea.repeatCountTemplate,
  isRunInProgress: () => runSessionController.isRunInProgress(), isFirstLevel: () => activeLevel.id === 'level-001',
  onInvalidDrop: () => statusView.setStatus('invalidDrop'), onProgramChanged: () => statusView.setStatus('programUpdated'),
  onProgramRemoved: () => statusView.setStatus('programRemoved'), onProgramReordered: () => statusView.setStatus('programReordered'),
  onAddToBody: (rid) => { const bt = toolboxView.getSelectedBlockType(); if (bt && programEditor.addBodyStep(rid, bt)) { workspaceView.render(); statusView.setStatus('programUpdated'); } },
  onRemoveFromBody: (rid, bid) => { if (programEditor.removeBodyStep(rid, bid)) { workspaceView.render(); statusView.setStatus('programRemoved'); } }
});
const metaView = createLevelMetaView({
  levelHintElement: qs('#level-hint'), hintButtonElement: qs('#hint-button'), objectiveConditionElement: qs('#success-condition'),
  collectionSummaryElement: qs('#collection-summary'), levelIndicatorElement: qs('#level-indicator'),
  labels: arStrings.levelMeta, playableLevelIds, getCollectedCollectibleCount
});
const shellView = createShellView({
  elements: {
    startButton: qs('#start-button'), continueButton: qs('#continue-button'), parentsButton: qs('#parents-button'),
    tutorialButton: qs('#tutorial-button'),
    playButton: qs('#play-button'), stopButton: qs('#stop-button'), resetButton: qs('#reset-button'), nextLevelButton: qs('#next-level-button'),
    retryLevelButton: qs('#retry-level-button'), returnHomeButton: qs('#return-home-button'),
    saveProgramButton: qs('#save-program-button'), blockListElement: qs('#block-list'), programWorkspaceElement: qs('#program-workspace'),
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
    levelErrorElement: qs('#level-error'), levelErrorMessageElement: qs('#level-error-message'),
    levelCompletionElement: qs('#level-completion'), levelCompletionMessageElement: qs('#level-completion-message')
  },
  labels: arStrings,
  readHasSavedProgress: hasSavedProgress,
  onPlay: startRun,
  onStop: () => cancelActiveRun('stopped'),
  onReset: () => { cancelActiveRun(); resetRobotPosition(); statusView.setStatus('reset'); },
  onStart: () => { cancelActiveRun(); initializeLevel(playableLevelIds[0] ?? 'level-001'); },
  onContinue: () => {
    const continueLevelId = resolveContinueLevelId();
    if (!continueLevelId) { statusView.setStatus('continueUnavailable'); return; }
    cancelActiveRun();
    initializeLevel(continueLevelId);
  },
  onParents: () => {
    shellView.setSoundEffectsEnabled(soundEffectsEnabled);
    shellView.renderParentAreaSummary(getParentAreaSummary());
    shellView.showParentArea();
    statusView.setStatus('parentsAreaOpen');
  },
  onCloseParentsArea: () => {
    shellView.hideParentArea();
    statusView.setStatus('idle');
  },
  onClearProgress: () => {
    if (typeof globalThis.confirm !== 'function') {
      statusView.setStatus('progressClearFailed');
      return;
    }

    const confirmed = globalThis.confirm(arStrings.parentArea.clearProgressConfirm);
    if (!confirmed) {
      statusView.setStatus('progressClearCancelled');
      return;
    }

    if (!progressRepo.clearProgress()) {
      statusView.setStatus('progressClearFailed');
      return;
    }

    cancelActiveRun();
    initializeLevel(playableLevelIds[0] ?? 'level-001');
    shellView.syncPrimaryActions(false);
    shellView.hideParentArea();
    statusView.setStatus('progressCleared');
  },
  onToggleSoundEffects: (enabled) => {
    const previousValue = soundEffectsEnabled;
    soundEffectsEnabled = enabled === true;

    if (!parentSettingsRepo.saveSoundEffectsEnabled(soundEffectsEnabled)) {
      soundEffectsEnabled = previousValue;
      shellView.setSoundEffectsEnabled(previousValue);
      statusView.setStatus('soundEffectsSaveFailed');
      return;
    }

    statusView.setStatus(soundEffectsEnabled ? 'soundEffectsEnabled' : 'soundEffectsDisabled');
  },
  onOpenTutorial: () => {
    tutorialController.replayTutorial();
    renderActiveTutorialStep();
  },
  onTutorialNext: () => {
    const nextTutorialStep = tutorialController.nextStep();
    if (nextTutorialStep.completed) {
      shellView.hideTutorial();
      return;
    }

    if (nextTutorialStep.step) {
      renderActiveTutorialStep();
    }
  },
  onTutorialSkip: () => {
    if (tutorialController.skipTutorial()) {
      shellView.hideTutorial();
    }
  },
  onTutorialClose: () => {
    tutorialController.closeTutorial();
    shellView.hideTutorial();
  },
  onPlayTutorialAudio: () => {
    const activeTutorialStep = tutorialController.getCurrentStep();
    if (!activeTutorialStep) {
      statusView.setStatus('instructionSpeechUnavailable');
      return;
    }
    if (!soundEffectsEnabled) {
      statusView.setStatus('instructionAudioMuted');
      return;
    }

    const spoken = audioFeedback.speakInstruction(activeTutorialStep.description, { enabled: soundEffectsEnabled });
    statusView.setStatus(spoken ? 'tutorialSpoken' : 'instructionSpeechUnavailable');
  },
  onHint: () => {
    const hintResult = metaView.showNextHint({
      speakHint: (hintText) => audioFeedback.speakHint(hintText, {
        enabled: soundEffectsEnabled,
        hintSpeechEnabled: runtimeConfig.hintSpeechEnabled === true
      })
    });
    statusView.setStatus(hintResult.wasSpoken ? 'hintSpoken' : 'hintShown');
  },
  onPlayInstructionAudio: () => {
    if (!soundEffectsEnabled) {
      statusView.setStatus('instructionAudioMuted');
      return;
    }

    const instructionText = [
      qs('#level-hint')?.textContent ?? '',
      qs('#success-condition')?.textContent ?? ''
    ].join(' ').trim();
    const spoken = audioFeedback.speakInstruction(instructionText, { enabled: soundEffectsEnabled });
    statusView.setStatus(spoken ? 'instructionSpoken' : 'instructionSpeechUnavailable');
  },
  onRetry: () => { cancelActiveRun(); initializeLevel(currentRequestedLevelId); },
  onReturnHome: () => { cancelActiveRun(); initializeLevel(playableLevelIds[0] ?? 'level-001'); },
  onNextLevel: () => {
    const nextLevelId = getNextLevelId(activeLevel.id);
    if (!nextLevelId) return;
    cancelActiveRun();
    initializeLevel(nextLevelId);
  },
  onSaveProgram: () => {
    const saved = programRepo.saveProgram(activeLevel.id, programEditor.getProgramBlockTypes());
    statusView.setStatus(saved ? 'programSaved' : 'programLoadFailed');
  }
});

function handleError(error, context) {
  reportRuntimeError(runtimeLogger, { context, message: error instanceof Error ? error.message : String(error ?? 'unknown-error') });
  statusView.setStatus('unexpectedError');
}

function attachRuntimeErrorListeners() {
  if (runtimeErrorListenersAttached) return;
  window.addEventListener('error', (e) => handleError(e.error ?? e.message, 'window.error'));
  window.addEventListener('unhandledrejection', (e) => { handleError(e.reason, 'window.unhandledrejection'); e.preventDefault(); });
  runtimeErrorListenersAttached = true;
}

function resolveLevel(levelId) {
  const override = Array.isArray(runtimeConfig.levelOverrides) ? runtimeConfig.levelOverrides.find((l) => l.id === levelId) : null;
  const level = override ?? getLevelById(levelId);
  if (!level) { if (runtimeLogger?.warn) runtimeLogger.warn({ code: 'runtime.warning', message: 'Requested level not found.', levelId }); return { level: fallbackLevel, usedFallback: true }; }
  const { isValid, errors } = validateLevelData(level);
  if (!isValid) { if (runtimeLogger?.warn) runtimeLogger.warn({ code: 'runtime.warning', message: 'Level validation failed.', levelId, errors }); return { level: fallbackLevel, usedFallback: true }; }
  return { level, usedFallback: false };
}

function getNextLevelId(levelId) {
  const currentIndex = playableLevelIds.indexOf(levelId);
  if (currentIndex < 0 || currentIndex >= playableLevelIds.length - 1) {
    return null;
  }

  return playableLevelIds[currentIndex + 1];
}

function hasSavedProgress() {
  return progressRepo.loadSavedLevelId() !== null || progressRepo.loadCompletedLevelIds().length > 0;
}

function resolveContinueLevelId() {
  const savedLevelId = progressRepo.loadSavedLevelId();
  if (savedLevelId) {
    return savedLevelId;
  }

  const completedLevelIds = new Set(progressRepo.loadCompletedLevelIds());
  if (completedLevelIds.size === 0) {
    return null;
  }

  let lastCompletedIndex = -1;
  for (const completedLevelId of completedLevelIds) {
    const levelIndex = playableLevelIds.indexOf(completedLevelId);
    if (levelIndex > lastCompletedIndex) {
      lastCompletedIndex = levelIndex;
    }
  }

  if (lastCompletedIndex < 0) {
    return null;
  }

  return playableLevelIds[lastCompletedIndex + 1] ?? playableLevelIds[lastCompletedIndex] ?? null;
}

function getParentAreaSummary() {
  return createLearningProgressSummary({
    completedLevelIds: progressRepo.loadCompletedLevelIds(),
    levelsById: playableLevelsById
  });
}

function renderActiveTutorialStep() {
  const activeTutorialStep = tutorialController.getCurrentStep();
  if (!activeTutorialStep) {
    shellView.hideTutorial();
    return;
  }

  shellView.renderTutorialStep(activeTutorialStep);
}

function getExecConfig(level) {
  const bnd = (v, fb, lo, hi) => { const n = Number.parseInt(String(v ?? ''), 10); return Number.isInteger(n) && n >= lo && n <= hi ? n : fb; };
  const ov = runtimeConfig.executionOverrides ?? {};
  const lMax = Number.isInteger(level.executionLimits?.maxStepsPerRun) && level.executionLimits.maxStepsPerRun > 0 ? level.executionLimits.maxStepsPerRun : defaultExecCfg.maxStepsPerRun;
  return { maxStepsPerRun: bnd(ov.maximumStepsPerRun, lMax, 1, 300), repeatSelectedBlockCount: bnd(ov.selectedBlockRepeatCount, defaultExecCfg.repeatSelectedBlockCount, 1, 300), stepDelayMilliseconds: bnd(ov.stepDelayMilliseconds, defaultExecCfg.stepDelayMilliseconds, 0, 500) };
}
function setActiveStep(stepId) {
  if (programEditor.getActiveProgramStepId() === stepId) return;
  programEditor.setActiveProgramStep(stepId); workspaceView.render();
}

function restoreProgram(levelId) {
  const { blockTypes, failed } = programRepo.loadProgram(levelId);
  if (!Array.isArray(blockTypes) || !blockTypes.length) return { restored: false, failed };
  const filtered = blockTypes.filter((t) => activeLevel.availableBlocks.includes(t));
  if (!filtered.length) return { restored: false, failed };
  const ok = programEditor.restoreProgram(filtered);
  if (ok) workspaceView.render();
  return { restored: ok, failed: false };
}

async function runRobotSession(runToken, signal, execConfig) {
  const instructions = compileProgram(programEditor.getProgramSteps(), toolboxView.getSelectedBlockType(), execConfig.repeatSelectedBlockCount);
  const result = await runProgram({
    level: activeLevel, instructionSequence: instructions, initialRobotState: robotState,
    initialObjectiveProgress: objectiveProgress, executionConfig: execConfig, delay, signal,
    onEvent: (ev) => {
      if (!runSessionController.isCurrentRunToken(runToken)) return;
      if (ev.type === 'activeStepChanged') { setActiveStep(ev.stepId ?? null); return; }
      if (ev.type === 'robotUpdated') {
        if (ev.animation && (ev.animation.kind === 'move' || ev.animation.kind === 'turn')) {
          audioFeedback.playSoundEffect('movement', { enabled: soundEffectsEnabled });
        }
        robotState = ev.robotState;
        gridView.render(activeLevel, robotState, objectiveProgress, ev.animation);
        return;
      }
      if (ev.type === 'objectiveUpdated') { objectiveProgress = ev.objectiveProgress; metaView.updateCollectionSummary(objectiveProgress); return; }
      if (ev.type === 'statusChanged') {
        if (ev.status === 'collected') {
          audioFeedback.playSoundEffect('collection', { enabled: soundEffectsEnabled });
        }
        if (ev.status === 'levelComplete') {
          const nextLevelId = getNextLevelId(activeLevel.id);
          progressRepo.saveCompletedLevelId(activeLevel.id);
          progressRepo.saveSavedLevelId(nextLevelId ?? activeLevel.id);
          audioFeedback.playLevelCompletionSound({ enabled: soundEffectsEnabled });
          shellView.showLevelCompletion(getNextLevelId(activeLevel.id) !== null);
          shellView.syncPrimaryActions(runSessionController.isRunInProgress());
        }
        statusView.setStatus(ev.status);
      }
    }
  });
  if (runSessionController.isCurrentRunToken(runToken)) { robotState = result.robotState; objectiveProgress = result.objectiveProgress; }
}

function setEditing(enabled) { shellView.setEditingEnabled(enabled, qs('#program-list')); toolboxView.setEnabled(enabled); }

function startRun() {
  const runSession = runSessionController.startRunSession();
  if (!runSession) return;

  const { runToken, signal, controller } = runSession;
  setEditing(false);
  shellView.syncPrimaryActions(true);
  void runRobotSession(runToken, signal, getExecConfig(activeLevel))
    .catch((err) => { if (runSessionController.isCurrentRunToken(runToken)) handleError(err, 'run.session'); })
    .finally(() => {
      runSessionController.finishRunSession({ runToken, controller });
      setActiveStep(null);
      setEditing(true);
      shellView.syncPrimaryActions(false);
    });
}

function cancelActiveRun(nextStatus = null) {
  runSessionController.cancelRunSession();
  setActiveStep(null);
  setEditing(true);
  shellView.syncPrimaryActions(false);
  if (nextStatus) statusView.setStatus(nextStatus);
}

function resetRobotPosition() {
  robotState = createRobotState(activeLevel.robot); objectiveProgress = createObjectiveProgress(activeLevel);
  gridView.render(activeLevel, robotState, objectiveProgress); metaView.updateCollectionSummary(objectiveProgress);
}

function initializeLevel(levelId) {
  currentRequestedLevelId = levelId;
  const { level, usedFallback } = resolveLevel(levelId);
  shellView.hideParentArea();
  shellView.hideLevelCompletion();
  activeLevel = level; robotState = createRobotState(level.robot); objectiveProgress = createObjectiveProgress(level);
  programEditor.reset(); workspaceView.render(); metaView.updateLevelIndicator(level.id);
  gridView.render(level, robotState, objectiveProgress); toolboxView.render(level.availableBlocks);
  const restore = restoreProgram(level.id);
  metaView.updateCollectionSummary(objectiveProgress); metaView.render(level);
  if (usedFallback) { shellView.showLevelError(`${arStrings.levelError.fallbackMessage} ${arStrings.levelError.retryHint}`); statusView.setStatus('fallback'); }
  else { shellView.hideLevelError(); statusView.setStatus(restore.failed ? 'programLoadFailed' : restore.restored ? 'programRestored' : 'idle'); }
}

export function initializeRobotLab(config = createDefaultRuntimeConfig()) {
  if (hasInitialized) return;
  runtimeConfig = config; runtimeLogger = runtimeConfig.logger ?? createConsoleLogger();
  currentRequestedLevelId = typeof runtimeConfig.initialLevelId === 'string' && runtimeConfig.initialLevelId.length > 0 ? runtimeConfig.initialLevelId : fallbackLevel.id;
  attachRuntimeErrorListeners(); shellView.applyStaticLabels(); shellView.attachEvents();
  workspaceView.attachInteractions(); initializeLevel(currentRequestedLevelId); shellView.syncPrimaryActions(false);
  if (tutorialController.openTutorialIfNeeded()) {
    renderActiveTutorialStep();
  } else {
    shellView.hideTutorial();
  }
  hasInitialized = true;
}
