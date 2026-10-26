export const level003 = {
  id: 'level-003',
  title: 'المستوى 3',
  grid: {
    rows: 4,
    columns: 4
  },
  robot: {
    row: 0,
    column: 0,
    direction: 'east'
  },
  collectibles: [{ row: 1, column: 0, type: 'star' }],
  obstacles: [{ row: 0, column: 1 }],
  availableBlocks: ['moveForward', 'turnRight', 'turnLeft'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  hints: ['الطريق أمام الروبوت مغلق. انعطف يميناً مرة واحدة ثم تقدّم خطوة.']
};
