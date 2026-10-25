import test from 'node:test';
import assert from 'node:assert/strict';
import { level001 } from '../../js/levels/data/level-001.js';
import { brokenLevel } from '../../js/levels/data/broken-level.js';
import { validateLevelData } from '../../js/levels/level-validator.js';

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
