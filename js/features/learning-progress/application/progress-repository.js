export function createInMemoryProgressRepository(initialState = createDefaultState()) {
  const state = {
    completedLevelIds: [...initialState.completedLevelIds]
  };

  return {
    loadCompletedLevelIds() {
      return [...state.completedLevelIds];
    },
    saveCompletedLevel(levelId) {
      if (!state.completedLevelIds.includes(levelId)) {
        state.completedLevelIds.push(levelId);
      }
      return [...state.completedLevelIds];
    }
  };
}

function createDefaultState() {
  return {
    completedLevelIds: []
  };
}
