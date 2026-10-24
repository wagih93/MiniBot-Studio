import { getForwardPosition } from './world.js';

const directionsClockwise = ['north', 'east', 'south', 'west'];

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

export function turnRight(robotState) {
  const currentDirectionIndex = directionsClockwise.indexOf(robotState.direction);
  const nextDirectionIndex = (currentDirectionIndex + 1) % directionsClockwise.length;
  return {
    row: robotState.row,
    column: robotState.column,
    direction: directionsClockwise[nextDirectionIndex]
  };
}

export function turnLeft(robotState) {
  const currentDirectionIndex = directionsClockwise.indexOf(robotState.direction);
  const nextDirectionIndex =
    (currentDirectionIndex - 1 + directionsClockwise.length) % directionsClockwise.length;
  return {
    row: robotState.row,
    column: robotState.column,
    direction: directionsClockwise[nextDirectionIndex]
  };
}
