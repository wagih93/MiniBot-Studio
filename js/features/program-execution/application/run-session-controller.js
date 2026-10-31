export function createRunSessionController({
  createAbortController = () => new AbortController()
} = {}) {
  let activeRunToken = 0;
  let activeRunController = null;
  let runInProgress = false;

  function startRunSession() {
    if (runInProgress) {
      return null;
    }

    activeRunToken += 1;
    if (activeRunController && typeof activeRunController.abort === 'function') {
      activeRunController.abort();
    }

    const controller = createAbortController();
    activeRunController = controller;
    runInProgress = true;

    return {
      runToken: activeRunToken,
      signal: controller.signal,
      controller
    };
  }

  function finishRunSession({ runToken, controller }) {
    runInProgress = false;
    if (runToken === activeRunToken && activeRunController === controller) {
      activeRunController = null;
    }
  }

  function cancelRunSession() {
    activeRunToken += 1;
    if (activeRunController && typeof activeRunController.abort === 'function') {
      activeRunController.abort();
    }
    activeRunController = null;
    runInProgress = false;
  }

  function isCurrentRunToken(runToken) {
    return runToken === activeRunToken;
  }

  function isRunInProgress() {
    return runInProgress;
  }

  return Object.freeze({
    startRunSession,
    finishRunSession,
    cancelRunSession,
    isCurrentRunToken,
    isRunInProgress
  });
}
