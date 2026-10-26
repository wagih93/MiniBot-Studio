import { assertProgressRepository } from '../application/progress-repository-port.js';

export function createInMemoryProgressRepository({
  allowedLevelIds = [],
  initialSavedLevelId = null,
  initialCompletedLevelIds = []
} = {}) {
  const allowedLevelIdsSet = new Set(allowedLevelIds);
  let savedLevelId = normalizeLevelId(initialSavedLevelId, allowedLevelIdsSet);
  const completedLevelIds = normalizeCompletedLevelIds(initialCompletedLevelIds, allowedLevelIdsSet);

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
    },
    loadCompletedLevelIds() {
      return [...completedLevelIds];
    },
    saveCompletedLevelId(levelId) {
      const normalizedLevelId = normalizeLevelId(levelId, allowedLevelIdsSet);
      if (!normalizedLevelId) {
        return false;
      }

      completedLevelIds.add(normalizedLevelId);
      return true;
    },
    clearProgress() {
      savedLevelId = null;
      completedLevelIds.clear();
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

function normalizeCompletedLevelIds(levelIds, allowedLevelIdsSet) {
  if (!Array.isArray(levelIds)) {
    return new Set();
  }

  const normalized = new Set();
  for (const levelId of levelIds) {
    const normalizedLevelId = normalizeLevelId(levelId, allowedLevelIdsSet);
    if (normalizedLevelId) {
      normalized.add(normalizedLevelId);
    }
  }
  return normalized;
}
