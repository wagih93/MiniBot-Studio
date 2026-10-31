import test from 'node:test';
import assert from 'node:assert/strict';
import { createRobotLabRuntimeController } from '../../../js/features/shell/application/robot-lab-runtime-controller.js';

function createRunSessionControllerStub() {
  let activeToken = 0;
  let runInProgress = false;

  return {
    startRunSession() {
      if (runInProgress) {
        return null;
      }
      activeToken += 1;
      runInProgress = true;
      return { runToken: activeToken, signal: {}, controller: {} };
    },
    finishRunSession({ runToken }) {
      if (runToken === activeToken) {
        runInProgress = false;
      }
    },
    cancelRunSession() {
      activeToken += 1;
      runInProgress = false;
    },
    isCurrentRunToken(runToken) {
      return runToken === activeToken;
    },
    isRunInProgress() {
      return runInProgress;
    }
  };
}

function createControllerHarness({
  loadSavedLevelId = () => null,
  loadCompletedLevelIds = () => [],
  saveSoundEffectsEnabled = () => true,
  clearAppData = () => true,
  runProgram = async () => ({ robotState: { row: 0, column: 0, direction: 'east' }, objectiveProgress: { completed: false } })
} = {}) {
  const levelsById = {
    'level-001': {
      id: 'level-001',
      robot: { row: 0, column: 0, direction: 'east' },
      availableBlocks: ['moveForward'],
      executionLimits: { maxStepsPerRun: 10 }
    },
    'level-002': {
      id: 'level-002',
      robot: { row: 1, column: 1, direction: 'north' },
      availableBlocks: ['moveForward'],
      executionLimits: { maxStepsPerRun: 10 }
    }
  };
  const shellSyncCalls = [];
  const statusCalls = [];
  const saveCompletedCalls = [];
  const saveLevelCalls = [];
  const soundSaveCalls = [];
  const clearCalls = [];
  const setEditingCalls = [];

  const controller = createRobotLabRuntimeController({
    fallbackLevel: levelsById['level-001'],
    defaultExecutionConfig: {
      maxStepsPerRun: 12,
      repeatSelectedBlockCount: 1,
      stepDelayMilliseconds: 220
    },
    playableLevelIds: ['level-001', 'level-002'],
    playableLevelsById: levelsById,
    getLevelById: (levelId) => levelsById[levelId] ?? null,
    validateLevelData: () => ({ isValid: true, errors: [] }),
    createRobotState: (robot) => ({ ...robot }),
    createObjectiveProgress: (level) => ({ levelId: level.id, completed: false }),
    createLearningProgressSummary: ({ completedLevelIds }) => ({
      completedLevelCount: completedLevelIds.length,
      conceptSummaries: []
    }),
    compileProgram: () => [{ type: 'moveForward' }],
    runProgram,
    progressRepository: {
      loadSavedLevelId,
      loadCompletedLevelIds,
      saveCompletedLevelId(levelId) {
        saveCompletedCalls.push(levelId);
        return true;
      },
      saveSavedLevelId(levelId) {
        saveLevelCalls.push(levelId);
        return true;
      }
    },
    programRepository: {
      loadProgram: () => ({ blockTypes: [], failed: false }),
      saveProgram: () => true
    },
    parentSettingsRepository: {
      loadSoundEffectsEnabled: () => true,
      saveSoundEffectsEnabled(value) {
        soundSaveCalls.push(value);
        return saveSoundEffectsEnabled(value);
      }
    },
    appDataRepository: {
      clearAppData() {
        clearCalls.push(true);
        return clearAppData();
      }
    },
    runSessionController: createRunSessionControllerStub(),
    delay: {
      wait: async () => {}
    },
    audioFeedback: {
      playSoundEffect() {},
      playLevelCompletionSound() {}
    },
    programEditor: {
      getProgramSteps: () => [],
      getProgramBlockTypes: () => ['moveForward'],
      getActiveProgramStepId: () => null,
      setActiveProgramStep() {},
      reset() {},
      restoreProgram: () => true
    },
    toolboxView: {
      getSelectedBlockType: () => 'moveForward',
      setEnabled() {},
      render() {}
    },
    workspaceView: {
      render() {},
      attachInteractions() {}
    },
    metaView: {
      updateLevelIndicator() {},
      updateCollectionSummary() {},
      render() {},
      showNextHint: () => ({ wasSpoken: false })
    },
    gridView: {
      render() {}
    },
    shellView: {
      setEditingEnabled(enabled) {
        setEditingCalls.push(enabled);
      },
      syncPrimaryActions(value) {
        shellSyncCalls.push(value);
      },
      hideParentArea() {},
      hideLevelCompletion() {},
      showLevelCompletion() {}
    },
    statusView: {
      setStatus(statusKey) {
        statusCalls.push(statusKey);
      }
    },
    programListElement: {},
    runtimeConfig: { initialLevelId: 'level-001', executionOverrides: {} },
    runtimeLogger: null
  });

  return {
    controller,
    shellSyncCalls,
    statusCalls,
    saveCompletedCalls,
    saveLevelCalls,
    soundSaveCalls,
    clearCalls,
    setEditingCalls
  };
}

test('resolveContinueLevelId prefers saved progress and falls back to highest completed level', () => {
  const withSavedLevel = createControllerHarness({
    loadSavedLevelId: () => 'level-002',
    loadCompletedLevelIds: () => ['level-001']
  });
  assert.equal(withSavedLevel.controller.resolveContinueLevelId(), 'level-002');

  const withCompletedOnly = createControllerHarness({
    loadSavedLevelId: () => null,
    loadCompletedLevelIds: () => ['level-001']
  });
  assert.equal(withCompletedOnly.controller.resolveContinueLevelId(), 'level-002');
});

test('updateSoundEffectsSetting restores previous value when persistence fails', () => {
  const harness = createControllerHarness({
    saveSoundEffectsEnabled: () => false
  });

  const updateResult = harness.controller.updateSoundEffectsSetting(false);

  assert.equal(updateResult.saved, false);
  assert.equal(updateResult.value, true);
  assert.deepEqual(harness.soundSaveCalls, [false]);
  assert.equal(harness.controller.getSoundEffectsEnabled(), true);
});

test('clearProgressAndReset handles confirm, storage, and reset status values', () => {
  const noConfirm = createControllerHarness();
  assert.equal(noConfirm.controller.clearProgressAndReset(undefined, 'confirm', 'level-001'), 'progressClearFailed');

  const cancelled = createControllerHarness();
  assert.equal(cancelled.controller.clearProgressAndReset(() => false, 'confirm', 'level-001'), 'progressClearCancelled');

  const failedClear = createControllerHarness({
    clearAppData: () => false
  });
  assert.equal(failedClear.controller.clearProgressAndReset(() => true, 'confirm', 'level-001'), 'progressClearFailed');

  const success = createControllerHarness();
  assert.equal(success.controller.clearProgressAndReset(() => true, 'confirm', 'level-001'), 'progressCleared');
  assert.equal(success.clearCalls.length, 1);
});

test('startRun toggles controls and persists completion progress', async () => {
  const harness = createControllerHarness({
    runProgram: async ({ onEvent }) => {
      onEvent({ type: 'statusChanged', status: 'levelComplete' });
      return {
        robotState: { row: 0, column: 0, direction: 'east' },
        objectiveProgress: { completed: true }
      };
    }
  });

  harness.controller.initializeLevel('level-001');
  assert.equal(harness.controller.startRun(), true);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(harness.shellSyncCalls, [true, true, false]);
  assert.ok(harness.setEditingCalls.includes(false));
  assert.ok(harness.setEditingCalls.includes(true));
  assert.deepEqual(harness.saveCompletedCalls, ['level-001']);
  assert.deepEqual(harness.saveLevelCalls, ['level-002']);
  assert.ok(harness.statusCalls.includes('levelComplete'));
});
