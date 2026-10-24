function toCellKey(row, column) {
  return `${row}-${column}`;
}

export function createChallengeState(level) {
  return {
    totalGoals: level.goals.length,
    collectedGoalKeys: new Set(),
    recentlyCollectedGoalKey: null
  };
}

export function isGoalCollected(challengeState, row, column) {
  return challengeState.collectedGoalKeys.has(toCellKey(row, column));
}

export function getCollectedCount(challengeState) {
  return challengeState.collectedGoalKeys.size;
}

export function updateChallengeProgress(level, challengeState, robotState) {
  const currentCellKey = toCellKey(robotState.row, robotState.column);
  const goalOnCurrentCell = level.goals.some((goal) => goal.row === robotState.row && goal.column === robotState.column);
  const wasCollectedAlready = challengeState.collectedGoalKeys.has(currentCellKey);

  challengeState.recentlyCollectedGoalKey = null;
  if (goalOnCurrentCell && !wasCollectedAlready) {
    challengeState.collectedGoalKeys.add(currentCellKey);
    challengeState.recentlyCollectedGoalKey = currentCellKey;
  }

  const allGoalsCollected = challengeState.collectedGoalKeys.size === challengeState.totalGoals;
  const isComplete = Boolean(level.successConditions.collectAllGoals) ? allGoalsCollected : false;

  return {
    collectedGoalKey: challengeState.recentlyCollectedGoalKey,
    isComplete
  };
}
