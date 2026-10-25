import { assertProgramRepository } from '../application/program-repository-port.js';

const defaultStorageKey = 'minibot.programs.v1';

export function createLocalStorageProgramRepository({
  storage = getDefaultStorage(),
  storageKey = defaultStorageKey,
  allowedLevelIds = []
} = {}) {
  const allowedLevelIdsSet = new Set(allowedLevelIds);

  return assertProgramRepository({
    loadProgram(levelId) {
      const normalizedLevelId = normalizeLevelId(levelId, allowedLevelIdsSet);
      if (!normalizedLevelId) {
        return { blockTypes: [], failed: false };
      }

      const { store, failed } = readProgramStore(storage, storageKey);
      const levelProgram = sanitizeProgram(store.programs[normalizedLevelId]);
      return {
        blockTypes: levelProgram,
        failed
      };
    },
    saveProgram(levelId, blockTypes) {
      const normalizedLevelId = normalizeLevelId(levelId, allowedLevelIdsSet);
      if (!normalizedLevelId) {
        return false;
      }

      const { store } = readProgramStore(storage, storageKey);
      store.programs[normalizedLevelId] = sanitizeProgram(blockTypes);
      return writeProgramStore(storage, storageKey, store);
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

function readProgramStore(storage, storageKey) {
  if (!storage || typeof storage.getItem !== 'function') {
    return { store: createDefaultStore(), failed: true };
  }

  try {
    const rawStore = storage.getItem(storageKey);
    if (!rawStore) {
      return { store: createDefaultStore(), failed: false };
    }

    const parsedStore = JSON.parse(rawStore);
    return normalizeStore(parsedStore);
  } catch {
    return { store: createDefaultStore(), failed: true };
  }
}

function writeProgramStore(storage, storageKey, store) {
  if (!storage || typeof storage.setItem !== 'function') {
    return false;
  }

  try {
    storage.setItem(storageKey, JSON.stringify(store));
    return true;
  } catch {
    return false;
  }
}

function normalizeStore(storeCandidate) {
  if (storeCandidate.version === 1 && isPlainObject(storeCandidate.programs)) {
    return { store: storeCandidate, failed: false };
  }

  if (!('version' in storeCandidate) && isPlainObject(storeCandidate)) {
    return {
      store: {
        version: 1,
        programs: storeCandidate
      },
      failed: false
    };
  }

  return { store: createDefaultStore(), failed: true };
}

function createDefaultStore() {
  return {
    version: 1,
    programs: {}
  };
}

function sanitizeProgram(blockTypes) {
  if (!Array.isArray(blockTypes)) {
    return [];
  }

  return blockTypes.filter((blockType) => typeof blockType === 'string' && blockType.length > 0);
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

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
