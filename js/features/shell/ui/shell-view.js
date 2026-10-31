export function createShellView({
  elements,
  labels,
  readHasSavedProgress,
  onPlay,
  onStop,
  onReset,
  onStart,
  onContinue,
  onParents,
  onCloseParentsArea,
  onClearProgress,
  onToggleSoundEffects,
  onPlayInstructionAudio,
  onOpenLab,
  onOpenTutorial,
  onSelectLabRobotMode,
  onSelectLabObstacleMode,
  onLabCellSelected,
  onTutorialNext,
  onTutorialSkip,
  onTutorialClose,
  onPlayTutorialAudio,
  onHint,
  onRetry,
  onReturnHome,
  onSaveProgram,
  onNextLevel
}) {
  const {
    startButton, continueButton, parentsButton, tutorialButton, labButton,
    playButton, stopButton, resetButton, nextLevelButton,
    retryLevelButton, returnHomeButton, saveProgramButton, hintButton, playInstructionAudioButton,
    worldGridElement, labControlsElement, labControlsHeadingElement, labModeRobotButton, labModeObstacleButton,
    parentAreaElement, parentProgressSummaryElement, parentConceptListElement,
    soundEffectsToggle,
    clearProgressButton, closeParentAreaButton,
    tutorialPanelElement, tutorialStepIndicatorElement, tutorialHeadingElement,
    tutorialBodyElement, tutorialNextButton, tutorialSkipButton, tutorialCloseButton,
    tutorialAudioButton, blockListElement,
    programWorkspaceElement, levelErrorElement, levelErrorMessageElement,
    levelCompletionElement, levelCompletionMessageElement
  } = elements;

  const tutorialFocusTargets = [blockListElement, programWorkspaceElement, playButton];

  function applyStaticLabels() {
    document.title = labels.pageTitle;
    document.querySelector('#app-heading').textContent = labels.heading;
    document.querySelector('#start-button-label').textContent = labels.primaryActions.start;
    document.querySelector('#continue-button-label').textContent = labels.primaryActions.continue;
    document.querySelector('#parents-button-label').textContent = labels.primaryActions.parents;
    document.querySelector('#tutorial-button-label').textContent = labels.tutorial.replay;
    const labButtonLabelElement = document.querySelector('#lab-button-label');
    if (labButtonLabelElement) {
      labButtonLabelElement.textContent = labels.primaryActions.lab ?? labels.primaryActions.start;
    }
    document.querySelector('#parent-area-heading').textContent = labels.parentArea.heading;
    document.querySelector('#parent-area-description').textContent = labels.parentArea.description;
    document.querySelector('#sound-effects-label').textContent = labels.parentArea.soundEffectsLabel;
    clearProgressButton.textContent = labels.controls.clearProgress;
    closeParentAreaButton.textContent = labels.controls.closeParentArea;
    document.querySelector('#world-heading').textContent = labels.world.heading;
    hintButton.textContent = labels.controls.hint;
    playInstructionAudioButton.textContent = labels.controls.playInstructionAudio;
    document.querySelector('#block-area-heading').textContent = labels.blockArea.heading;
    document.querySelector('#program-heading').textContent = labels.blockArea.programHeading;
    document.querySelector('#program-demo').textContent = labels.blockArea.firstLevelDemo;
    saveProgramButton.textContent = labels.controls.saveProgram;
    if (labControlsHeadingElement) {
      labControlsHeadingElement.textContent = labels.freePlayLab?.heading ?? '';
    }
    if (labModeRobotButton) {
      labModeRobotButton.textContent = labels.freePlayLab?.modeRobot ?? '';
    }
    if (labModeObstacleButton) {
      labModeObstacleButton.textContent = labels.freePlayLab?.modeObstacle ?? '';
    }
    document.querySelector('#movement-heading').textContent = labels.movementGuideHeading;
    document.querySelector('#move-forward-label').textContent = labels.movement.forward;
    document.querySelector('#turn-right-label').textContent = labels.movement.right;
    document.querySelector('#turn-left-label').textContent = labels.movement.left;
    playButton.textContent = labels.controls.play;
    stopButton.textContent = labels.controls.stop;
    resetButton.textContent = labels.controls.reset;
    nextLevelButton.textContent = labels.controls.nextLevel;
    retryLevelButton.textContent = labels.controls.retryLevel;
    returnHomeButton.textContent = labels.controls.returnHome;
    tutorialSkipButton.textContent = labels.tutorial.skip;
    tutorialCloseButton.textContent = labels.tutorial.close;
    tutorialAudioButton.textContent = labels.tutorial.playAudio;
  }

  function syncPrimaryActions(isRunning) {
    const hasSaved = readHasSavedProgress();
    continueButton.hidden = !hasSaved;
    startButton.disabled = isRunning;
    continueButton.disabled = isRunning || !hasSaved;
    parentsButton.disabled = isRunning;
    tutorialButton.disabled = isRunning;
    if (labButton) {
      labButton.disabled = isRunning;
    }
    playInstructionAudioButton.disabled = isRunning;
    nextLevelButton.disabled = isRunning || nextLevelButton.hidden;
  }

  function setEditingEnabled(enabled, programListElement) {
    playButton.disabled = !enabled;
    nextLevelButton.disabled = !enabled || nextLevelButton.hidden;
    retryLevelButton.disabled = !enabled;
    returnHomeButton.disabled = !enabled;
    saveProgramButton.disabled = !enabled;
    for (const btn of programListElement.querySelectorAll('.program-step__remove')) btn.disabled = !enabled;
    if (labModeRobotButton) {
      labModeRobotButton.disabled = !enabled;
    }
    if (labModeObstacleButton) {
      labModeObstacleButton.disabled = !enabled;
    }
    programWorkspaceElement.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  }

  function setLabControlsState(visible, selectedMode) {
    if (!labControlsElement) {
      return;
    }

    labControlsElement.hidden = visible !== true;
    if (!labModeRobotButton || !labModeObstacleButton) {
      return;
    }

    const isRobotMode = selectedMode === 'robot';
    labModeRobotButton.dataset.selected = isRobotMode ? 'true' : 'false';
    labModeObstacleButton.dataset.selected = isRobotMode ? 'false' : 'true';
  }

  function showLevelError(message) {
    levelErrorElement.hidden = false;
    levelErrorMessageElement.textContent = message;
  }

  function hideLevelError() {
    levelErrorElement.hidden = true;
    levelErrorMessageElement.textContent = '';
  }

  function showLevelCompletion(canGoToNextLevel) {
    levelCompletionElement.hidden = false;
    levelCompletionMessageElement.textContent = canGoToNextLevel
      ? labels.levelCompletion.message
      : labels.levelCompletion.finalLevelMessage;
    nextLevelButton.hidden = !canGoToNextLevel;
    nextLevelButton.disabled = !canGoToNextLevel;
  }

  function hideLevelCompletion() {
    levelCompletionElement.hidden = true;
    levelCompletionMessageElement.textContent = '';
    nextLevelButton.hidden = true;
    nextLevelButton.disabled = true;
  }

  function showParentArea() {
    parentAreaElement.hidden = false;
  }

  function hideParentArea() {
    parentAreaElement.hidden = true;
  }

  function setSoundEffectsEnabled(enabled) {
    soundEffectsToggle.checked = enabled === true;
  }

  function renderParentAreaSummary(summary) {
    const completedLevelCount = Number.isInteger(summary?.completedLevelCount)
      ? summary.completedLevelCount
      : 0;
    const conceptSummaries = Array.isArray(summary?.conceptSummaries)
      ? summary.conceptSummaries
      : [];

    parentProgressSummaryElement.textContent = labels.parentArea.completedLevelsTemplate
      .replace('{count}', String(completedLevelCount));
    parentConceptListElement.textContent = '';

    for (const conceptSummary of conceptSummaries) {
      const learningConceptLabel = labels.parentArea.learningConceptLabels?.[conceptSummary.conceptKey]
        ?? conceptSummary.conceptKey;
      const completedCount = Number.isInteger(conceptSummary.completedLevelCount)
        ? conceptSummary.completedLevelCount
        : 0;
      const conceptItem = document.createElement('li');
      conceptItem.textContent = labels.parentArea.conceptCountTemplate
        .replace('{concept}', learningConceptLabel)
        .replace('{count}', String(completedCount));
      parentConceptListElement.append(conceptItem);
    }
  }

  function clearTutorialFocus() {
    for (const focusTarget of tutorialFocusTargets) {
      if (!focusTarget) {
        continue;
      }
      if (typeof focusTarget.removeAttribute === 'function') {
        focusTarget.removeAttribute('data-tutorial-focus');
      } else if (typeof focusTarget.setAttribute === 'function') {
        focusTarget.setAttribute('data-tutorial-focus', '');
      }
    }
  }

  function focusTutorialTarget(targetKey) {
    clearTutorialFocus();

    if (targetKey === 'toolbox' && blockListElement) {
      blockListElement.setAttribute('data-tutorial-focus', 'true');
      return;
    }

    if (targetKey === 'workspace' && programWorkspaceElement) {
      programWorkspaceElement.setAttribute('data-tutorial-focus', 'true');
      return;
    }

    if (targetKey === 'play' && playButton) {
      playButton.setAttribute('data-tutorial-focus', 'true');
    }
  }

  function renderTutorialStep(step) {
    if (!step) {
      hideTutorial();
      return;
    }

    tutorialPanelElement.hidden = false;
    tutorialStepIndicatorElement.textContent = labels.tutorial.stepTemplate
      .replace('{current}', String(step.index + 1))
      .replace('{total}', String(step.total));
    tutorialHeadingElement.textContent = step.title;
    tutorialBodyElement.textContent = step.description;
    tutorialNextButton.textContent = step.isLastStep ? labels.tutorial.finish : labels.tutorial.next;
    focusTutorialTarget(step.focusTarget);
  }

  function hideTutorial() {
    tutorialPanelElement.hidden = true;
    tutorialStepIndicatorElement.textContent = '';
    tutorialHeadingElement.textContent = '';
    tutorialBodyElement.textContent = '';
    clearTutorialFocus();
  }

  function attachEvents() {
    playButton.addEventListener('click', onPlay);
    stopButton.addEventListener('click', onStop);
    resetButton.addEventListener('click', onReset);
    nextLevelButton.addEventListener('click', onNextLevel);
    hintButton.addEventListener('click', onHint);
    playInstructionAudioButton.addEventListener('click', onPlayInstructionAudio);
    startButton.addEventListener('click', onStart);
    continueButton.addEventListener('click', onContinue);
    parentsButton.addEventListener('click', onParents);
    tutorialButton.addEventListener('click', onOpenTutorial);
    if (labButton && typeof onOpenLab === 'function') {
      labButton.addEventListener('click', onOpenLab);
    }
    closeParentAreaButton.addEventListener('click', onCloseParentsArea);
    clearProgressButton.addEventListener('click', onClearProgress);
    soundEffectsToggle.addEventListener('change', () => onToggleSoundEffects(soundEffectsToggle.checked));
    tutorialNextButton.addEventListener('click', onTutorialNext);
    tutorialSkipButton.addEventListener('click', onTutorialSkip);
    tutorialCloseButton.addEventListener('click', onTutorialClose);
    tutorialAudioButton.addEventListener('click', onPlayTutorialAudio);
    retryLevelButton.addEventListener('click', onRetry);
    returnHomeButton.addEventListener('click', onReturnHome);
    saveProgramButton.addEventListener('click', onSaveProgram);
    if (labModeRobotButton && typeof onSelectLabRobotMode === 'function') {
      labModeRobotButton.addEventListener('click', onSelectLabRobotMode);
    }
    if (labModeObstacleButton && typeof onSelectLabObstacleMode === 'function') {
      labModeObstacleButton.addEventListener('click', onSelectLabObstacleMode);
    }
    if (worldGridElement && typeof onLabCellSelected === 'function') {
      worldGridElement.addEventListener('click', (event) => {
        const cellElement = event.target?.closest?.('.cell');
        if (!cellElement) {
          return;
        }
        const row = Number.parseInt(cellElement.dataset.row ?? '', 10);
        const column = Number.parseInt(cellElement.dataset.column ?? '', 10);
        if (Number.isInteger(row) && Number.isInteger(column)) {
          onLabCellSelected(row, column);
        }
      });
    }
  }

  return {
    applyStaticLabels,
    syncPrimaryActions,
    setEditingEnabled,
    showLevelError,
    hideLevelError,
    showLevelCompletion,
    hideLevelCompletion,
    showParentArea,
    hideParentArea,
    renderTutorialStep,
    hideTutorial,
    setSoundEffectsEnabled,
    renderParentAreaSummary,
    setLabControlsState,
    attachEvents
  };
}
