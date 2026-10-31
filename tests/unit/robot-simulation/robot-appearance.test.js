import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRobotAppearance, robotColorOptions, robotDesignOptions } from '../../../js/features/robot-simulation/index.js';

test('normalizeRobotAppearance returns defaults for missing values', () => {
  assert.deepEqual(normalizeRobotAppearance(null), { design: 'classic', color: 'blue' });
});

test('normalizeRobotAppearance keeps valid values', () => {
  assert.deepEqual(
    normalizeRobotAppearance({ design: robotDesignOptions[1], color: robotColorOptions[2] }),
    { design: 'explorer', color: 'purple' }
  );
});

test('normalizeRobotAppearance falls back for invalid values', () => {
  assert.deepEqual(
    normalizeRobotAppearance({ design: 'unknown', color: 'unknown' }),
    { design: 'classic', color: 'blue' }
  );
});
