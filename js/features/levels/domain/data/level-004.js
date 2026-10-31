export const level004 = {
  id: 'level-004',
  title: 'المستوى 4',
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
  obstacles: [
    { row: 0, column: 1 },
    { row: 1, column: 2 },
    { row: 2, column: 2 }
  ],
  availableBlocks: ['moveForward', 'turnRight', 'turnLeft', 'if'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  learningConcepts: ['sequencing', 'directions'],
  hints: [
    'هذا مستوى تمهيدي: إذا كان الطريق أمام الروبوت مغلقاً فاستعمل كتلة الشرط.',
    'ضع داخل كتلة "إذا كان الطريق مغلقاً" أمر "انعطف يميناً" ثم "تقدّم خطوة".'
  ]
};
