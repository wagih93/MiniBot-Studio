/**
 * @typedef {object} ProgramRepository
 * @property {(levelId: string) => { blockTypes: string[], failed: boolean }} loadProgram
 * @property {(levelId: string, blockTypes: string[]) => boolean} saveProgram
 */

export function assertProgramRepository(repository) {
  if (!repository || typeof repository !== 'object') {
    throw new TypeError('ProgramRepository must be an object.');
  }

  if (typeof repository.loadProgram !== 'function') {
    throw new TypeError('ProgramRepository.loadProgram must be a function.');
  }

  if (typeof repository.saveProgram !== 'function') {
    throw new TypeError('ProgramRepository.saveProgram must be a function.');
  }

  return repository;
}
