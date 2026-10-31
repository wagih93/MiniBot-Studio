export function createTutorialController({
  steps = [],
  hasCompletedTutorial = () => false,
  markCompletedTutorial = () => true
} = {}) {
  const tutorialSteps = Array.isArray(steps) ? steps.filter((step) => step && typeof step === 'object') : [];
  let activeStepIndex = -1;

  function openTutorial() {
    if (tutorialSteps.length === 0) {
      return null;
    }
    activeStepIndex = 0;
    return getCurrentStep();
  }

  function openTutorialIfNeeded() {
    if (hasCompletedTutorial()) {
      return null;
    }
    return openTutorial();
  }

  function replayTutorial() {
    return openTutorial();
  }

  function nextStep() {
    if (!isVisible()) {
      return { step: null, completed: false };
    }

    if (activeStepIndex >= tutorialSteps.length - 1) {
      markCompletedTutorial();
      activeStepIndex = -1;
      return { step: null, completed: true };
    }

    activeStepIndex += 1;
    return { step: getCurrentStep(), completed: false };
  }

  function skipTutorial() {
    if (!isVisible()) {
      return false;
    }

    markCompletedTutorial();
    activeStepIndex = -1;
    return true;
  }

  function closeTutorial() {
    activeStepIndex = -1;
  }

  function isVisible() {
    return activeStepIndex >= 0 && activeStepIndex < tutorialSteps.length;
  }

  function getCurrentStep() {
    if (!isVisible()) {
      return null;
    }

    const step = tutorialSteps[activeStepIndex];
    return {
      index: activeStepIndex,
      total: tutorialSteps.length,
      title: String(step.title ?? ''),
      description: String(step.description ?? ''),
      focusTarget: String(step.focusTarget ?? ''),
      isLastStep: activeStepIndex === tutorialSteps.length - 1
    };
  }

  return Object.freeze({
    openTutorialIfNeeded,
    replayTutorial,
    nextStep,
    skipTutorial,
    closeTutorial,
    getCurrentStep,
    isVisible
  });
}
