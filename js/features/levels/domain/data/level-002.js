export const level002 = {
  id: 'level-002',
  title: 'المستوى 2',
  grid: {
    rows: 5,
    columns: 5
  },
  robot: {
    row: 0,
    column: 0,
    direction: 'east'
  },
  collectibles: [{ row: 4, column: 4, type: 'star' }],
  obstacles: [
    { row: 1, column: 1 },
    { row: 2, column: 1 },
    { row: 3, column: 2 }
  ],
  availableBlocks: ['moveForward', 'turnRight', 'turnLeft'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  hints: ['تجنّب العوائق في الوسط وجرّب الانعطاف مرتين.']
};
