export function compileProgram(programSteps, selectedBlockType, repeatSelectedBlockCount) {
  if (Array.isArray(programSteps) && programSteps.length > 0) {
    return programSteps.map((step) => ({
      blockType: step.blockType,
      stepId: step.id
    }));
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
