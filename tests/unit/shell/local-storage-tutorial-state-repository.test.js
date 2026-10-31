import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalStorageTutorialStateRepository } from '../../../js/features/shell/index.js';

function createStorageStub() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    }
  };
}

test('tutorial state repository tracks completion in local storage', () => {
  const storage = createStorageStub();
  const repository = createLocalStorageTutorialStateRepository({ storage });

  assert.equal(repository.hasCompletedTutorial(), false);
  assert.equal(repository.markCompletedTutorial(), true);
  assert.equal(repository.hasCompletedTutorial(), true);
});

test('tutorial state repository tolerates unavailable storage', () => {
  const repository = createLocalStorageTutorialStateRepository({ storage: null });

  assert.equal(repository.hasCompletedTutorial(), false);
  assert.equal(repository.markCompletedTutorial(), false);
});
