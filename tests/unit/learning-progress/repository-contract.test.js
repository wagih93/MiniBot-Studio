import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInMemoryProgramRepository,
  createInMemoryProgressRepository,
  createLocalStorageProgramRepository,
  createLocalStorageProgressRepository
} from '../../../js/features/learning-progress/index.js';

const allowedLevelIds = ['level-001', 'level-002', 'level-003', 'level-004', 'level-005'];

runProgressRepositoryContract('in-memory adapter', (options = {}) =>
  createInMemoryProgressRepository({
    allowedLevelIds,
    ...options
  })
);
runProgressRepositoryContract('localStorage adapter', (options = {}) =>
  createLocalStorageProgressRepository({
    allowedLevelIds,
    storage: options.storage ?? createMemoryStorage(),
    ...options
  })
);

runProgramRepositoryContract('in-memory adapter', (options = {}) =>
  createInMemoryProgramRepository({
    allowedLevelIds,
    ...options
  })
);
runProgramRepositoryContract('localStorage adapter', (options = {}) =>
  createLocalStorageProgramRepository({
    allowedLevelIds,
    storage: options.storage ?? createMemoryStorage(),
    ...options
  })
);

test('localStorage progress adapter returns safe defaults when storage is unavailable', () => {
  const repository = createLocalStorageProgressRepository({
    allowedLevelIds,
    storage: createThrowingStorage()
  });

  assert.equal(repository.loadSavedLevelId(), null);
  assert.equal(repository.saveSavedLevelId('level-001'), false);
});

test('localStorage program adapter returns safe defaults when storage is unavailable', () => {
  const repository = createLocalStorageProgramRepository({
    allowedLevelIds,
    storage: createThrowingStorage()
  });

  assert.deepEqual(repository.loadProgram('level-001'), {
    blockTypes: [],
    failed: true
  });
  assert.equal(repository.saveProgram('level-001', ['start']), false);
});

test('localStorage program adapter handles corrupt and unknown-version stores safely', () => {
  const corruptRepository = createLocalStorageProgramRepository({
    allowedLevelIds,
    storage: createMemoryStorage({
      'minibot.programs.v1': '{not-valid-json'
    })
  });
  assert.deepEqual(corruptRepository.loadProgram('level-001'), {
    blockTypes: [],
    failed: true
  });

  const unknownVersionRepository = createLocalStorageProgramRepository({
    allowedLevelIds,
    storage: createMemoryStorage({
      'minibot.programs.v1': JSON.stringify({
        version: 2,
        programs: {
          'level-001': ['start']
        }
      })
    })
  });
  assert.deepEqual(unknownVersionRepository.loadProgram('level-001'), {
    blockTypes: [],
    failed: true
  });
});

test('in-memory program adapter handles unknown-version stores safely', () => {
  const repository = createInMemoryProgramRepository({
    allowedLevelIds,
    initialStore: {
      version: 99,
      programs: {
        'level-001': ['start']
      }
    }
  });

  assert.deepEqual(repository.loadProgram('level-001'), {
    blockTypes: [],
    failed: true
  });
});

function runProgressRepositoryContract(adapterName, createRepository) {
  test(`ProgressRepository contract: ${adapterName} loads null when empty`, () => {
    const repository = createRepository();
    assert.equal(repository.loadSavedLevelId(), null);
  });

  test(`ProgressRepository contract: ${adapterName} saves and reloads allowed levels`, () => {
    const repository = createRepository();
    assert.equal(repository.saveSavedLevelId('level-002'), true);
    assert.equal(repository.loadSavedLevelId(), 'level-002');
  });

  test(`ProgressRepository contract: ${adapterName} rejects unknown levels`, () => {
    const repository = createRepository();
    repository.saveSavedLevelId('level-001');

    assert.equal(repository.saveSavedLevelId('unknown-level'), false);
    assert.equal(repository.loadSavedLevelId(), 'level-001');
  });
}

function runProgramRepositoryContract(adapterName, createRepository) {
  test(`ProgramRepository contract: ${adapterName} loads empty defaults`, () => {
    const repository = createRepository();
    assert.deepEqual(repository.loadProgram('level-001'), {
      blockTypes: [],
      failed: false
    });
  });

  test(`ProgramRepository contract: ${adapterName} saves and loads level programs`, () => {
    const repository = createRepository();

    assert.equal(repository.saveProgram('level-001', ['start', 'moveForward']), true);
    assert.deepEqual(repository.loadProgram('level-001'), {
      blockTypes: ['start', 'moveForward'],
      failed: false
    });
  });

  test(`ProgramRepository contract: ${adapterName} rejects unknown levels`, () => {
    const repository = createRepository();

    assert.equal(repository.saveProgram('unknown-level', ['start']), false);
    assert.deepEqual(repository.loadProgram('unknown-level'), {
      blockTypes: [],
      failed: false
    });
  });
}

function createMemoryStorage(initialEntries = {}) {
  const entries = new Map(Object.entries(initialEntries));

  return {
    getItem(key) {
      return entries.has(key) ? entries.get(key) : null;
    },
    setItem(key, value) {
      entries.set(key, String(value));
    },
    removeItem(key) {
      entries.delete(key);
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
    },
    removeItem() {
      throw new Error('Storage unavailable');
    }
  };
}
