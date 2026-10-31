import { REPEAT_MIN_COUNT, REPEAT_MAX_COUNT } from '../../../shared/repeat-config.js';

function cloneInstruction(instruction) {
  if (instruction.blockType === 'if') {
    return {
      ...instruction,
      body: Array.isArray(instruction.body) ? instruction.body.map(cloneInstruction) : []
    };
  }

  return { ...instruction };
}

function createSelectedInstruction(blockType) {
  if (blockType === 'if') {
    return {
      blockType: 'if',
      condition: 'pathBlocked',
      stepId: null,
      body: []
    };
  }

  return {
    blockType,
    stepId: null
  };
}

function flattenSteps(steps) {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps.flatMap(flattenStep);
}

function flattenStep(step) {
  if (step.blockType === 'repeat') {
    const count = step.repeatCount;
    if (!Number.isInteger(count) || count < REPEAT_MIN_COUNT || count > REPEAT_MAX_COUNT) {
      return { blockType: 'invalidRepeatCount', stepId: step.id };
    }
    const bodyInstructions = flattenSteps(step.body);
    const repeatedInstructions = [];
    for (let index = 0; index < count; index += 1) {
      repeatedInstructions.push(...bodyInstructions.map(cloneInstruction));
    }
    return repeatedInstructions;
  }

  if (step.blockType === 'if') {
    return {
      blockType: 'if',
      condition: 'pathBlocked',
      stepId: step.id,
      body: flattenSteps(step.body)
    };
  }

  return { blockType: step.blockType, stepId: step.id };
}

export function compileProgram(programSteps, selectedBlockType, repeatSelectedBlockCount) {
  if (Array.isArray(programSteps) && programSteps.length > 0) {
    return flattenSteps(programSteps);
  }

  if (typeof selectedBlockType !== 'string' || selectedBlockType.length === 0) {
    return [];
  }

  const repeatCount = Number.isInteger(repeatSelectedBlockCount) && repeatSelectedBlockCount > 0
    ? repeatSelectedBlockCount
    : 1;

  return Array.from({ length: repeatCount }, () => createSelectedInstruction(selectedBlockType));
}
