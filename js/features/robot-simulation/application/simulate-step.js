import { canMoveForward } from '../domain/world.js';
import { moveForward, turnLeft, turnRight } from '../domain/robot.js';

export function simulateStep(level, robotState, blockType) {
  if (blockType === 'moveForward') {
    if (!canMoveForward(level, robotState)) {
      return { robotState, status: 'blocked' };
    }
    return { robotState: moveForward(robotState), status: 'advanced' };
  }

  if (blockType === 'turnRight') {
    return { robotState: turnRight(robotState), status: 'advanced' };
  }

  if (blockType === 'turnLeft') {
    return { robotState: turnLeft(robotState), status: 'advanced' };
  }

  return { robotState, status: 'unsupported' };
}
