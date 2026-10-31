import test from 'node:test';
import assert from 'node:assert/strict';
import { getLevelById, listLevelIds, validateLevelData } from '../../../js/features/levels/index.js';

const expectedLevelIds = ['level-001', 'level-002', 'level-003', 'level-004', 'level-005'];

test('level registry exposes the first five challenge levels in order', () => {
  assert.deepEqual(listLevelIds(), expectedLevelIds);
});

test('first five challenge levels are valid and have objective success conditions', () => {
  for (const levelId of expectedLevelIds) {
    const level = getLevelById(levelId);
    const validation = validateLevelData(level);

    assert.ok(level, `Expected level '${levelId}' to exist`);
    assert.equal(validation.isValid, true, `Expected level '${levelId}' to validate`);
    assert.equal(level.successConditions?.reachGoal, true);
    assert.equal(level.successConditions?.collectAllCollectibles, true);
  }
});

test('level 1 is solved by one movement command', () => {
  const level = getLevelById('level-001');
  const goal = level.collectibles[0];
  const distance = Math.abs(goal.row - level.robot.row) + Math.abs(goal.column - level.robot.column);

  assert.equal(distance, 1);
});

test('level 2 requires two consecutive movement commands', () => {
  const level = getLevelById('level-002');
  const goal = level.collectibles[0];
  const distance = Math.abs(goal.row - level.robot.row) + Math.abs(goal.column - level.robot.column);

  assert.equal(distance, 2);
  assert.equal(goal.row, level.robot.row);
});

test('level 3 introduces turning before movement', () => {
  const level = getLevelById('level-003');

  assert.ok(level.availableBlocks.includes('turnRight'));
  assert.ok(level.availableBlocks.includes('turnLeft'));
  assert.ok(level.availableBlocks.includes('moveForward'));
  assert.ok(level.obstacles.some((obstacle) => obstacle.row === 0 && obstacle.column === 1));
  assert.ok(level.collectibles.some((collectible) => collectible.row === 1 && collectible.column === 0));
});

test('level 4 introduces the if condition with a guided tutorial hint', () => {
  const level = getLevelById('level-004');

  assert.ok(level.availableBlocks.includes('if'));
  assert.ok(level.obstacles.some((obstacle) => obstacle.row === 0 && obstacle.column === 1));
  assert.ok(level.hints[0].includes('مستوى تمهيدي'));
  assert.ok(level.hints[1].includes('إذا كان الطريق مغلقاً'));
  assert.ok(level.obstacles.length >= 3);
});

test('level 5 exposes an independent if-condition challenge', () => {
  const level = getLevelById('level-005');

  assert.equal(level.grid.rows, 5);
  assert.equal(level.grid.columns, 5);
  assert.ok(level.availableBlocks.includes('if'));
  assert.ok(level.hints[0].includes('جرّب هذا التحدي وحدك'));
  assert.ok(level.obstacles.length >= 3);
});
