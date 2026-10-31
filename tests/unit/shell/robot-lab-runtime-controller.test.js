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
  initialSoundEffectsEnabled = true,
  loadRobotAppearance = () => null,
  saveSoundEffectsEnabled = () => true,
  saveRobotAppearance = () => true,
  clearAppData = () => true,
  runProgram = async () => ({ robotState: { row: 0, column: 0, direction: 'east' }, objectiveProgress: { completed: false } })
} = {}) {
  const levelsById = {
    'level-001': {
      id: 'level-001',
      grid: { rows: 4, columns: 4 },
      robot: { row: 0, column: 0, direction: 'east' },
      collectibles: [{ row: 0, column: 3 }],
      obstacles: [],
      availableBlocks: ['moveForward'],
      successConditions: { collectAllCollectibles: true },
      hints: ['hint'],
      executionLimits: { maxStepsPerRun: 10 }
    },
    'level-002': {
      id: 'level-002',
      grid: { rows: 5, columns: 5 },
      robot: { row: 1, column: 1, direction: 'north' },
      collectibles: [{ row: 4, column: 4 }],
      obstacles: [{ row: 1, column: 2 }],
      availableBlocks: ['moveForward'],
      successConditions: { collectAllCollectibles: true },
      hints: ['hint'],
      executionLimits: { maxStepsPerRun: 10 }
    }
  };
  const shellSyncCalls = [];
  const statusCalls = [];
  const saveCompletedCalls = [];
  const saveLevelCalls = [];
  const soundSaveCalls = [];
  const appearanceSaveCalls = [];
  const clearCalls = [];
  const setEditingCalls = [];
  const soundEffectCalls = [];

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
    normalizeRobotAppearance: (appearance) => ({
      design: appearance?.design === 'explorer' || appearance?.design === 'turbo' ? appearance.design : 'classic',
      color: appearance?.color === 'green' || appearance?.color === 'purple' ? appearance.color : 'blue'
    }),
    readForwardSensorState: () => 'clear',
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
      loadSoundEffectsEnabled: () => initialSoundEffectsEnabled,
      loadRobotAppearance,
      saveSoundEffectsEnabled(value) {
        soundSaveCalls.push(value);
        return saveSoundEffectsEnabled(value);
      },
      saveRobotAppearance(appearance) {
        appearanceSaveCalls.push(appearance);
        return saveRobotAppearance(appearance);
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
      playSoundEffect(effectType, options) {
        soundEffectCalls.push({ effectType, options });
        return true;
      },
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
      updateSensorState() {},
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
    appearanceSaveCalls,
    soundEffectCalls,
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

test('free-play lab applies safe edits and blocks invalid placements', () => {
  const harness = createControllerHarness();

  harness.controller.initializeLevel('free-play-lab');
  assert.equal(harness.controller.isFreePlayLabActive(), true);

  assert.equal(harness.controller.setFreePlayMode('obstacle'), true);
  const obstaclePlacement = harness.controller.applyFreePlayEdit(0, 1);
  assert.deepEqual(obstaclePlacement, { applied: true, status: 'labEditApplied' });

  assert.equal(harness.controller.setFreePlayMode('robot'), true);
  const invalidRobotPlacement = harness.controller.applyFreePlayEdit(0, 1);
  assert.deepEqual(invalidRobotPlacement, { applied: false, status: 'labEditInvalid' });

  const validRobotPlacement = harness.controller.applyFreePlayEdit(2, 2);
  assert.deepEqual(validRobotPlacement, { applied: true, status: 'labEditApplied' });

  assert.equal(harness.controller.setFreePlayMode('invalid-mode'), false);
});

test('free-play completion does not save story progress', async () => {
  const harness = createControllerHarness({
    runProgram: async ({ onEvent }) => {
      onEvent({ type: 'statusChanged', status: 'levelComplete' });
      return {
        robotState: { row: 0, column: 0, direction: 'east' },
        objectiveProgress: { completed: true }
      };
    }
  });

  harness.controller.initializeLevel('free-play-lab');
  assert.equal(harness.controller.startRun(), true);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(harness.saveCompletedCalls, []);
  assert.deepEqual(harness.saveLevelCalls, []);
});

test('sound block requests play audio and reports visual status when sound is enabled', async () => {
  const harness = createControllerHarness({
    runProgram: async ({ onEvent }) => {
      onEvent({ type: 'soundEffectRequested', effectType: 'interaction' });
      return {
        robotState: { row: 0, column: 0, direction: 'east', lightOn: false },
        objectiveProgress: { completed: false }
      };
    }
  });

  harness.controller.initializeLevel('level-001');
  assert.equal(harness.controller.startRun(), true);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.ok(harness.statusCalls.includes('soundPlayed'));
  assert.deepEqual(harness.soundEffectCalls, [{ effectType: 'interaction', options: { enabled: true } }]);
});

test('sound block shows muted feedback without requesting audio when muted', async () => {
  const harness = createControllerHarness({
    initialSoundEffectsEnabled: false,
    runProgram: async ({ onEvent }) => {
      onEvent({ type: 'soundEffectRequested', effectType: 'interaction' });
      return {
        robotState: { row: 0, column: 0, direction: 'east', lightOn: false },
        objectiveProgress: { completed: false }
      };
    }
  });

  harness.controller.initializeLevel('level-001');
  assert.equal(harness.controller.startRun(), true);
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.ok(harness.statusCalls.includes('soundMuted'));
  assert.deepEqual(harness.soundEffectCalls, []);
});

test('updateRobotAppearance normalizes values and persists preferences', () => {
  const harness = createControllerHarness({
    loadRobotAppearance: () => ({ design: 'invalid', color: 'unknown' })
  });

  assert.deepEqual(harness.controller.getRobotAppearance(), { design: 'classic', color: 'blue' });

  const updateResult = harness.controller.updateRobotAppearance({ design: 'explorer', color: 'purple' });

  assert.equal(updateResult.saved, true);
  assert.deepEqual(updateResult.appearance, { design: 'explorer', color: 'purple' });
  assert.deepEqual(harness.appearanceSaveCalls, [{ design: 'explorer', color: 'purple' }]);
});

test('updateRobotAppearance reports save failure and keeps previous appearance', () => {
  const harness = createControllerHarness({
    saveRobotAppearance: () => false
  });

  const updateResult = harness.controller.updateRobotAppearance({ design: 'explorer' });

  assert.equal(updateResult.saved, false);
  assert.deepEqual(updateResult.appearance, { design: 'classic', color: 'blue' });
});
