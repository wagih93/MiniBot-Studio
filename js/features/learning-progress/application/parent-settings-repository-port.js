/**
 * @typedef {object} ParentSettingsRepository
 * @property {() => boolean} loadSoundEffectsEnabled
 * @property {(enabled: boolean) => boolean} saveSoundEffectsEnabled
 */

export function assertParentSettingsRepository(repository) {
  if (!repository || typeof repository !== 'object') {
    throw new TypeError('ParentSettingsRepository must be an object.');
  }

  if (typeof repository.loadSoundEffectsEnabled !== 'function') {
    throw new TypeError('ParentSettingsRepository.loadSoundEffectsEnabled must be a function.');
  }

  if (typeof repository.saveSoundEffectsEnabled !== 'function') {
    throw new TypeError('ParentSettingsRepository.saveSoundEffectsEnabled must be a function.');
  }

  return repository;
}
