import { arStrings } from './shared/i18n/ar.js';
import { getLevelById, listLevelIds, validateLevelData, createLevelMetaView } from './features/levels/index.js';
import { createRobotState, createWorldGridView } from './features/robot-simulation/index.js';
import { createLocalStorageProgramRepository, createLocalStorageProgressRepository } from './features/learning-progress/index.js';
import { createProgramEditor, createProgramWorkspaceView, createBlockToolboxView } from './features/program-editing/index.js';
import { compileProgram, createObjectiveProgress, getCollectedCollectibleCount, isCollectibleCollected, runProgram, createExecutionStatusView } from './features/program-execution/index.js';
import { createConsoleLogger, reportRuntimeError, createShellView } from './features/shell/index.js';
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
const progressRepo = createLocalStorageProgressRepository({ allowedLevelIds: playableLevelIds });
const programRepo = createLocalStorageProgramRepository({ allowedLevelIds: playableLevelIds });
const delay = createAbortSignalDelay();
let activeRunToken = 0;
let activeRunController = null;
let activeLevel = fallbackLevel;
let robotState = createRobotState(fallbackLevel.robot);
let objectiveProgress = createObjectiveProgress(fallbackLevel);
let isRunInProgress = false;
let runtimeConfig = createDefaultRuntimeConfig();
let runtimeLogger = createConsoleLogger();
let runtimeErrorListenersAttached = false;
let hasInitialized = false;
let currentRequestedLevelId = runtimeConfig.initialLevelId;

const programEditor = createProgramEditor(fallbackLevel.availableBlocks);
const statusView = createExecutionStatusView({ statusElement: qs('#status'), labels: arStrings.status });
const gridView = createWorldGridView({ worldGridElement: qs('#world-grid'), isCollectibleCollected });
const toolboxView = createBlockToolboxView({
  blockListElement: qs('#block-list'), labels: arStrings.blockArea, programEditor,
  isRunInProgress: () => isRunInProgress,
  onBlockSelected: (_t, label) => statusView.setBlockSelected(label),
  onTouchAdd: (blockType) => {
    if (programEditor.addProgramStep(blockType)) { workspaceView.render(); statusView.setStatus('programUpdated'); }
  }
});
const workspaceView = createProgramWorkspaceView({
  programWorkspaceElement: qs('#program-workspace'), programListElement: qs('#program-list'),
  programDemoElement: qs('#program-demo'), getProgramEditor: () => programEditor,
  getBlockPresentation: (t) => ({ label: arStrings.blockArea.labelsByType[t] ?? t, icon: arStrings.blockArea.iconsByType?.[t] ?? '⬜' }),
  deleteStepLabel: arStrings.controls.deleteStep, emptyProgramLabel: arStrings.blockArea.emptyProgram,
  isRunInProgress: () => isRunInProgress, isFirstLevel: () => activeLevel.id === 'level-001',
  onInvalidDrop: () => statusView.setStatus('invalidDrop'), onProgramChanged: () => statusView.setStatus('programUpdated'),
  onProgramRemoved: () => statusView.setStatus('programRemoved'), onProgramReordered: () => statusView.setStatus('programReordered')
});
const metaView = createLevelMetaView({
  levelHintElement: qs('#level-hint'), objectiveConditionElement: qs('#success-condition'),
  collectionSummaryElement: qs('#collection-summary'), levelIndicatorElement: qs('#level-indicator'),
  labels: arStrings.levelMeta, playableLevelIds, getCollectedCollectibleCount
});
const shellView = createShellView({
  elements: {
    startButton: qs('#start-button'), continueButton: qs('#continue-button'), parentsButton: qs('#parents-button'),
    playButton: qs('#play-button'), stopButton: qs('#stop-button'), resetButton: qs('#reset-button'),
    retryLevelButton: qs('#retry-level-button'), returnHomeButton: qs('#return-home-button'),
    saveProgramButton: qs('#save-program-button'), programWorkspaceElement: qs('#program-workspace'),
    levelErrorElement: qs('#level-error'), levelErrorMessageElement: qs('#level-error-message')
  },
  labels: arStrings,
  readHasSavedProgress: () => progressRepo.loadSavedLevelId() !== null,
  onPlay: startRun,
  onStop: () => cancelActiveRun('stopped'),
  onReset: () => { cancelActiveRun(); resetRobotPosition(); statusView.setStatus('reset'); },
  onStart: () => { cancelActiveRun(); initializeLevel(playableLevelIds[0] ?? 'level-001'); },
  onContinue: () => {
    const savedId = progressRepo.loadSavedLevelId();
    if (!savedId) { statusView.setStatus('continueUnavailable'); return; }
    cancelActiveRun(); initializeLevel(savedId);
  },
  onParents: () => statusView.setStatus('parentsAreaPending'),
  onRetry: () => { cancelActiveRun(); initializeLevel(currentRequestedLevelId); },
  onReturnHome: () => { cancelActiveRun(); initializeLevel(playableLevelIds[0] ?? 'level-001'); },
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
      if (runToken !== activeRunToken) return;
      if (ev.type === 'activeStepChanged') { setActiveStep(ev.stepId ?? null); return; }
      if (ev.type === 'robotUpdated') { robotState = ev.robotState; gridView.render(activeLevel, robotState, objectiveProgress, ev.animation); return; }
      if (ev.type === 'objectiveUpdated') { objectiveProgress = ev.objectiveProgress; metaView.updateCollectionSummary(objectiveProgress); return; }
      if (ev.type === 'statusChanged') {
        if (ev.status === 'levelComplete') { progressRepo.saveSavedLevelId(activeLevel.id); shellView.syncPrimaryActions(isRunInProgress); }
        statusView.setStatus(ev.status);
      }
    }
  });
  if (runToken === activeRunToken) { robotState = result.robotState; objectiveProgress = result.objectiveProgress; }
}

function setEditing(enabled) { shellView.setEditingEnabled(enabled, qs('#program-list')); toolboxView.setEnabled(enabled); }

function startRun() {
  if (isRunInProgress) return;
  activeRunToken += 1;
  if (activeRunController) activeRunController.abort();
  const runToken = activeRunToken;
  const controller = new AbortController();
  activeRunController = controller;
  isRunInProgress = true;
  setEditing(false);
  void runRobotSession(runToken, controller.signal, getExecConfig(activeLevel))
    .catch((err) => { if (runToken === activeRunToken) handleError(err, 'run.session'); })
    .finally(() => { isRunInProgress = false; setActiveStep(null); setEditing(true); if (runToken === activeRunToken && activeRunController === controller) activeRunController = null; });
}

function cancelActiveRun(nextStatus = null) {
  activeRunToken += 1;
  if (activeRunController) { activeRunController.abort(); activeRunController = null; }
  isRunInProgress = false; setActiveStep(null); setEditing(true);
  if (nextStatus) statusView.setStatus(nextStatus);
}

function resetRobotPosition() {
  robotState = createRobotState(activeLevel.robot); objectiveProgress = createObjectiveProgress(activeLevel);
  gridView.render(activeLevel, robotState, objectiveProgress); metaView.updateCollectionSummary(objectiveProgress);
}

function initializeLevel(levelId) {
  currentRequestedLevelId = levelId;
  const { level, usedFallback } = resolveLevel(levelId);
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
  hasInitialized = true;
}
