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

test('tutorial state repository tolerates a throwing localStorage getter', () => {
  const previousDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('blocked-storage');
    }
  });

  try {
    const repository = createLocalStorageTutorialStateRepository();
    assert.equal(repository.hasCompletedTutorial(), false);
    assert.equal(repository.markCompletedTutorial(), false);
  } finally {
    if (previousDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', previousDescriptor);
    } else {
      delete globalThis.localStorage;
    }
  }
});

test('tutorial state repository fails safely when storage read throws', () => {
  const repository = createLocalStorageTutorialStateRepository({
    storage: {
      getItem() {
        throw new Error('read-failed');
      },
      setItem() {
        throw new Error('write-failed');
      }
    }
  });

  assert.equal(repository.hasCompletedTutorial(), false);
  assert.equal(repository.markCompletedTutorial(), false);
});
