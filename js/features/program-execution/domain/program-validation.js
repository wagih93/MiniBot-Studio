export function validateProgram(level, instructionSequence) {
  const validationRules = level.programValidation ?? {};
  const blockTypes = instructionSequence.map((step) => step.blockType);
  const allowEmptyProgram = validationRules.allowEmptyProgram === true;

  if (!allowEmptyProgram && blockTypes.length === 0) {
    return 'programEmpty';
  }

  if (blockTypes.length === 0) {
    return null;
  }

  if (validationRules.requiresStartBlock && blockTypes[0] !== 'start') {
    return 'startRequired';
  }

  if (Array.isArray(validationRules.requiredBlocks)) {
    for (const requiredBlockType of validationRules.requiredBlocks) {
      if (!blockTypes.includes(requiredBlockType)) {
        return 'requiredBlockMissing';
      }
    }
  }

  return null;
}
