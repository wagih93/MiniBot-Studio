const allowedDirections = new Set(['north', 'east', 'south', 'west']);

function isInteger(value) {
  return Number.isInteger(value);
}

function isGridPosition(value) {
  return value &&
    isInteger(value.row) &&
    isInteger(value.column) &&
    value.row >= 0 &&
    value.column >= 0;
}

export function validateLevelData(level) {
  const errors = [];

  if (!level || typeof level !== 'object') {
    return { isValid: false, errors: ['Level must be an object.'] };
  }

  if (!level.grid || !isInteger(level.grid.rows) || !isInteger(level.grid.columns)) {
    errors.push('Level grid must define integer rows and columns.');
  } else if (level.grid.rows <= 0 || level.grid.columns <= 0) {
    errors.push('Level grid dimensions must be greater than zero.');
  }

  if (!isGridPosition(level.robot)) {
    errors.push('Robot position must define non-negative integer row and column.');
  } else if (!allowedDirections.has(level.robot.direction)) {
    errors.push('Robot direction must be one of north/east/south/west.');
  }

  const collectibles = Array.isArray(level.collectibles) ? level.collectibles : null;
  if (!Array.isArray(collectibles) || collectibles.length === 0) {
    errors.push('At least one collectible is required.');
  } else if (collectibles.some((collectible) => !isGridPosition(collectible))) {
    errors.push('Every collectible must define non-negative integer row and column.');
  }

  if (!Array.isArray(level.obstacles)) {
    errors.push('Obstacles must be an array.');
  } else if (level.obstacles.some((obstacle) => !isGridPosition(obstacle))) {
    errors.push('Every obstacle must define non-negative integer row and column.');
  }

  if (!Array.isArray(level.availableBlocks) || level.availableBlocks.length === 0) {
    errors.push('At least one available block is required.');
  }

  if (!level.successConditions || typeof level.successConditions !== 'object') {
    errors.push('Success conditions must be defined.');
  }

  if (!Array.isArray(level.hints) || level.hints.length === 0) {
    errors.push('At least one hint is required.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
