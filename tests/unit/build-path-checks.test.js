import test from 'node:test';
import assert from 'node:assert/strict';
import { findTopLevelDirectoryMatches, hasTopLevelDirectoryEntry } from '../../scripts/build-path-checks.mjs';

test('hasTopLevelDirectoryEntry only matches top-level directories', () => {
  assert.equal(hasTopLevelDirectoryEntry('levels/level-registry.js', 'levels'), true);
  assert.equal(hasTopLevelDirectoryEntry('simulator/robot.js', 'simulator'), true);
  assert.equal(hasTopLevelDirectoryEntry('i18n/ar.js', 'i18n'), true);
  assert.equal(hasTopLevelDirectoryEntry('features/levels/domain/data/level-001.js', 'levels'), false);
  assert.equal(hasTopLevelDirectoryEntry('features/simulator/domain/simulator-view.js', 'simulator'), false);
  assert.equal(hasTopLevelDirectoryEntry('features/i18n/domain/labels.js', 'i18n'), false);
});

test('findTopLevelDirectoryMatches supports POSIX path separators', () => {
  const jsEntries = [
    'features/levels/domain/data/level-001.js',
    'features/robot-simulation/index.js',
    'levels/level-registry.js',
    'i18n/ar.js',
    'shell/index.js'
  ];

  assert.deepEqual(
    findTopLevelDirectoryMatches(jsEntries, ['simulator', 'levels', 'i18n']),
    ['levels', 'i18n']
  );
});
