import { getForwardPosition } from './world.js';

export function createRobotState(robot) {
  return {
    row: robot.row,
    column: robot.column,
    direction: robot.direction
  };
}

export function moveForward(robotState) {
  const nextPosition = getForwardPosition(robotState);
  return {
    row: nextPosition.row,
    column: nextPosition.column,
    direction: robotState.direction
  };
}
