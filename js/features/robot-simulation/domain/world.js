const directionOffsetByHeading = {
  north: { rowOffset: -1, columnOffset: 0 },
  east: { rowOffset: 0, columnOffset: 1 },
  south: { rowOffset: 1, columnOffset: 0 },
  west: { rowOffset: 0, columnOffset: -1 }
};

export function getForwardPosition(robotState) {
  const directionOffset = directionOffsetByHeading[robotState.direction];
  if (!directionOffset) {
    return { row: robotState.row, column: robotState.column };
  }

  return {
    row: robotState.row + directionOffset.rowOffset,
    column: robotState.column + directionOffset.columnOffset
  };
}

export function isInsideGrid(level, row, column) {
  return row >= 0 && row < level.grid.rows && column >= 0 && column < level.grid.columns;
}

export function hasObstacle(level, row, column) {
  return level.obstacles.some((obstacle) => obstacle.row === row && obstacle.column === column);
}

export function canMoveForward(level, robotState) {
  const forwardPosition = getForwardPosition(robotState);
  return isInsideGrid(level, forwardPosition.row, forwardPosition.column) &&
    !hasObstacle(level, forwardPosition.row, forwardPosition.column);
}

export function readForwardSensorState(level, robotState) {
  return canMoveForward(level, robotState) ? 'clear' : 'blocked';
}
