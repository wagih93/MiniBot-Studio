const emptyObject = Object.freeze({});

export function createRobotLabRuntimeController({
  fallbackLevel,
  defaultExecutionConfig,
  playableLevelIds,
  playableLevelsById,
  getLevelById,
  validateLevelData,
  createRobotState,
  readForwardSensorState,
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
  programListElement,
  onRunError,
  runtimeConfig = emptyObject,
  runtimeLogger = null
}) {
  let activeLevel = fallbackLevel;
  let robotState = createRobotState(fallbackLevel.robot);
  let objectiveProgress = createObjectiveProgress(fallbackLevel);
  let currentRequestedLevelId = fallbackLevel.id;
  let currentRuntimeConfig = runtimeConfig;
  let currentRuntimeLogger = runtimeLogger;
  let soundEffectsEnabled = parentSettingsRepository.loadSoundEffectsEnabled();

  setRuntimeConfig(runtimeConfig);

  function setRuntimeConfig(nextRuntimeConfig) {
    currentRuntimeConfig = nextRuntimeConfig ?? emptyObject;
    const configuredLevelId = typeof currentRuntimeConfig.initialLevelId === 'string'
      && currentRuntimeConfig.initialLevelId.length > 0
      ? currentRuntimeConfig.initialLevelId
      : fallbackLevel.id;
    currentRequestedLevelId = configuredLevelId;
  }

  function setRuntimeLogger(nextRuntimeLogger) {
    currentRuntimeLogger = nextRuntimeLogger;
  }

  function getRuntimeLogger() {
    return currentRuntimeLogger;
  }

  function getCurrentRequestedLevelId() {
    return currentRequestedLevelId;
  }

  function getActiveLevelId() {
    return activeLevel.id;
  }

  function getSoundEffectsEnabled() {
    return soundEffectsEnabled;
  }

  function isHintSpeechEnabled() {
    return currentRuntimeConfig.hintSpeechEnabled === true;
  }

  function hasSavedProgress() {
    return progressRepository.loadSavedLevelId() !== null || progressRepository.loadCompletedLevelIds().length > 0;
  }

  function getNextLevelId(levelId) {
    const currentIndex = playableLevelIds.indexOf(levelId);
    if (currentIndex < 0 || currentIndex >= playableLevelIds.length - 1) {
      return null;
    }

    return playableLevelIds[currentIndex + 1];
  }

  function resolveContinueLevelId() {
    const savedLevelId = progressRepository.loadSavedLevelId();
    if (savedLevelId) {
      return savedLevelId;
    }

    const completedLevelIds = new Set(progressRepository.loadCompletedLevelIds());
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
      completedLevelIds: progressRepository.loadCompletedLevelIds(),
      levelsById: playableLevelsById
    });
  }

  function getParentAreaViewModel() {
    return {
      soundEffectsEnabled,
      summary: getParentAreaSummary()
    };
  }

  function updateSoundEffectsSetting(enabled) {
    const previousValue = soundEffectsEnabled;
    soundEffectsEnabled = enabled === true;

    if (!parentSettingsRepository.saveSoundEffectsEnabled(soundEffectsEnabled)) {
      soundEffectsEnabled = previousValue;
      return {
        saved: false,
        value: previousValue
      };
    }

    return {
      saved: true,
      value: soundEffectsEnabled
    };
  }

  function clearProgressAndReset(confirmAction, confirmationMessage, firstLevelId) {
    if (typeof confirmAction !== 'function') {
      return 'progressClearFailed';
    }

    if (!confirmAction(confirmationMessage)) {
      return 'progressClearCancelled';
    }

    if (!appDataRepository.clearAppData()) {
      return 'progressClearFailed';
    }

    soundEffectsEnabled = parentSettingsRepository.loadSoundEffectsEnabled();
    cancelActiveRun();
    initializeLevel(firstLevelId);
    shellView.syncPrimaryActions(false);
    shellView.hideParentArea();
    return 'progressCleared';
  }

  function resolveLevel(levelId) {
    const override = Array.isArray(currentRuntimeConfig.levelOverrides)
      ? currentRuntimeConfig.levelOverrides.find((levelEntry) => levelEntry.id === levelId)
      : null;
    const level = override ?? getLevelById(levelId);
    if (!level) {
      if (currentRuntimeLogger?.warn) {
        currentRuntimeLogger.warn({ code: 'runtime.warning', message: 'Requested level not found.', levelId });
      }
      return { level: fallbackLevel, usedFallback: true };
    }
    const { isValid, errors } = validateLevelData(level);
    if (!isValid) {
      if (currentRuntimeLogger?.warn) {
        currentRuntimeLogger.warn({ code: 'runtime.warning', message: 'Level validation failed.', levelId, errors });
      }
      return { level: fallbackLevel, usedFallback: true };
    }
    return { level, usedFallback: false };
  }

  function setActiveStep(stepId) {
    if (programEditor.getActiveProgramStepId() === stepId) {
      return;
    }
    programEditor.setActiveProgramStep(stepId);
    workspaceView.render();
  }

  function setEditing(enabled) {
    shellView.setEditingEnabled(enabled, programListElement);
    toolboxView.setEnabled(enabled);
  }

  function restoreProgram(levelId) {
    const { blockTypes, failed } = programRepository.loadProgram(levelId);
    if (!Array.isArray(blockTypes) || blockTypes.length === 0) {
      return { restored: false, failed };
    }
    const filteredBlockTypes = blockTypes.filter((blockType) => activeLevel.availableBlocks.includes(blockType));
    if (filteredBlockTypes.length === 0) {
      return { restored: false, failed };
    }
    const restored = programEditor.restoreProgram(filteredBlockTypes);
    if (restored) {
      workspaceView.render();
    }
    return { restored, failed: false };
  }

  function getExecutionConfig(level) {
    const boundsNumber = (value, fallback, minimum, maximum) => {
      const normalized = Number.parseInt(String(value ?? ''), 10);
      return Number.isInteger(normalized) && normalized >= minimum && normalized <= maximum ? normalized : fallback;
    };
    const executionOverrides = currentRuntimeConfig.executionOverrides ?? emptyObject;
    const levelMaxSteps = Number.isInteger(level.executionLimits?.maxStepsPerRun) && level.executionLimits.maxStepsPerRun > 0
      ? level.executionLimits.maxStepsPerRun
      : defaultExecutionConfig.maxStepsPerRun;
    return {
      maxStepsPerRun: boundsNumber(executionOverrides.maximumStepsPerRun, levelMaxSteps, 1, 300),
      repeatSelectedBlockCount: boundsNumber(executionOverrides.selectedBlockRepeatCount, defaultExecutionConfig.repeatSelectedBlockCount, 1, 300),
      stepDelayMilliseconds: boundsNumber(executionOverrides.stepDelayMilliseconds, defaultExecutionConfig.stepDelayMilliseconds, 0, 500)
    };
  }

  function initializeLevel(levelId) {
    currentRequestedLevelId = levelId;
    const { level, usedFallback } = resolveLevel(levelId);
    shellView.hideParentArea();
    shellView.hideLevelCompletion();
    activeLevel = level;
    robotState = createRobotState(level.robot);
    objectiveProgress = createObjectiveProgress(level);
    programEditor.reset();
    workspaceView.render();
    metaView.updateLevelIndicator(level.id);
    gridView.render(level, robotState, objectiveProgress);
    toolboxView.render(level.availableBlocks);
    const restoreResult = restoreProgram(level.id);
    metaView.updateCollectionSummary(objectiveProgress);
    metaView.updateSensorState(readForwardSensorState(activeLevel, robotState));
    metaView.render(level);
    if (usedFallback) {
      return {
        status: 'fallback',
        restoreResult,
        usedFallback: true
      };
    }
    return {
      status: restoreResult.failed ? 'programLoadFailed' : restoreResult.restored ? 'programRestored' : 'idle',
      restoreResult,
      usedFallback: false
    };
  }

  async function runRobotSession(runToken, signal, executionConfig) {
    const instructions = compileProgram(
      programEditor.getProgramSteps(),
      toolboxView.getSelectedBlockType(),
      executionConfig.repeatSelectedBlockCount
    );
    const result = await runProgram({
      level: activeLevel,
      instructionSequence: instructions,
      initialRobotState: robotState,
      initialObjectiveProgress: objectiveProgress,
      executionConfig,
      delay,
      signal,
      onEvent: (event) => {
        if (!runSessionController.isCurrentRunToken(runToken)) {
          return;
        }
        if (event.type === 'activeStepChanged') {
          setActiveStep(event.stepId ?? null);
          return;
        }
        if (event.type === 'robotUpdated') {
          if (event.animation && (event.animation.kind === 'move' || event.animation.kind === 'turn')) {
            audioFeedback.playSoundEffect('movement', { enabled: soundEffectsEnabled });
          }
          robotState = event.robotState;
          gridView.render(activeLevel, robotState, objectiveProgress, event.animation);
          metaView.updateSensorState(readForwardSensorState(activeLevel, robotState));
          return;
        }
        if (event.type === 'objectiveUpdated') {
          objectiveProgress = event.objectiveProgress;
          metaView.updateCollectionSummary(objectiveProgress);
          return;
        }
        if (event.type === 'statusChanged') {
          if (event.status === 'collected') {
            audioFeedback.playSoundEffect('collection', { enabled: soundEffectsEnabled });
          }
          if (event.status === 'levelComplete') {
            const nextLevelId = getNextLevelId(activeLevel.id);
            const shouldPersistProgress = playableLevelIds.includes(activeLevel.id);
            let completedSaved = true;
            let nextLevelSaved = true;
            if (shouldPersistProgress) {
              completedSaved = progressRepository.saveCompletedLevelId(activeLevel.id);
              nextLevelSaved = progressRepository.saveSavedLevelId(nextLevelId ?? activeLevel.id);
            }
            audioFeedback.playLevelCompletionSound({ enabled: soundEffectsEnabled });
            shellView.showLevelCompletion(nextLevelId !== null);
            shellView.syncPrimaryActions(runSessionController.isRunInProgress());
            if (!completedSaved || !nextLevelSaved) {
              statusView.setStatus('progressSaveFailed');
              return;
            }
          }
          statusView.setStatus(event.status);
        }
      }
    });

    if (runSessionController.isCurrentRunToken(runToken)) {
      robotState = result.robotState;
      objectiveProgress = result.objectiveProgress;
    }
  }

  function startRun() {
    const runSession = runSessionController.startRunSession();
    if (!runSession) {
      return false;
    }

    const { runToken, signal, controller } = runSession;
    setEditing(false);
    shellView.syncPrimaryActions(true);
    void runRobotSession(runToken, signal, getExecutionConfig(activeLevel))
      .catch((error) => {
        if (runSessionController.isCurrentRunToken(runToken) && typeof onRunError === 'function') {
          onRunError(error, 'run.session');
        }
      })
      .finally(() => {
        runSessionController.finishRunSession({ runToken, controller });
        setActiveStep(null);
        setEditing(true);
        shellView.syncPrimaryActions(false);
      });
    return true;
  }

  function cancelActiveRun(nextStatus = null) {
    runSessionController.cancelRunSession();
    setActiveStep(null);
    setEditing(true);
    shellView.syncPrimaryActions(false);
    if (nextStatus) {
      statusView.setStatus(nextStatus);
    }
  }

  function resetRobotPosition() {
    robotState = createRobotState(activeLevel.robot);
    objectiveProgress = createObjectiveProgress(activeLevel);
    gridView.render(activeLevel, robotState, objectiveProgress);
    metaView.updateCollectionSummary(objectiveProgress);
    metaView.updateSensorState(readForwardSensorState(activeLevel, robotState));
  }

  function goToNextLevel() {
    const nextLevelId = getNextLevelId(activeLevel.id);
    if (!nextLevelId) {
      return false;
    }
    cancelActiveRun();
    initializeLevel(nextLevelId);
    return true;
  }

  return Object.freeze({
    setRuntimeConfig,
    setRuntimeLogger,
    getRuntimeLogger,
    getCurrentRequestedLevelId,
    getActiveLevelId,
    getSoundEffectsEnabled,
    isHintSpeechEnabled,
    hasSavedProgress,
    resolveContinueLevelId,
    getParentAreaViewModel,
    updateSoundEffectsSetting,
    clearProgressAndReset,
    initializeLevel,
    startRun,
    cancelActiveRun,
    resetRobotPosition,
    goToNextLevel
  });
}
