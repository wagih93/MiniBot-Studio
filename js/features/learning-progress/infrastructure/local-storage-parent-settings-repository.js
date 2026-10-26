import { assertParentSettingsRepository } from '../application/parent-settings-repository-port.js';

const defaultSoundEffectsStorageKey = 'minibot.settings.soundEffectsEnabled';

export function createLocalStorageParentSettingsRepository({
  storage = getDefaultStorage(),
  soundEffectsStorageKey = defaultSoundEffectsStorageKey
} = {}) {
  return assertParentSettingsRepository({
    loadSoundEffectsEnabled() {
      const storedValue = readStorageValue(storage, soundEffectsStorageKey);
      return storedValue !== 'false';
    },
    saveSoundEffectsEnabled(enabled) {
      if (typeof enabled !== 'boolean') {
        return false;
      }

      return writeStorageValue(storage, soundEffectsStorageKey, enabled ? 'true' : 'false');
    }
  });
}

function getDefaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function readStorageValue(storage, key) {
  if (!storage || typeof storage.getItem !== 'function') {
    return null;
  }

  try {
    const value = storage.getItem(key);
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
}

function writeStorageValue(storage, key, value) {
  if (!storage || typeof storage.setItem !== 'function') {
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
