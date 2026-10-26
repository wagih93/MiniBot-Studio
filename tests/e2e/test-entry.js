import { initializeRobotLab } from '../../js/robot-lab.js';
import { createRuntimeConfig } from '../../js/shared/runtime-config.js';
import { brokenLevel } from '../fixtures/levels/broken-level.js';
import { testLevelValidation } from '../fixtures/levels/test-level-validation.js';

const searchParams = new URLSearchParams(window.location.search);
const runtimeLogEntries = [];
window.__runtimeLogEntries = runtimeLogEntries;
const runtimeLogger = {
  warn(entry) {
    runtimeLogEntries.push({ level: 'warn', entry });
  },
  error(entry) {
    runtimeLogEntries.push({ level: 'error', entry });
  }
};

const runtimeConfig = createRuntimeConfig({
  initialLevelId: searchParams.get('level') ?? undefined,
  executionOverrides: {
    maximumStepsPerRun: searchParams.get('maxSteps') ?? undefined,
    selectedBlockRepeatCount: searchParams.get('repeat') ?? undefined,
    stepDelayMilliseconds: searchParams.get('stepDelayMs') ?? undefined
  },
  levelOverrides: [brokenLevel, testLevelValidation],
  logger: runtimeLogger
});

initializeRobotLab(runtimeConfig);
