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
  }, blockType);
}

test('Program execution highlights each step in order and clears highlight on finish', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-005&stepDelayMs=120`, { waitUntil: 'networkidle' });

    await addBlockToWorkspace(page, 'moveForward');
    await addBlockToWorkspace(page, 'turnRight');
    await page.click('#play-button');

    await page.waitForFunction(() => {
      const active = document.querySelector('#program-list .program-step[data-active=\"true\"] .program-step__label');
      return active?.textContent?.includes('تقدّم خطوة');
    });

    await page.waitForFunction(() => {
      const active = document.querySelector('#program-list .program-step[data-active=\"true\"] .program-step__label');
      return active?.textContent?.includes('انعطف يميناً');
    });

    await page.waitForSelector('#status[data-state="complete"]');

    const finalSnapshot = await page.evaluate(() => ({
      activeHighlights: document.querySelectorAll('#program-list .program-step[data-active=\"true\"]').length,
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? '',
      robotDirection: document.querySelector('#world-grid .robot')?.getAttribute('data-direction') ?? ''
    }));

    assert.equal(finalSnapshot.activeHighlights, 0);
    assert.equal(finalSnapshot.robotColumn, '1');
    assert.equal(finalSnapshot.robotDirection, 'south');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Stopping execution clears active-step highlighting', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-005&stepDelayMs=220`, { waitUntil: 'networkidle' });

    await addBlockToWorkspace(page, 'moveForward');
    await addBlockToWorkspace(page, 'turnRight');
    await addBlockToWorkspace(page, 'moveForward');
    await page.click('#play-button');

    await page.waitForFunction(
      () => document.querySelectorAll('#program-list .program-step[data-active=\"true\"]').length === 1
    );
    await page.click('#stop-button');
    await page.waitForSelector('#status[data-state="stopped"]');

    const stoppedSnapshot = await page.evaluate(() => ({
      activeHighlights: document.querySelectorAll('#program-list .program-step[data-active=\"true\"]').length
    }));

    assert.equal(stoppedSnapshot.activeHighlights, 0);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
