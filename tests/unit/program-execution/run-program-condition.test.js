import test from 'node:test';
import assert from 'node:assert/strict';
import { compileProgram, createObjectiveProgress, runProgram } from '../../../js/features/program-execution/index.js';

const noDelay = () => Promise.resolve();

function createConditionLevel(overrides = {}) {
  return {
    id: 'test-condition',
    grid: { rows: 4, columns: 4 },
    robot: { row: 0, column: 0, direction: 'east' },
    collectibles: [{ row: 3, column: 3, type: 'star' }],
    obstacles: [],
    availableBlocks: ['moveForward', 'turnRight', 'if'],
    successConditions: { reachGoal: true, collectAllCollectibles: false },
    ...overrides
  };
}

function makeIfStep(id, body, condition = 'pathBlocked') {
  return { id, blockType: 'if', condition, body };
}

function makeStep(id, blockType) {
  return { id, blockType };
}

async function runWithLevel(level, instructionSequence, events) {
  return runProgram({
    level,
    instructionSequence,
    initialRobotState: { ...level.robot },
    initialObjectiveProgress: createObjectiveProgress(level),
    executionConfig: { maxStepsPerRun: 20, repeatSelectedBlockCount: 1, stepDelayMilliseconds: 0 },
    delay: noDelay,
    onEvent: (event) => events.push(event)
  });
}

test('compileProgram keeps if instructions with nested body commands', () => {
  const instructions = compileProgram(
    [makeIfStep(1, [makeStep(2, 'turnRight')])],
    null,
    1
  );

  assert.deepEqual(instructions, [
    {
      blockType: 'if',
      condition: 'pathBlocked',
      stepId: 1,
      body: [{ blockType: 'turnRight', stepId: 2 }]
    }
  ]);
});

test('runProgram executes conditional body commands when path is blocked', async () => {
  const level = createConditionLevel({
    obstacles: [{ row: 0, column: 1 }]
  });
  const instructions = compileProgram([makeIfStep(1, [makeStep(2, 'turnRight')])], null, 1);
  const events = [];

  const result = await runWithLevel(level, instructions, events);

  assert.equal(result.status, 'complete');
  assert.equal(result.robotState.direction, 'south');
  const activeStepIds = events
    .filter((event) => event.type === 'activeStepChanged')
    .map((event) => event.stepId);
  assert.deepEqual(activeStepIds, [1, 2]);
});

test('runProgram skips conditional body commands when path is clear', async () => {
  const level = createConditionLevel();
  const instructions = compileProgram([makeIfStep(1, [makeStep(2, 'turnRight')])], null, 1);
  const events = [];

  const result = await runWithLevel(level, instructions, events);

  assert.equal(result.status, 'complete');
  assert.equal(result.robotState.direction, 'east');
  const activeStepIds = events
    .filter((event) => event.type === 'activeStepChanged')
    .map((event) => event.stepId);
  assert.deepEqual(activeStepIds, [1]);
});

test('runProgram re-evaluates the condition against current world state', async () => {
  const level = createConditionLevel({
    obstacles: [{ row: 0, column: 1 }]
  });
  const instructions = compileProgram(
    [
      makeIfStep(1, [makeStep(11, 'turnRight')]),
      makeIfStep(2, [makeStep(21, 'turnRight')])
    ],
    null,
    1
  );

  const result = await runWithLevel(level, instructions, []);

  assert.equal(result.status, 'complete');
  assert.equal(result.robotState.direction, 'south');
});
