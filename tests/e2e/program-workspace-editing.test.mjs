import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

async function addBlockToWorkspace(page, blockType) {
  await page.evaluate((currentBlockType) => {
    const source = document.querySelector(`#block-${currentBlockType}`);
    const workspace = document.querySelector('#program-workspace');
    const dataTransfer = new DataTransfer();

    source.dispatchEvent(
      new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      })
    );

    const bounds = workspace.getBoundingClientRect();
    workspace.dispatchEvent(
      new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientY: bounds.bottom - 2
      })
    );

    workspace.dispatchEvent(
      new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientY: bounds.bottom - 2
      })
    );

    source.dispatchEvent(
      new DragEvent('dragend', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      })
    );
  }, blockType);
}

test('Program blocks can be reordered and deleted without removing adjacent blocks', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    await addBlockToWorkspace(page, 'moveForward');
    await addBlockToWorkspace(page, 'turnRight');
    await addBlockToWorkspace(page, 'turnLeft');

    await page.evaluate(() => {
      const workspace = document.querySelector('#program-workspace');
      const steps = Array.from(document.querySelectorAll('#program-list .program-step'));
      const stepToMove = steps[2];
      const firstStep = steps[0];
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('application/x-program-step-id', stepToMove.dataset.stepId);

      stepToMove.dispatchEvent(
        new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          dataTransfer
        })
      );

      const topY = firstStep.getBoundingClientRect().top + 1;
      workspace.dispatchEvent(
        new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
          clientY: topY
        })
      );
      workspace.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
          clientY: topY
        })
      );
      stepToMove.dispatchEvent(
        new DragEvent('dragend', {
          bubbles: true,
          cancelable: true,
          dataTransfer
        })
      );
    });

    await page.click('#program-list .program-step:nth-child(2) .program-step__remove');

    const sequenceSnapshot = await page.evaluate(() => ({
      labels: Array.from(document.querySelectorAll('#program-list .program-step__label')).map((node) =>
        node.textContent?.trim()
      ),
      status: document.querySelector('#status')?.textContent?.trim() ?? ''
    }));

    assert.deepEqual(sequenceSnapshot.labels, ['انعطف يساراً', 'انعطف يميناً']);
    assert.match(sequenceSnapshot.status, /حذف الأمر/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Workspace display order matches execution order', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    await addBlockToWorkspace(page, 'moveForward');
    await addBlockToWorkspace(page, 'turnRight');

    await page.evaluate(() => {
      const workspace = document.querySelector('#program-workspace');
      const steps = Array.from(document.querySelectorAll('#program-list .program-step'));
      const stepToMove = steps[1];
      const firstStep = steps[0];
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('application/x-program-step-id', stepToMove.dataset.stepId);

      stepToMove.dispatchEvent(
        new DragEvent('dragstart', {
          bubbles: true,
          cancelable: true,
          dataTransfer
        })
      );

      const topY = firstStep.getBoundingClientRect().top + 1;
      workspace.dispatchEvent(
        new DragEvent('dragover', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
          clientY: topY
        })
      );
      workspace.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer,
          clientY: topY
        })
      );
    });

    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="complete"]');

    const robotSnapshot = await page.evaluate(() => {
      const robot = document.querySelector('#world-grid .robot');
      return {
        row: robot?.getAttribute('data-row') ?? '',
        column: robot?.getAttribute('data-column') ?? '',
        direction: robot?.getAttribute('data-direction') ?? ''
      };
    });

    assert.equal(robotSnapshot.row, '1');
    assert.equal(robotSnapshot.column, '0');
    assert.equal(robotSnapshot.direction, 'south');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

