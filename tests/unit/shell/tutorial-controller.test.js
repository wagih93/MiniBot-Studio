import test from 'node:test';
import assert from 'node:assert/strict';
import { createTutorialController } from '../../../js/features/shell/index.js';

function createTutorialSteps() {
  return [
    { title: 'الخطوة ١', description: 'وصف ١', focusTarget: 'toolbox' },
    { title: 'الخطوة ٢', description: 'وصف ٢', focusTarget: 'workspace' },
    { title: 'الخطوة ٣', description: 'وصف ٣', focusTarget: 'play' }
  ];
}

test('createTutorialController opens tutorial on first use and advances one step at a time', () => {
  let completed = false;
  const tutorialController = createTutorialController({
    steps: createTutorialSteps(),
    hasCompletedTutorial: () => completed,
    markCompletedTutorial: () => {
      completed = true;
      return true;
    }
  });

  const firstStep = tutorialController.openTutorialIfNeeded();
  assert.ok(firstStep);
  assert.equal(firstStep.index, 0);
  assert.equal(firstStep.total, 3);

  const secondStep = tutorialController.nextStep();
  assert.equal(secondStep.completed, false);
  assert.equal(secondStep.step?.index, 1);

  const thirdStep = tutorialController.nextStep();
  assert.equal(thirdStep.completed, false);
  assert.equal(thirdStep.step?.index, 2);

  const completion = tutorialController.nextStep();
  assert.equal(completion.completed, true);
  assert.equal(tutorialController.isVisible(), false);
  assert.equal(completed, true);
});

test('createTutorialController supports skipping and replaying later', () => {
  let completed = false;
  const tutorialController = createTutorialController({
    steps: createTutorialSteps(),
    hasCompletedTutorial: () => completed,
    markCompletedTutorial: () => {
      completed = true;
      return true;
    }
  });

  tutorialController.openTutorialIfNeeded();
  assert.equal(tutorialController.isVisible(), true);
  assert.equal(tutorialController.skipTutorial(), true);
  assert.equal(tutorialController.isVisible(), false);
  assert.equal(completed, true);

  assert.equal(tutorialController.openTutorialIfNeeded(), null);

  const replayStep = tutorialController.replayTutorial();
  assert.ok(replayStep);
  assert.equal(replayStep.index, 0);
  assert.equal(tutorialController.isVisible(), true);
});

test('createTutorialController closes tutorial without forcing completion state', () => {
  let markCalls = 0;
  const tutorialController = createTutorialController({
    steps: createTutorialSteps(),
    hasCompletedTutorial: () => false,
    markCompletedTutorial: () => {
      markCalls += 1;
      return true;
    }
  });

  tutorialController.openTutorialIfNeeded();
  tutorialController.closeTutorial();

  assert.equal(tutorialController.isVisible(), false);
  assert.equal(markCalls, 0);
});
