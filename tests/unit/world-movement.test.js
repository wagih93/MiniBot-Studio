import test from 'node:test';
import assert from 'node:assert/strict';
import { level001 } from '../../js/levels/data/level-001.js';
import { createRobotState, moveForward } from '../../js/simulator/robot.js';
import { canMoveForward } from '../../js/simulator/world.js';

test('move forward advances one cell when the path is open', () => {
  const robotState = createRobotState(level001.robot);
  assert.equal(canMoveForward(level001, robotState), true);

  const nextState = moveForward(robotState);
  assert.deepEqual(nextState, { row: 0, column: 1, direction: 'east' });
});

test('move forward is blocked by walls and boundaries', () => {
  const nearWallState = { row: 0, column: 1, direction: 'east' };
  assert.equal(canMoveForward(level001, nearWallState), false);

  const boundaryState = { row: 0, column: 0, direction: 'west' };
  assert.equal(canMoveForward(level001, boundaryState), false);
});
