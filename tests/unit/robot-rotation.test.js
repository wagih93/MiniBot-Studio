import test from 'node:test';
import assert from 'node:assert/strict';
import { createRobotState, turnLeft, turnRight } from '../../js/features/robot-simulation/index.js';
import { level001 } from '../../js/features/levels/domain/data/level-001.js';

test('turn right rotates direction by 90 degrees without changing position', () => {
  const robotState = createRobotState(level001.robot);
  const turnedRobot = turnRight(robotState);
  assert.deepEqual(turnedRobot, { row: 0, column: 0, direction: 'south', lightOn: false });
});

test('consecutive turns maintain expected orientation and fixed position', () => {
  const robotState = createRobotState(level001.robot);
  const afterLeftTurn = turnLeft(robotState);
  const afterSecondLeftTurn = turnLeft(afterLeftTurn);
  assert.deepEqual(afterLeftTurn, { row: 0, column: 0, direction: 'north', lightOn: false });
  assert.deepEqual(afterSecondLeftTurn, { row: 0, column: 0, direction: 'west', lightOn: false });
});
