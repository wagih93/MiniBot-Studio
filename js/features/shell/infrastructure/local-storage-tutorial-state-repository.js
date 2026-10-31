const tutorialStorageKey = 'minibot.tutorial.completed';

export function createLocalStorageTutorialStateRepository({
  storage = globalThis.localStorage
} = {}) {
  function hasCompletedTutorial() {
    if (!storage || typeof storage.getItem !== 'function') {
      return false;
    }

    return storage.getItem(tutorialStorageKey) === 'true';
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
