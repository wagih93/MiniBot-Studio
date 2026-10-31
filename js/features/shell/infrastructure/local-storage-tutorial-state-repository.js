const tutorialStorageKey = 'minibot.tutorial.completed';

export function createLocalStorageTutorialStateRepository({
  storage = getDefaultStorage()
} = {}) {
  function hasCompletedTutorial() {
    if (!storage || typeof storage.getItem !== 'function') {
      return false;
    }

    try {
      return storage.getItem(tutorialStorageKey) === 'true';
    } catch {
      return false;
    }
  }

  function markCompletedTutorial() {
    if (!storage || typeof storage.setItem !== 'function') {
      return false;
    }

    try {
      storage.setItem(tutorialStorageKey, 'true');
      return true;
    } catch {
      return false;
    }
  }

  return Object.freeze({
    hasCompletedTutorial,
    markCompletedTutorial
  });
}

function getDefaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
