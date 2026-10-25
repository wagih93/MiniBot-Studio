import { assertProgressRepository } from '../application/progress-repository-port.js';

const defaultStorageKey = 'minibot.progress.levelId';

export function createLocalStorageProgressRepository({
  storage = getDefaultStorage(),
  storageKey = defaultStorageKey,
  allowedLevelIds = []
} = {}) {
  const allowedLevelIdsSet = new Set(allowedLevelIds);

  return assertProgressRepository({
    loadSavedLevelId() {
      const storedValue = readStorageValue(storage, storageKey);
      return normalizeLevelId(storedValue, allowedLevelIdsSet);
    },
    saveSavedLevelId(levelId) {
      const normalizedLevelId = normalizeLevelId(levelId, allowedLevelIdsSet);
      if (!normalizedLevelId) {
        return false;
      }

      return writeStorageValue(storage, storageKey, normalizedLevelId);
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

function readStorageValue(storage, storageKey) {
  if (!storage || typeof storage.getItem !== 'function') {
    return null;
  }

  try {
    const value = storage.getItem(storageKey);
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
}

function writeStorageValue(storage, storageKey, value) {
  if (!storage || typeof storage.setItem !== 'function') {
    return false;
  }

  try {
    storage.setItem(storageKey, value);
    return true;
  } catch {
    return false;
  }
}

function normalizeLevelId(levelId, allowedLevelIdsSet) {
  if (typeof levelId !== 'string' || levelId.length === 0) {
    return null;
  }

  if (allowedLevelIdsSet.size === 0) {
    return levelId;
  }

  return allowedLevelIdsSet.has(levelId) ? levelId : null;
}
