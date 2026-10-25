function createCollectibleKey(row, column) {
  return `${row}-${column}`;
}

function getLevelCollectibles(level) {
  return Array.isArray(level.collectibles) ? level.collectibles : [];
}

function requiresCollectingAllCollectibles(level) {
  return level.successConditions?.collectAllCollectibles === true ||
    level.objective?.collectAllCollectibles === true;
}

export function createObjectiveProgress(level) {
  const collectibles = getLevelCollectibles(level);

  return {
    totalCollectibles: collectibles.length,
    collectedCollectibleKeys: new Set(),
    recentlyCollectedCollectibleKey: null
  };
}

export function getCollectedCollectibleCount(objectiveProgress) {
  return objectiveProgress.collectedCollectibleKeys.size;
}

export function isCollectibleCollected(objectiveProgress, row, column) {
  return objectiveProgress.collectedCollectibleKeys.has(createCollectibleKey(row, column));
}

export function updateObjectiveProgress(level, objectiveProgress, robotState) {
  const collectibles = getLevelCollectibles(level);
  const key = createCollectibleKey(robotState.row, robotState.column);
  const hasCollectible = collectibles.some(
    (collectible) => collectible.row === robotState.row && collectible.column === robotState.column
  );
  const alreadyCollected = objectiveProgress.collectedCollectibleKeys.has(key);
  const collectedCollectibleKey = hasCollectible && !alreadyCollected ? key : null;
  const nextCollectedCollectibleKeys = collectedCollectibleKey === null
    ? new Set(objectiveProgress.collectedCollectibleKeys)
    : new Set([...objectiveProgress.collectedCollectibleKeys, collectedCollectibleKey]);
  const nextObjectiveProgress = {
    totalCollectibles: objectiveProgress.totalCollectibles,
    collectedCollectibleKeys: nextCollectedCollectibleKeys,
    recentlyCollectedCollectibleKey: collectedCollectibleKey
  };
  const requiresCollectibleObjective = requiresCollectingAllCollectibles(level);
  const isObjectiveComplete = requiresCollectibleObjective
    ? nextCollectedCollectibleKeys.size >= nextObjectiveProgress.totalCollectibles
    : false;

  return {
    objectiveProgress: nextObjectiveProgress,
    collectedCollectibleKey,
    isObjectiveComplete
  };
}
