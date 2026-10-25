export const brokenLevel = {
  id: 'broken-level',
  title: 'مستوى مكسور',
  grid: {
    rows: -1,
    columns: 0
  },
  robot: {
    row: 0,
    column: 0,
    direction: 'north'
  },
  goals: [],
  obstacles: [],
  availableBlocks: ['moveForward'],
  successConditions: {
    reachGoal: true
  },
  hints: []
};
