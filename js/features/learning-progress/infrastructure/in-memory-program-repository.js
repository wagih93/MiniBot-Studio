import { assertProgramRepository } from '../application/program-repository-port.js';

export function createInMemoryProgramRepository({
  allowedLevelIds = [],
  initialStore = null
} = {}) {
  const allowedLevelIdsSet = new Set(allowedLevelIds);
  const { store, failed } = normalizeStore(initialStore);
  const programsByLevelId = { ...store.programs };

  return assertProgramRepository({
    loadProgram(levelId) {
      const normalizedLevelId = normalizeLevelId(levelId, allowedLevelIdsSet);
      if (!normalizedLevelId) {
        return { blockTypes: [], failed };
      }

      const levelProgram = sanitizeProgram(programsByLevelId[normalizedLevelId]);
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

      programsByLevelId[normalizedLevelId] = sanitizeProgram(blockTypes);
      return true;
    }
  });
}

function normalizeStore(storeCandidate) {
  if (!storeCandidate) {
    return { store: createDefaultStore(), failed: false };
  }

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
