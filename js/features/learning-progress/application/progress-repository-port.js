/**
 * @typedef {object} ProgressRepository
 * @property {() => string | null} loadSavedLevelId
 * @property {(levelId: string) => boolean} saveSavedLevelId
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

  return repository;
}
