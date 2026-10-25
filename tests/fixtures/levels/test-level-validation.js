export const testLevelValidation = {
  id: 'test-level-validation',
  title: 'مستوى التحقق',
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
  obstacles: [{ row: 1, column: 1 }],
  availableBlocks: ['start', 'moveForward', 'turnRight'],
  successConditions: {
    reachGoal: true,
    collectAllCollectibles: true
  },
  programValidation: {
    requiresStartBlock: true,
    allowEmptyProgram: false,
    requiredBlocks: ['moveForward']
  },
  hints: ['ابدأ بكتلة ابدأ ثم أضف تقدّم خطوة.']
};
