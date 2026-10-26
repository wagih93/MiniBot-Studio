const defaultLearningConceptKeys = ['sequencing', 'directions', 'repetition'];

export function createLearningProgressSummary({
  completedLevelIds = [],
  levelsById = {},
  learningConceptKeys = defaultLearningConceptKeys
} = {}) {
  const validConceptKeys = Array.isArray(learningConceptKeys)
    ? [...new Set(learningConceptKeys.filter((conceptKey) => typeof conceptKey === 'string' && conceptKey.length > 0))]
    : [];

  const validCompletedLevelIds = Array.isArray(completedLevelIds)
    ? [...new Set(completedLevelIds.filter((levelId) => typeof levelId === 'string' && levelId.length > 0))]
    : [];

  const conceptLevelsByKey = new Map(validConceptKeys.map((conceptKey) => [conceptKey, new Set()]));
  const trackedCompletedLevels = new Set();

  for (const levelId of validCompletedLevelIds) {
    const level = levelsById[levelId];
    if (!level || typeof level !== 'object') {
      continue;
    }
    trackedCompletedLevels.add(levelId);

    const levelLearningConcepts = Array.isArray(level.learningConcepts) ? level.learningConcepts : [];
    for (const learningConceptKey of levelLearningConcepts) {
      if (!conceptLevelsByKey.has(learningConceptKey)) {
        continue;
      }
      conceptLevelsByKey.get(learningConceptKey).add(levelId);
    }
  }

  const conceptSummaries = validConceptKeys.map((conceptKey) => ({
    conceptKey,
    completedLevelCount: conceptLevelsByKey.get(conceptKey).size
  }));

  return {
    completedLevelCount: trackedCompletedLevels.size,
    conceptSummaries
  };
}
