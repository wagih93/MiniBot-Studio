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
  collectibles: [{ row: 0, column: 2, type: 'star' }],
  obstacles: [{ row: 2, column: 2 }],
  availableBlocks: ['moveForward'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  hints: ['استخدم أمر "تقدّم خطوة" مرتين متتاليتين للوصول إلى النجمة.']
};
