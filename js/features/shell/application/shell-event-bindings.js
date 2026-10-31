export function createShellEventBindings({
  readRuntimeController,
  readShellView,
  statusView,
  tutorialController,
  renderActiveTutorialStep,
  audioFeedback,
  metaView,
  labels,
  playableLevelIds,
  programRepository,
  programEditor,
  openLevel,
  readInstructionText
}) {
  return {
    readHasSavedProgress: () => readRuntimeController().hasSavedProgress(),
    onPlay: () => readRuntimeController().startRun(),
    onStop: () => readRuntimeController().cancelActiveRun('stopped'),
    onReset: () => {
      readRuntimeController().cancelActiveRun();
      readRuntimeController().resetRobotPosition();
      statusView.setStatus('reset');
    },
    onStart: () => {
      readRuntimeController().cancelActiveRun();
      openLevel(playableLevelIds[0] ?? 'level-001');
    },
    onContinue: () => {
      const continueLevelId = readRuntimeController().resolveContinueLevelId();
      if (!continueLevelId) {
        statusView.setStatus('continueUnavailable');
        return;
      }
      readRuntimeController().cancelActiveRun();
      openLevel(continueLevelId);
    },
    onParents: () => {
      const parentAreaViewModel = readRuntimeController().getParentAreaViewModel();
      readShellView().setSoundEffectsEnabled(parentAreaViewModel.soundEffectsEnabled);
      readShellView().renderParentAreaSummary(parentAreaViewModel.summary);
      readShellView().showParentArea();
      statusView.setStatus('parentsAreaOpen');
    },
    onCloseParentsArea: () => {
      readShellView().hideParentArea();
      statusView.setStatus('idle');
    },
    onClearProgress: () => {
      const statusKey = readRuntimeController().clearProgressAndReset(
        globalThis.confirm,
        labels.parentArea.clearProgressConfirm,
        playableLevelIds[0] ?? 'level-001'
      );
      readShellView().setSoundEffectsEnabled(readRuntimeController().getSoundEffectsEnabled());
      statusView.setStatus(statusKey);
    },
    onToggleSoundEffects: (enabled) => {
      const updateResult = readRuntimeController().updateSoundEffectsSetting(enabled);
      if (!updateResult.saved) {
        readShellView().setSoundEffectsEnabled(updateResult.value);
        statusView.setStatus('soundEffectsSaveFailed');
        return;
      }
      statusView.setStatus(updateResult.value ? 'soundEffectsEnabled' : 'soundEffectsDisabled');
    },
    onOpenTutorial: () => {
      tutorialController.replayTutorial();
      renderActiveTutorialStep();
    },
    onTutorialNext: () => {
      const nextStep = tutorialController.nextStep();
      if (nextStep.completed) {
        readShellView().hideTutorial();
        return;
      }
      if (nextStep.step) {
        renderActiveTutorialStep();
      }
    },
    onTutorialSkip: () => {
      if (tutorialController.skipTutorial()) {
        readShellView().hideTutorial();
      }
    },
    onTutorialClose: () => {
      tutorialController.closeTutorial();
      readShellView().hideTutorial();
    },
    onPlayTutorialAudio: () => {
      const activeStep = tutorialController.getCurrentStep();
      if (!activeStep) {
        statusView.setStatus('instructionSpeechUnavailable');
        return;
      }
      if (!readRuntimeController().getSoundEffectsEnabled()) {
        statusView.setStatus('instructionAudioMuted');
        return;
      }
      const spoken = audioFeedback.speakInstruction(activeStep.description, { enabled: readRuntimeController().getSoundEffectsEnabled() });
      statusView.setStatus(spoken ? 'tutorialSpoken' : 'instructionSpeechUnavailable');
    },
    onHint: () => {
      const hintResult = metaView.showNextHint({
        speakHint: (hintText) => audioFeedback.speakHint(hintText, {
          enabled: readRuntimeController().getSoundEffectsEnabled(),
          hintSpeechEnabled: readRuntimeController().isHintSpeechEnabled()
        })
      });
      statusView.setStatus(hintResult.wasSpoken ? 'hintSpoken' : 'hintShown');
    },
    onPlayInstructionAudio: () => {
      if (!readRuntimeController().getSoundEffectsEnabled()) {
        statusView.setStatus('instructionAudioMuted');
        return;
      }
      const spoken = audioFeedback.speakInstruction(readInstructionText(), { enabled: readRuntimeController().getSoundEffectsEnabled() });
      statusView.setStatus(spoken ? 'instructionSpoken' : 'instructionSpeechUnavailable');
    },
    onRetry: () => {
      readRuntimeController().cancelActiveRun();
      openLevel(readRuntimeController().getCurrentRequestedLevelId());
    },
    onReturnHome: () => {
      readRuntimeController().cancelActiveRun();
      openLevel(playableLevelIds[0] ?? 'level-001');
    },
    onNextLevel: () => {
      readRuntimeController().goToNextLevel();
    },
    onSaveProgram: () => {
      const saved = programRepository.saveProgram(readRuntimeController().getActiveLevelId(), programEditor.getProgramBlockTypes());
      statusView.setStatus(saved ? 'programSaved' : 'programSaveFailed');
    }
  };
}
