import { assertParentSettingsRepository } from '../application/parent-settings-repository-port.js';

const defaultSoundEffectsStorageKey = 'minibot.settings.soundEffectsEnabled';
const defaultRobotAppearanceStorageKey = 'minibot.settings.robotAppearance.v1';

export function createLocalStorageParentSettingsRepository({
  storage = getDefaultStorage(),
  soundEffectsStorageKey = defaultSoundEffectsStorageKey,
  robotAppearanceStorageKey = defaultRobotAppearanceStorageKey
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
    },
    loadRobotAppearance() {
      const storedValue = readStorageValue(storage, robotAppearanceStorageKey);
      if (!storedValue) {
        return null;
      }

      try {
        const parsedValue = JSON.parse(storedValue);
        if (!parsedValue || typeof parsedValue !== 'object') {
          return null;
        }

        if (typeof parsedValue.design !== 'string' || typeof parsedValue.color !== 'string') {
          return null;
        }

        return {
          design: parsedValue.design,
          color: parsedValue.color
        };
      } catch {
        return null;
      }
    },
    saveRobotAppearance(appearance) {
      if (!appearance || typeof appearance !== 'object') {
        return false;
      }

      if (typeof appearance.design !== 'string' || appearance.design.length === 0) {
        return false;
      }

      if (typeof appearance.color !== 'string' || appearance.color.length === 0) {
        return false;
      }

      return writeStorageValue(storage, robotAppearanceStorageKey, JSON.stringify({
        design: appearance.design,
        color: appearance.color
      }));
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
