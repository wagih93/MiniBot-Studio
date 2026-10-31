import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgramEditor } from '../../../js/features/program-editing/index.js';

test('addProgramStep for repeat creates step with default count and empty body', () => {
  const editor = createProgramEditor(['moveForward', 'repeat']);
  const added = editor.addProgramStep('repeat');
  assert.equal(added, true);
  const steps = editor.getProgramSteps();
  assert.equal(steps.length, 1);
  assert.equal(steps[0].blockType, 'repeat');
  assert.equal(steps[0].repeatCount, 3);
  assert.deepEqual(steps[0].body, []);
});

test('addProgramStep for if creates a path-blocked condition with an empty body', () => {
  const editor = createProgramEditor(['moveForward', 'if']);
  const added = editor.addProgramStep('if');
  assert.equal(added, true);
  const steps = editor.getProgramSteps();
  assert.equal(steps.length, 1);
  assert.equal(steps[0].blockType, 'if');
  assert.equal(steps[0].condition, 'pathBlocked');
  assert.deepEqual(steps[0].body, []);
});

test('addBodyStep adds a movement block to a repeat step body', () => {
  const editor = createProgramEditor(['moveForward', 'repeat']);
  editor.addProgramStep('repeat');
  const repeatId = editor.getProgramSteps()[0].id;
  const added = editor.addBodyStep(repeatId, 'moveForward');
  assert.equal(added, true);
  const repeatStep = editor.getProgramSteps()[0];
  assert.equal(repeatStep.body.length, 1);
  assert.equal(repeatStep.body[0].blockType, 'moveForward');
});

test('addBodyStep adds a movement block to an if condition body', () => {
  const editor = createProgramEditor(['moveForward', 'if']);
  editor.addProgramStep('if');
  const conditionStepId = editor.getProgramSteps()[0].id;
  const added = editor.addBodyStep(conditionStepId, 'moveForward');
  assert.equal(added, true);
  const conditionStep = editor.getProgramSteps()[0];
  assert.equal(conditionStep.body.length, 1);
  assert.equal(conditionStep.body[0].blockType, 'moveForward');
});

test('addBodyStep rejects container block types as nested steps', () => {
  const editor = createProgramEditor(['moveForward', 'repeat', 'if']);
  editor.addProgramStep('repeat');
  const repeatId = editor.getProgramSteps()[0].id;
  assert.equal(editor.addBodyStep(repeatId, 'repeat'), false);
  assert.equal(editor.addBodyStep(repeatId, 'if'), false);
  assert.equal(editor.getProgramSteps()[0].body.length, 0);
});

test('addBodyStep rejects unavailable block types', () => {
  const editor = createProgramEditor(['moveForward', 'repeat']);
  editor.addProgramStep('repeat');
  const repeatId = editor.getProgramSteps()[0].id;
  const added = editor.addBodyStep(repeatId, 'turnRight');
  assert.equal(added, false);
});

test('removeBodyStep removes a specific body step from a repeat', () => {
  const editor = createProgramEditor(['moveForward', 'turnRight', 'repeat']);
  editor.addProgramStep('repeat');
  const repeatId = editor.getProgramSteps()[0].id;
  editor.addBodyStep(repeatId, 'moveForward');
  editor.addBodyStep(repeatId, 'turnRight');
  const bodyStepId = editor.getProgramSteps()[0].body[0].id;
  const removed = editor.removeBodyStep(repeatId, bodyStepId);
  assert.equal(removed, true);
  assert.equal(editor.getProgramSteps()[0].body.length, 1);
  assert.equal(editor.getProgramSteps()[0].body[0].blockType, 'turnRight');
});

test('removeBodyStep removes a specific body step from an if condition', () => {
  const editor = createProgramEditor(['moveForward', 'turnRight', 'if']);
  editor.addProgramStep('if');
  const conditionStepId = editor.getProgramSteps()[0].id;
  editor.addBodyStep(conditionStepId, 'moveForward');
  editor.addBodyStep(conditionStepId, 'turnRight');
  const bodyStepId = editor.getProgramSteps()[0].body[0].id;
  const removed = editor.removeBodyStep(conditionStepId, bodyStepId);
  assert.equal(removed, true);
  assert.equal(editor.getProgramSteps()[0].body.length, 1);
  assert.equal(editor.getProgramSteps()[0].body[0].blockType, 'turnRight');
});

test('addBodyStep does not mutate original programSteps array', () => {
  const editor = createProgramEditor(['moveForward', 'repeat']);
  editor.addProgramStep('repeat');
  const repeatId = editor.getProgramSteps()[0].id;
  const stepsBefore = editor.getProgramSteps();
  editor.addBodyStep(repeatId, 'moveForward');
  const stepsAfter = editor.getProgramSteps();
  assert.notStrictEqual(stepsBefore, stepsAfter);
  assert.equal(stepsBefore[0].body.length, 0); // original body unchanged
});
