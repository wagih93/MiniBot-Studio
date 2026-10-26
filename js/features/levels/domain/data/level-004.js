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
  collectibles: [{ row: 3, column: 3, type: 'star' }],
  obstacles: [
    { row: 0, column: 2 },
    { row: 1, column: 2 },
    { row: 2, column: 2 }
  ],
  availableBlocks: ['moveForward', 'turnRight', 'turnLeft'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  hints: [
    'الطريق المباشر إلى النجمة مغلق بجدار.',
    'ابدأ بالنزول ثم اتجه يميناً لتجاوز الجدار.'
  ]
};
