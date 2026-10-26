export const levelRepeat = {
  id: 'level-repeat',
  title: 'مستوى التكرار',
  grid: {
    rows: 4,
    columns: 4
  },
  robot: {
    row: 0,
    column: 0,
    direction: 'east'
  },
  collectibles: [{ row: 0, column: 3, type: 'star' }],
  obstacles: [],
  availableBlocks: ['moveForward', 'turnRight', 'turnLeft', 'repeat'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  hints: ['استخدم كتلة كرر لتحريك الروبوت عدة مرات بأمر واحد.']
};
