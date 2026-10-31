export { runProgram } from './application/run-program.js';
export { createRunSessionController } from './application/run-session-controller.js';
export { compileProgram } from './domain/program-compiler.js';
export { validateProgram } from './domain/program-validation.js';
export {
  createObjectiveProgress,
  getCollectedCollectibleCount,
  isCollectibleCollected,
  updateObjectiveProgress
} from './domain/objective-tracker.js';
export { createExecutionStatusView } from './ui/execution-status-view.js';
