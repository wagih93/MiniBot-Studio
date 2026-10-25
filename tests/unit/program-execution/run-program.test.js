import test from 'node:test';
import assert from 'node:assert/strict';
import { createRobotState } from '../../../js/features/robot-simulation/index.js';
import {
  compileProgram,
  createObjectiveProgress,
  runProgram,
  validateProgram
} from '../../../js/features/program-execution/index.js';

function createBaseLevel(overrides = {}) {
  return {
    id: 'test-level',
    grid: { rows: 4, columns: 4 },
    robot: { row: 0, column: 0, direction: 'east' },
    collectibles: [],
    obstacles: [],
    successConditions: { reachGoal: true, collectAllCollectibles: false },
    programValidation: { allowEmptyProgram: false, requiresStartBlock: false, requiredBlocks: [] },
    ...overrides
  };
}

function createExecutionConfig(overrides = {}) {
  return {
    maxStepsPerRun: 12,
    stepDelayMilliseconds: 0,
    repeatSelectedBlockCount: 1,
    ...overrides
  };
}

function createAbortError() {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
}

async function runWithDefaults({
  level,
  instructionSequence,
  executionConfig = createExecutionConfig(),
  signal,
  delay
}) {
  const events = [];
  const selectedLevel = level ?? createBaseLevel();
  const runResult = await runProgram({
    level: selectedLevel,
    instructionSequence,
    initialRobotState: createRobotState(selectedLevel.robot),
    initialObjectiveProgress: createObjectiveProgress(selectedLevel),
    executionConfig,
    delay: delay ?? (async () => {}),
    signal,
    onEvent: (event) => events.push(event)
  });

  return {
    runResult,
    events
  };
}

test('compileProgram uses workspace steps first and falls back to selected block', () => {
  const fromWorkspace = compileProgram(
    [
      { id: 1, blockType: 'start' },
      { id: 2, blockType: 'moveForward' }
    ],
    'turnRight',
    3
  );
  assert.deepEqual(fromWorkspace, [
    { blockType: 'start', stepId: 1 },
    { blockType: 'moveForward', stepId: 2 }
  ]);

  const fromSelectedBlock = compileProgram([], 'turnLeft', 2);
  assert.deepEqual(fromSelectedBlock, [
    { blockType: 'turnLeft', stepId: null },
    { blockType: 'turnLeft', stepId: null }
  ]);
});

test('runProgram moves forward when the path is open', async () => {
  const { runResult } = await runWithDefaults({
    instructionSequence: [{ blockType: 'moveForward', stepId: 11 }]
  });

  assert.equal(runResult.status, 'complete');
  assert.deepEqual(runResult.robotState, { row: 0, column: 1, direction: 'east' });
});

test('runProgram turns right and left without moving the robot', async () => {
  const { runResult } = await runWithDefaults({
    instructionSequence: [
      { blockType: 'turnRight', stepId: 21 },
      { blockType: 'turnLeft', stepId: 22 }
    ]
  });

  assert.equal(runResult.status, 'complete');
  assert.deepEqual(runResult.robotState, { row: 0, column: 0, direction: 'east' });
});

test('runProgram blocks move when an obstacle is ahead', async () => {
  const level = createBaseLevel({
    obstacles: [{ row: 0, column: 1 }]
  });

  const { runResult } = await runWithDefaults({
    level,
    instructionSequence: [{ blockType: 'moveForward', stepId: 31 }]
  });

  assert.equal(runResult.status, 'blocked');
  assert.deepEqual(runResult.robotState, { row: 0, column: 0, direction: 'east' });
});

test('runProgram blocks move when robot would leave the grid', async () => {
  const level = createBaseLevel({
    robot: { row: 0, column: 0, direction: 'north' }
  });

  const { runResult } = await runWithDefaults({
    level,
    instructionSequence: [{ blockType: 'moveForward', stepId: 32 }]
  });

  assert.equal(runResult.status, 'blocked');
  assert.deepEqual(runResult.robotState, { row: 0, column: 0, direction: 'north' });
});

test('runProgram emits collected status when robot reaches a collectible', async () => {
  const level = createBaseLevel({
    collectibles: [{ row: 0, column: 1, type: 'star' }],
    successConditions: { reachGoal: true, collectAllCollectibles: false }
  });

  const { runResult, events } = await runWithDefaults({
    level,
    instructionSequence: [{ blockType: 'moveForward', stepId: 41 }]
  });

  assert.equal(runResult.status, 'complete');
  assert.equal(runResult.objectiveProgress.collectedCollectibleKeys.has('0-1'), true);
  assert.equal(
    events.some((event) => event.type === 'statusChanged' && event.status === 'collected'),
    true
  );
});

test('runProgram completes the level after collecting all collectibles', async () => {
  const level = createBaseLevel({
    collectibles: [{ row: 0, column: 1, type: 'star' }],
    successConditions: { reachGoal: true, collectAllCollectibles: true }
  });

  const { runResult } = await runWithDefaults({
    level,
    instructionSequence: [{ blockType: 'moveForward', stepId: 42 }]
  });

  assert.equal(runResult.status, 'levelComplete');
});

test('runProgram stops with stepLimitExceeded when reaching the configured limit', async () => {
  const { runResult } = await runWithDefaults({
    instructionSequence: [
      { blockType: 'moveForward', stepId: 51 },
      { blockType: 'moveForward', stepId: 52 }
    ],
    executionConfig: createExecutionConfig({ maxStepsPerRun: 1 })
  });

  assert.equal(runResult.status, 'stepLimitExceeded');
  assert.deepEqual(runResult.robotState, { row: 0, column: 1, direction: 'east' });
});

test('runProgram returns aborted when cancellation happens in the middle of the run', async () => {
  const controller = new AbortController();
  let hasAborted = false;
  const delay = async () => {
    if (!hasAborted) {
      hasAborted = true;
      controller.abort();
    }
    throw createAbortError();
  };

  const { runResult } = await runWithDefaults({
    instructionSequence: [{ blockType: 'moveForward', stepId: 61 }],
    executionConfig: createExecutionConfig({ stepDelayMilliseconds: 1 }),
    signal: controller.signal,
    delay
  });

  assert.equal(runResult.status, 'aborted');
});

test('validateProgram reports empty program and missing required blocks', () => {
  const strictLevel = createBaseLevel({
    programValidation: {
      allowEmptyProgram: false,
      requiresStartBlock: true,
      requiredBlocks: ['moveForward']
    }
  });

  assert.equal(validateProgram(strictLevel, []), 'programEmpty');
  assert.equal(validateProgram(strictLevel, [{ blockType: 'turnRight', stepId: 70 }]), 'startRequired');
  assert.equal(
    validateProgram(strictLevel, [
      { blockType: 'start', stepId: 71 },
      { blockType: 'turnLeft', stepId: 72 }
    ]),
    'requiredBlockMissing'
  );
});
