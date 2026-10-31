const defaultStorageKeys = Object.freeze([
  'minibot.progress.levelId',
  'minibot.progress.completedLevelIds.v1',
  'minibot.programs.v1',
  'minibot.settings.soundEffectsEnabled',
  'minibot.tutorial.completed'
]);

export function createLocalStorageAppDataRepository({
  storage = getDefaultStorage(),
  storageKeys = defaultStorageKeys
} = {}) {
  const normalizedStorageKeys = Array.isArray(storageKeys)
    ? storageKeys.filter((storageKey) => typeof storageKey === 'string' && storageKey.length > 0)
    : [];

  return Object.freeze({
    clearAppData() {
      if (!storage || typeof storage.removeItem !== 'function') {
        return false;
      }

      try {
        for (const storageKey of normalizedStorageKeys) {
          storage.removeItem(storageKey);
        }
        return true;
      } catch {
        return false;
      }
    }
  });
}

function getDefaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
