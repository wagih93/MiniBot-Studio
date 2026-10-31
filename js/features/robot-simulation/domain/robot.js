import { getForwardPosition } from './world.js';

const headingsClockwise = ['north', 'east', 'south', 'west'];

export function createRobotState(robot) {
  return {
    row: robot.row,
    column: robot.column,
    direction: robot.direction,
    lightOn: robot.lightOn === true
  };
}

export function moveForward(robotState) {
  const nextPosition = getForwardPosition(robotState);
  return {
    row: nextPosition.row,
    column: nextPosition.column,
    direction: robotState.direction,
    lightOn: robotState.lightOn === true
  };
}

export function turnRight(robotState) {
  const currentDirectionIndex = headingsClockwise.indexOf(robotState.direction);
  const nextDirectionIndex = (currentDirectionIndex + 1) % headingsClockwise.length;
  return {
    row: robotState.row,
    column: robotState.column,
    direction: headingsClockwise[nextDirectionIndex],
    lightOn: robotState.lightOn === true
  };
}

export function turnLeft(robotState) {
  const currentDirectionIndex = headingsClockwise.indexOf(robotState.direction);
  const nextDirectionIndex =
    (currentDirectionIndex - 1 + headingsClockwise.length) % headingsClockwise.length;
  return {
    row: robotState.row,
    column: robotState.column,
    direction: headingsClockwise[nextDirectionIndex],
    lightOn: robotState.lightOn === true
  };
}
