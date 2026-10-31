import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

async function dragBlockToWorkspace(page, blockType) {
  await page.evaluate((selectedBlockType) => {
    const source = document.querySelector(`#block-${selectedBlockType}`);
    const workspace = document.querySelector('#program-workspace');
    const dataTransfer = new DataTransfer();
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));
    const bounds = workspace.getBoundingClientRect();
    workspace.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer, clientY: bounds.bottom - 2 }));
    workspace.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer, clientY: bounds.bottom - 2 }));
  }, blockType);
}

async function addBodyStep(page, blockType) {
  await page.click(`#block-${blockType}`);
  await page.click('.program-step__add-to-body');
}

test('Distance sensor shows blocked/clear state and updates after movement', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-004&stepDelayMs=0`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#status[data-state="idle"]');

    const blockedSensorText = await page.evaluate(() => document.querySelector('#sensor-state')?.textContent?.trim() ?? '');
    assert.match(blockedSensorText, /عائق/);

    await dragBlockToWorkspace(page, 'if');
    await addBodyStep(page, 'turnRight');
    await addBodyStep(page, 'moveForward');

    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="levelComplete"]', { timeout: 10000 });

    const clearSensorText = await page.evaluate(() => document.querySelector('#sensor-state')?.textContent?.trim() ?? '');
    assert.match(clearSensorText, /واضح/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('If condition uses sensor readings and skips nested commands when path is clear', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-005&stepDelayMs=0`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#status[data-state="idle"]');

    const clearSensorText = await page.evaluate(() => document.querySelector('#sensor-state')?.textContent?.trim() ?? '');
    assert.match(clearSensorText, /واضح/);

    await dragBlockToWorkspace(page, 'if');
    await addBodyStep(page, 'turnRight');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="complete"]', { timeout: 10000 });

    const robotDirection = await page.evaluate(
      () => document.querySelector('#world-grid .robot')?.getAttribute('data-direction') ?? ''
    );
    assert.equal(robotDirection, 'east');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
