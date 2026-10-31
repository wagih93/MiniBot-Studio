export const level005 = {
  id: 'level-005',
  title: 'المستوى 5',
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
  availableBlocks: ['moveForward', 'turnRight', 'turnLeft', 'if'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  learningConcepts: ['sequencing', 'directions'],
  hints: [
    'جرّب هذا التحدي وحدك: خطّط برنامجاً يغيّر اتجاه الروبوت عندما يصبح الطريق مغلقاً.',
    'يمكنك استخدام كتلة "إذا كان الطريق مغلقاً" أكثر من مرة مع أوامر الحركة.'
  ]
};
