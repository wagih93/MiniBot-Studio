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
  onRetry,
  onReturnHome,
  onSaveProgram,
  onNextLevel
}) {
  const {
    startButton, continueButton, parentsButton,
    playButton, stopButton, resetButton, nextLevelButton,
    retryLevelButton, returnHomeButton, saveProgramButton,
    programWorkspaceElement, levelErrorElement, levelErrorMessageElement,
    levelCompletionElement, levelCompletionMessageElement
  } = elements;

  function applyStaticLabels() {
    document.title = labels.pageTitle;
    document.querySelector('#app-heading').textContent = labels.heading;
    document.querySelector('#start-button-label').textContent = labels.primaryActions.start;
    document.querySelector('#continue-button-label').textContent = labels.primaryActions.continue;
    document.querySelector('#parents-button-label').textContent = labels.primaryActions.parents;
    document.querySelector('#world-heading').textContent = labels.world.heading;
    document.querySelector('#block-area-heading').textContent = labels.blockArea.heading;
    document.querySelector('#program-heading').textContent = labels.blockArea.programHeading;
    document.querySelector('#program-demo').textContent = labels.blockArea.firstLevelDemo;
    saveProgramButton.textContent = labels.controls.saveProgram;
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
  }

  function syncPrimaryActions(isRunning) {
    const hasSaved = readHasSavedProgress();
    continueButton.hidden = !hasSaved;
    startButton.disabled = isRunning;
    continueButton.disabled = isRunning || !hasSaved;
    parentsButton.disabled = isRunning;
    nextLevelButton.disabled = isRunning || nextLevelButton.hidden;
  }

  function setEditingEnabled(enabled, programListElement) {
    playButton.disabled = !enabled;
    nextLevelButton.disabled = !enabled || nextLevelButton.hidden;
    retryLevelButton.disabled = !enabled;
    returnHomeButton.disabled = !enabled;
    saveProgramButton.disabled = !enabled;
    for (const btn of programListElement.querySelectorAll('.program-step__remove')) btn.disabled = !enabled;
    programWorkspaceElement.setAttribute('aria-disabled', enabled ? 'false' : 'true');
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

  function attachEvents() {
    playButton.addEventListener('click', onPlay);
    stopButton.addEventListener('click', onStop);
    resetButton.addEventListener('click', onReset);
    nextLevelButton.addEventListener('click', onNextLevel);
    startButton.addEventListener('click', onStart);
    continueButton.addEventListener('click', onContinue);
    parentsButton.addEventListener('click', onParents);
    retryLevelButton.addEventListener('click', onRetry);
    returnHomeButton.addEventListener('click', onReturnHome);
    saveProgramButton.addEventListener('click', onSaveProgram);
  }

  return {
    applyStaticLabels,
    syncPrimaryActions,
    setEditingEnabled,
    showLevelError,
    hideLevelError,
    showLevelCompletion,
    hideLevelCompletion,
    attachEvents
  };
}
