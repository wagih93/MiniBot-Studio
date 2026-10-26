import { REPEAT_MIN_COUNT, REPEAT_MAX_COUNT } from '../../../shared/repeat-config.js';

function flattenStep(step) {
  if (step.blockType === 'repeat') {
    const count = step.repeatCount;
    if (!Number.isInteger(count) || count < REPEAT_MIN_COUNT || count > REPEAT_MAX_COUNT) {
      return { blockType: 'invalidRepeatCount', stepId: step.id };
    }
    const body = Array.isArray(step.body) ? step.body.map((s) => ({ blockType: s.blockType, stepId: s.id })) : [];
    return Array.from({ length: count }, () => body).flat();
  }
  return { blockType: step.blockType, stepId: step.id };
}

export function compileProgram(programSteps, selectedBlockType, repeatSelectedBlockCount) {
  if (Array.isArray(programSteps) && programSteps.length > 0) {
    return programSteps.flatMap(flattenStep);
  }

  if (typeof selectedBlockType !== 'string' || selectedBlockType.length === 0) {
    return [];
  }

  const repeatCount = Number.isInteger(repeatSelectedBlockCount) && repeatSelectedBlockCount > 0
    ? repeatSelectedBlockCount
    : 1;

  return Array.from({ length: repeatCount }, () => ({
    blockType: selectedBlockType,
    stepId: null
  }));
}
