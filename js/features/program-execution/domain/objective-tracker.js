function createGoalKey(row, column) {
  return `${row}-${column}`;
}

export function createChallengeState(level) {
  const goals = Array.isArray(level.goals) ? level.goals : [];

  return {
    totalGoals: goals.length,
    collectedGoalKeys: new Set(),
    recentlyCollectedGoalKey: null
  };
}

export function getCollectedCount(challengeState) {
  return challengeState.collectedGoalKeys.size;
}

export function isGoalCollected(challengeState, row, column) {
  return challengeState.collectedGoalKeys.has(createGoalKey(row, column));
}

export function updateChallengeProgress(level, challengeState, robotState) {
  const goals = Array.isArray(level.goals) ? level.goals : [];
  const key = createGoalKey(robotState.row, robotState.column);
  const hasGoal = goals.some((goal) => goal.row === robotState.row && goal.column === robotState.column);
  const alreadyCollected = challengeState.collectedGoalKeys.has(key);
  const collectedGoalKey = hasGoal && !alreadyCollected ? key : null;
  const nextCollectedGoalKeys = collectedGoalKey === null
    ? new Set(challengeState.collectedGoalKeys)
    : new Set([...challengeState.collectedGoalKeys, collectedGoalKey]);
  const nextChallengeState = {
    totalGoals: challengeState.totalGoals,
    collectedGoalKeys: nextCollectedGoalKeys,
    recentlyCollectedGoalKey: collectedGoalKey
  };
  const collectAllGoals = level.successConditions?.collectAllGoals === true ||
    level.objective?.collectAllGoals === true;
  const isComplete = collectAllGoals
    ? nextCollectedGoalKeys.size >= nextChallengeState.totalGoals
    : false;

  return {
    challengeState: nextChallengeState,
    collectedGoalKey,
    isComplete
  };
}
