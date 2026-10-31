import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunSessionController } from '../../../js/features/program-execution/index.js';

function createAbortControllerFactory() {
  let nextId = 0;
  const controllers = [];

  return {
    controllers,
    createAbortController() {
      const controller = {
        id: nextId,
        signal: { id: nextId },
        aborted: false,
        abort() {
          this.aborted = true;
        }
      };
      nextId += 1;
      controllers.push(controller);
      return controller;
    }
  };
}

test('createRunSessionController starts and completes a run session', () => {
  const { createAbortController } = createAbortControllerFactory();
  const runSessionController = createRunSessionController({ createAbortController });

  const runSession = runSessionController.startRunSession();
  assert.ok(runSession);
  assert.equal(runSession.runToken, 1);
  assert.equal(runSessionController.isRunInProgress(), true);
  assert.equal(runSessionController.isCurrentRunToken(1), true);

  runSessionController.finishRunSession({
    runToken: runSession.runToken,
    controller: runSession.controller
  });

  assert.equal(runSessionController.isRunInProgress(), false);
  assert.equal(runSessionController.isCurrentRunToken(1), true);
});

test('createRunSessionController ignores start requests while a run is active', () => {
  const { createAbortController } = createAbortControllerFactory();
  const runSessionController = createRunSessionController({ createAbortController });

  const firstRun = runSessionController.startRunSession();
  assert.ok(firstRun);

  const secondRun = runSessionController.startRunSession();
  assert.equal(secondRun, null);
});

test('createRunSessionController cancels active runs and bumps the run token', () => {
  const { createAbortController, controllers } = createAbortControllerFactory();
  const runSessionController = createRunSessionController({ createAbortController });

  const firstRun = runSessionController.startRunSession();
  assert.ok(firstRun);

  runSessionController.cancelRunSession();
  assert.equal(controllers[0].aborted, true);
  assert.equal(runSessionController.isRunInProgress(), false);
  assert.equal(runSessionController.isCurrentRunToken(firstRun.runToken), false);

  const secondRun = runSessionController.startRunSession();
  assert.ok(secondRun);
  assert.equal(secondRun.runToken, 3);
});
