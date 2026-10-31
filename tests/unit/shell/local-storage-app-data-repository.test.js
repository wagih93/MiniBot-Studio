import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalStorageAppDataRepository } from '../../../js/features/shell/index.js';

function createStorageStub(initialEntries = {}) {
  const values = new Map(Object.entries(initialEntries));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
}

test('local app data repository clears all configured keys', () => {
  const storage = createStorageStub({
    'minibot.progress.levelId': 'level-003',
    'minibot.progress.completedLevelIds.v1': '["level-001"]',
    'minibot.programs.v1': '{"version":1,"programs":{"level-003":["start"]}}',
    'minibot.settings.soundEffectsEnabled': 'false',
    'minibot.settings.robotAppearance.v1': '{"design":"explorer","color":"green"}',
    'minibot.tutorial.completed': 'true'
  });
  const repository = createLocalStorageAppDataRepository({ storage });

  assert.equal(repository.clearAppData(), true);
  assert.equal(storage.getItem('minibot.progress.levelId'), null);
  assert.equal(storage.getItem('minibot.progress.completedLevelIds.v1'), null);
  assert.equal(storage.getItem('minibot.programs.v1'), null);
  assert.equal(storage.getItem('minibot.settings.soundEffectsEnabled'), null);
  assert.equal(storage.getItem('minibot.settings.robotAppearance.v1'), null);
  assert.equal(storage.getItem('minibot.tutorial.completed'), null);
});

test('local app data repository fails safely when storage is unavailable', () => {
  const repository = createLocalStorageAppDataRepository({ storage: null });
  assert.equal(repository.clearAppData(), false);
});

test('local app data repository fails safely when removeItem throws', () => {
  const repository = createLocalStorageAppDataRepository({
    storage: {
      removeItem() {
        throw new Error('storage unavailable');
      }
    }
  });

  assert.equal(repository.clearAppData(), false);
});
