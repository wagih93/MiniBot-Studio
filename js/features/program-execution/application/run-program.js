import { validateProgramDefinition } from '../domain/program-validation.js';

export function runProgram(programSteps) {
  return validateProgramDefinition(programSteps);
}
