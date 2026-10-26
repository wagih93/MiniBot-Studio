import { assertProgressRepository } from '../application/progress-repository-port.js';

const defaultStorageKey = 'minibot.progress.levelId';
const defaultCompletedStorageKey = 'minibot.progress.completedLevelIds.v1';

export function createLocalStorageProgressRepository({
  storage = getDefaultStorage(),
  storageKey = defaultStorageKey,
  completedStorageKey = defaultCompletedStorageKey,
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
    },
    loadCompletedLevelIds() {
      const storedValue = readStorageValue(storage, completedStorageKey);
      return normalizeCompletedLevelIds(storedValue, allowedLevelIdsSet);
    },
    saveCompletedLevelId(levelId) {
      const normalizedLevelId = normalizeLevelId(levelId, allowedLevelIdsSet);
      if (!normalizedLevelId) {
        return false;
      }

      const completedLevelIds = normalizeCompletedLevelIds(
        readStorageValue(storage, completedStorageKey),
        allowedLevelIdsSet
      );
      if (!completedLevelIds.includes(normalizedLevelId)) {
        completedLevelIds.push(normalizedLevelId);
      }
      return writeStorageValue(storage, completedStorageKey, JSON.stringify(completedLevelIds));
    },
    clearProgress() {
      return removeStorageValue(storage, storageKey) && removeStorageValue(storage, completedStorageKey);
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

function removeStorageValue(storage, storageKey) {
  if (!storage || typeof storage.removeItem !== 'function') {
    return false;
  }

  try {
    storage.removeItem(storageKey);
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

function normalizeCompletedLevelIds(storedValue, allowedLevelIdsSet) {
  if (typeof storedValue !== 'string' || storedValue.length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = [];
    for (const levelId of parsed) {
      const normalizedLevelId = normalizeLevelId(levelId, allowedLevelIdsSet);
      if (normalizedLevelId && !normalized.includes(normalizedLevelId)) {
        normalized.push(normalizedLevelId);
      }
    }
    return normalized;
  } catch {
    return [];
  }
}
