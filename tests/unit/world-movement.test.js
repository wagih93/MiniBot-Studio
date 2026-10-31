import test from 'node:test';
import assert from 'node:assert/strict';
import { level001 } from '../../js/features/levels/domain/data/level-001.js';
import { createRobotState, moveForward } from '../../js/features/robot-simulation/index.js';
import { canMoveForward, readForwardSensorState } from '../../js/features/robot-simulation/index.js';

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

test('distance sensor reports clear or blocked from the current heading', () => {
  const startState = createRobotState(level001.robot);
  assert.equal(readForwardSensorState(level001, startState), 'clear');

  const blockedState = { row: 0, column: 1, direction: 'east' };
  assert.equal(readForwardSensorState(level001, blockedState), 'blocked');
});
