export {
  createRobotState,
  moveForward,
  turnLeft,
  turnRight
} from './domain/robot.js';
export {
  robotDesignOptions,
  robotColorOptions,
  defaultRobotAppearance,
  normalizeRobotAppearance
} from './domain/robot-appearance.js';
export {
  canMoveForward,
  readForwardSensorState,
  getForwardPosition,
  hasObstacle,
  isInsideGrid
} from './domain/world.js';
export { simulateStep } from './application/simulate-step.js';
export { createWorldGridView } from './ui/world-grid-view.js';
