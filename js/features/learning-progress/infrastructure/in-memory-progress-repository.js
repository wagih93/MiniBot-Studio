import { assertProgressRepository } from '../application/progress-repository-port.js';

export function createInMemoryProgressRepository({
  allowedLevelIds = [],
  initialSavedLevelId = null
} = {}) {
  const allowedLevelIdsSet = new Set(allowedLevelIds);
  let savedLevelId = normalizeLevelId(initialSavedLevelId, allowedLevelIdsSet);

  return assertProgressRepository({
    loadSavedLevelId() {
      return savedLevelId;
    },
    saveSavedLevelId(levelId) {
      const normalizedLevelId = normalizeLevelId(levelId, allowedLevelIdsSet);
      if (!normalizedLevelId) {
        return false;
      }

      savedLevelId = normalizedLevelId;
      return true;
    }
  });
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
