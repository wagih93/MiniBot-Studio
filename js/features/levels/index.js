export {
  createChallengeState,
  getCollectedCount,
  isGoalCollected,
  updateChallengeProgress
} from './domain/challenge-manager.js';
export { getLevelById, listLevelIds } from './domain/level-registry.js';
export { validateLevelData } from './domain/level-validator.js';
export { loadLevel } from './application/load-level.js';
export { createLevelMetaView } from './ui/level-meta-view.js';
