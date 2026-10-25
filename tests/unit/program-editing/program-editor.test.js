import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addProgramStep,
  clearProgram,
  createProgramEditorState,
  moveProgramStep,
  removeProgramStep,
  restoreProgramFromBlockTypes
} from '../../../js/features/program-editing/index.js';

const availableBlockTypes = ['start', 'moveForward', 'turnLeft', 'turnRight'];

test('ProgramEditor adds steps at the requested insert position', () => {
  const initialState = createProgramEditorState();
  const firstAdd = addProgramStep(initialState, {
    blockType: 'start',
    insertIndex: 0,
    availableBlockTypes
  });
  const secondAdd = addProgramStep(firstAdd.state, {
    blockType: 'moveForward',
    insertIndex: 0,
    availableBlockTypes
  });

  assert.equal(firstAdd.added, true);
  assert.equal(secondAdd.added, true);
  assert.deepEqual(
    secondAdd.state.programSteps.map((step) => step.blockType),
    ['moveForward', 'start']
  );
});

test('ProgramEditor reorders steps by id', () => {
  const initialState = createProgramEditorState();
  const firstAdd = addProgramStep(initialState, {
    blockType: 'start',
    insertIndex: 0,
    availableBlockTypes
  });
  const secondAdd = addProgramStep(firstAdd.state, {
    blockType: 'moveForward',
    insertIndex: 1,
    availableBlockTypes
  });
  const thirdAdd = addProgramStep(secondAdd.state, {
    blockType: 'turnRight',
    insertIndex: 2,
    availableBlockTypes
  });

  const moved = moveProgramStep(thirdAdd.state, 3, 1);
  assert.equal(moved.moved, true);
  assert.deepEqual(
    moved.state.programSteps.map((step) => step.blockType),
    ['start', 'turnRight', 'moveForward']
  );
});

test('ProgramEditor removes one step without mutating others', () => {
  const initialState = createProgramEditorState();
  const firstAdd = addProgramStep(initialState, {
    blockType: 'start',
    insertIndex: 0,
    availableBlockTypes
  });
  const secondAdd = addProgramStep(firstAdd.state, {
    blockType: 'moveForward',
    insertIndex: 1,
    availableBlockTypes
  });

  const removed = removeProgramStep(secondAdd.state, 1);
  assert.equal(removed.removed, true);
  assert.deepEqual(
    removed.state.programSteps.map((step) => step.blockType),
    ['moveForward']
  );
});

test('ProgramEditor rejects unavailable block types', () => {
  const initialState = createProgramEditorState();
  const addResult = addProgramStep(initialState, {
    blockType: 'repeat',
    insertIndex: 0,
    availableBlockTypes
  });

  assert.equal(addResult.added, false);
  assert.deepEqual(addResult.state.programSteps, []);
});

test('ProgramEditor keeps unique step ids after delete and add', () => {
  const initialState = createProgramEditorState();
  const firstAdd = addProgramStep(initialState, {
    blockType: 'start',
    insertIndex: 0,
    availableBlockTypes
  });
  const secondAdd = addProgramStep(firstAdd.state, {
    blockType: 'moveForward',
    insertIndex: 1,
    availableBlockTypes
  });
  const removed = removeProgramStep(secondAdd.state, 1);
  const thirdAdd = addProgramStep(removed.state, {
    blockType: 'turnLeft',
    insertIndex: 1,
    availableBlockTypes
  });

  assert.equal(thirdAdd.added, true);
  assert.deepEqual(
    thirdAdd.state.programSteps.map((step) => step.id),
    [2, 3]
  );
});

test('ProgramEditor restores filtered programs and clears state correctly', () => {
  const restored = restoreProgramFromBlockTypes(
    createProgramEditorState(),
    ['start', 'unknown', 'moveForward'],
    availableBlockTypes
  );
  assert.deepEqual(
    restored.programSteps.map((step) => step.blockType),
    ['start', 'moveForward']
  );

  const cleared = clearProgram(restored);
  assert.deepEqual(cleared.programSteps, []);
  assert.equal(cleared.nextProgramStepId, 1);
});
