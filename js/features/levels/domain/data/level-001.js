export const level001 = {
  id: 'level-001',
  title: 'المستوى 1',
  grid: {
    rows: 4,
    columns: 4
  },
  robot: {
    row: 0,
    column: 0,
    direction: 'east'
  },
  collectibles: [{ row: 0, column: 1, type: 'star' }],
  obstacles: [{ row: 0, column: 2 }],
  availableBlocks: ['start', 'moveForward', 'turnRight', 'turnLeft'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  learningConcepts: ['sequencing'],
  hints: [
    'النجمة أمام الروبوت مباشرة.',
    'أضف أمر "تقدّم خطوة" مرة واحدة ثم اضغط تشغيل.'
  ]
};
