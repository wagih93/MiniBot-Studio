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
  availableBlocks: ['moveForward', 'turnRight', 'turnLeft'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  learningConcepts: ['sequencing', 'directions'],
  hints: [
    'قسّم الطريق إلى خطوات قصيرة قبل تشغيل البرنامج.',
    'استخدم الانعطاف كلما تغيّر اتجاه المسار نحو النجمة.'
  ]
};
