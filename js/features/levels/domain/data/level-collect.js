export const levelCollect = {
  id: 'level-collect',
  title: 'مستوى الجمع',
  grid: {
    rows: 3,
    columns: 3
  },
  robot: {
    row: 0,
    column: 0,
    direction: 'east'
  },
  collectibles: [{ row: 0, column: 1, type: 'star' }],
  obstacles: [{ row: 0, column: 2 }],
  availableBlocks: ['moveForward'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  hints: ['تقدّم خطوة واحدة لجمع النجمة.']
};
