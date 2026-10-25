export function validateProgramDefinition(programSteps) {
  return {
    isValid: Array.isArray(programSteps),
    errors: Array.isArray(programSteps) ? [] : ['Program steps must be an array.']
  };
}
