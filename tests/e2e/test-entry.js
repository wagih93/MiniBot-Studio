import { initializeRobotLab } from '../../js/robot-lab.js';
import { createRuntimeConfig } from '../../js/runtime-config.js';
import { brokenLevel } from '../fixtures/levels/broken-level.js';
import { testLevelValidation } from '../fixtures/levels/test-level-validation.js';

const searchParams = new URLSearchParams(window.location.search);

const runtimeConfig = createRuntimeConfig({
  initialLevelId: searchParams.get('level') ?? undefined,
  executionOverrides: {
    maximumStepsPerRun: searchParams.get('maxSteps') ?? undefined,
    selectedBlockRepeatCount: searchParams.get('repeat') ?? undefined,
    stepDelayMilliseconds: searchParams.get('stepDelayMs') ?? undefined
  },
  levelOverrides: [brokenLevel, testLevelValidation]
});

initializeRobotLab(runtimeConfig);
