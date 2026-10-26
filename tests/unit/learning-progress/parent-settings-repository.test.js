import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalStorageParentSettingsRepository } from '../../../js/features/learning-progress/index.js';

test('ParentSettingsRepository loads enabled by default', () => {
  const repository = createLocalStorageParentSettingsRepository({
    storage: createMemoryStorage()
  });

  assert.equal(repository.loadSoundEffectsEnabled(), true);
});

test('ParentSettingsRepository saves and loads sound effects preference', () => {
  const repository = createLocalStorageParentSettingsRepository({
    storage: createMemoryStorage()
  });

  assert.equal(repository.saveSoundEffectsEnabled(false), true);
  assert.equal(repository.loadSoundEffectsEnabled(), false);
  assert.equal(repository.saveSoundEffectsEnabled(true), true);
  assert.equal(repository.loadSoundEffectsEnabled(), true);
});

test('ParentSettingsRepository handles unavailable storage safely', () => {
  const repository = createLocalStorageParentSettingsRepository({
    storage: createThrowingStorage()
  });

  assert.equal(repository.loadSoundEffectsEnabled(), true);
  assert.equal(repository.saveSoundEffectsEnabled(false), false);
});

function createMemoryStorage(initialEntries = {}) {
  const entries = new Map(Object.entries(initialEntries));

  return {
    getItem(key) {
      return entries.has(key) ? entries.get(key) : null;
    },
    setItem(key, value) {
      entries.set(key, String(value));
    }
  };
}

function createThrowingStorage() {
  return {
    getItem() {
      throw new Error('Storage unavailable');
    },
    setItem() {
      throw new Error('Storage unavailable');
    }
  };
}
