import test from 'node:test';
import assert from 'node:assert/strict';
import { level001 } from '../../js/features/levels/domain/data/level-001.js';
import { brokenLevel } from '../fixtures/levels/broken-level.js';
import { validateLevelData } from '../../js/features/levels/index.js';

test('level validator accepts valid level data', () => {
  const validation = validateLevelData(level001);
  assert.equal(validation.isValid, true);
  assert.deepEqual(validation.errors, []);
});

test('level validator rejects invalid level data', () => {
  const validation = validateLevelData(brokenLevel);
  assert.equal(validation.isValid, false);
  assert.ok(validation.errors.length > 0);
});
