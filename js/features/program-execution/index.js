export { runProgram } from './application/run-program.js';
export { compileProgram } from './domain/program-compiler.js';
export { validateProgram } from './domain/program-validation.js';
export {
  createChallengeState,
  getCollectedCount,
  isGoalCollected,
  updateChallengeProgress
} from './domain/objective-tracker.js';
export { createExecutionStatusView } from './ui/execution-status-view.js';
