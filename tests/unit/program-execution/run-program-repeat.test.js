import test from 'node:test';
import assert from 'node:assert/strict';
import { compileProgram } from '../../../js/features/program-execution/index.js';
import { createObjectiveProgress, runProgram } from '../../../js/features/program-execution/index.js';

const simpleLevel = {
  id: 'test-repeat',
  grid: { rows: 3, columns: 5 },
  robot: { row: 0, column: 0, direction: 'east' },
  collectibles: [],
  obstacles: [],
  availableBlocks: ['moveForward', 'repeat'],
  successConditions: {},
  hints: []
};
const noDelay = () => Promise.resolve();
const noSignal = undefined;

function makeRepeatStep(id, repeatCount, body) {
  return { id, blockType: 'repeat', repeatCount, body };
}

function makeStep(id, blockType) {
  return { id, blockType };
}

test('compileProgram flattens repeat(0) to empty sequence', () => {
  const steps = [makeRepeatStep(1, 0, [makeStep(2, 'moveForward')])];
  const instructions = compileProgram(steps, null, 1);
  // count=0 is invalid (< REPEAT_MIN_COUNT=1), so compiler generates invalidRepeatCount sentinel
  assert.equal(instructions.length, 1);
  assert.equal(instructions[0].blockType, 'invalidRepeatCount');
});

test('compileProgram flattens repeat(1, [move]) to [move]', () => {
  const steps = [makeRepeatStep(1, 1, [makeStep(2, 'moveForward')])];
  const instructions = compileProgram(steps, null, 1);
  assert.equal(instructions.length, 1);
  assert.equal(instructions[0].blockType, 'moveForward');
  assert.equal(instructions[0].stepId, 2);
});

test('compileProgram flattens repeat(3, [move, turn]) to 6 instructions', () => {
  const steps = [makeRepeatStep(1, 3, [makeStep(2, 'moveForward'), makeStep(3, 'turnRight')])];
  const instructions = compileProgram(steps, null, 1);
  assert.equal(instructions.length, 6);
  for (let i = 0; i < 3; i += 1) {
    assert.equal(instructions[i * 2].blockType, 'moveForward');
    assert.equal(instructions[i * 2 + 1].blockType, 'turnRight');
  }
});

test('compileProgram generates invalidRepeatCount for count > 10', () => {
  const steps = [makeRepeatStep(1, 11, [makeStep(2, 'moveForward')])];
  const instructions = compileProgram(steps, null, 1);
  assert.equal(instructions.length, 1);
  assert.equal(instructions[0].blockType, 'invalidRepeatCount');
});

test('compileProgram mixes flat steps and repeat correctly', () => {
  const steps = [makeStep(1, 'moveForward'), makeRepeatStep(2, 2, [makeStep(3, 'turnRight')]), makeStep(4, 'moveForward')];
  const instructions = compileProgram(steps, null, 1);
  assert.equal(instructions.length, 4);
  assert.equal(instructions[0].blockType, 'moveForward');
  assert.equal(instructions[1].blockType, 'turnRight');
  assert.equal(instructions[2].blockType, 'turnRight');
  assert.equal(instructions[3].blockType, 'moveForward');
});

test('runProgram repeat(3) moves robot 3 steps east', async () => {
  const steps = [makeRepeatStep(1, 3, [makeStep(2, 'moveForward')])];
  const instructions = compileProgram(steps, null, 1);
  const initialRobot = { row: 0, column: 0, direction: 'east' };
  const initialObjective = createObjectiveProgress(simpleLevel);
  const result = await runProgram({
    level: simpleLevel, instructionSequence: instructions,
    initialRobotState: initialRobot, initialObjectiveProgress: initialObjective,
    executionConfig: { maxStepsPerRun: 20, repeatSelectedBlockCount: 1, stepDelayMilliseconds: 0 },
    delay: noDelay, signal: noSignal, onEvent: () => {}
  });
  assert.equal(result.robotState.column, 3);
  assert.equal(result.robotState.row, 0);
});

test('runProgram rejects invalid repeat count via validateProgram', async () => {
  const instructions = [{ blockType: 'invalidRepeatCount', stepId: 1 }];
  const statuses = [];
  await runProgram({
    level: simpleLevel, instructionSequence: instructions,
    initialRobotState: { row: 0, column: 0, direction: 'east' },
    initialObjectiveProgress: createObjectiveProgress(simpleLevel),
    executionConfig: { maxStepsPerRun: 20, repeatSelectedBlockCount: 1, stepDelayMilliseconds: 0 },
    delay: noDelay, signal: noSignal,
    onEvent: (ev) => { if (ev.type === 'statusChanged') statuses.push(ev.status); }
  });
  assert.ok(statuses.includes('invalidRepeatCount'), `expected invalidRepeatCount, got: ${statuses.join(',')}`);
});

test('runProgram aborts during repeat body when signal fires', async () => {
  const controller = new AbortController();
  const steps = [makeRepeatStep(1, 10, [makeStep(2, 'moveForward'), makeStep(3, 'moveForward')])];
  const instructions = compileProgram(steps, null, 1);
  const callCount = { value: 0 };
  const delayWithAbort = (ms, signal) => {
    callCount.value += 1;
    if (callCount.value >= 3) controller.abort();
    return Promise.resolve();
  };
  const result = await runProgram({
    level: simpleLevel, instructionSequence: instructions,
    initialRobotState: { row: 0, column: 0, direction: 'east' },
    initialObjectiveProgress: createObjectiveProgress(simpleLevel),
    executionConfig: { maxStepsPerRun: 20, repeatSelectedBlockCount: 1, stepDelayMilliseconds: 1 },
    delay: delayWithAbort, signal: controller.signal, onEvent: () => {}
  });
  assert.equal(result.status, 'aborted');
});
