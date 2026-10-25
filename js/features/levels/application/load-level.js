import { getLevelById } from '../domain/level-registry.js';
import { validateLevelData } from '../domain/level-validator.js';

export function loadLevel(levelId) {
  const level = getLevelById(levelId);
  if (!level) {
    return {
      level: null,
      validation: { isValid: false, errors: ['Level not found.'] }
    };
  }

  return {
    level,
    validation: validateLevelData(level)
  };
}
