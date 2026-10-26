/**
 * @typedef {object} ProgressRepository
 * @property {() => string | null} loadSavedLevelId
 * @property {(levelId: string) => boolean} saveSavedLevelId
 * @property {() => string[]} loadCompletedLevelIds
 * @property {(levelId: string) => boolean} saveCompletedLevelId
 * @property {() => boolean} clearProgress
 */

export function assertProgressRepository(repository) {
  if (!repository || typeof repository !== 'object') {
    throw new TypeError('ProgressRepository must be an object.');
  }

  if (typeof repository.loadSavedLevelId !== 'function') {
    throw new TypeError('ProgressRepository.loadSavedLevelId must be a function.');
  }

  if (typeof repository.saveSavedLevelId !== 'function') {
    throw new TypeError('ProgressRepository.saveSavedLevelId must be a function.');
  }

  if (typeof repository.loadCompletedLevelIds !== 'function') {
    throw new TypeError('ProgressRepository.loadCompletedLevelIds must be a function.');
  }

  if (typeof repository.saveCompletedLevelId !== 'function') {
    throw new TypeError('ProgressRepository.saveCompletedLevelId must be a function.');
  }

  if (typeof repository.clearProgress !== 'function') {
    throw new TypeError('ProgressRepository.clearProgress must be a function.');
  }

  return repository;
}
