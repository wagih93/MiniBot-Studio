import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

async function dragBlockToWorkspace(page, blockType) {
  await page.evaluate((bt) => {
    const source = document.querySelector(`#block-${bt}`);
    const workspace = document.querySelector('#program-workspace');
    const dataTransfer = new DataTransfer();
    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));
    const bounds = workspace.getBoundingClientRect();
    workspace.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer, clientY: bounds.bottom - 2 }));
    workspace.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer, clientY: bounds.bottom - 2 }));
  }, blockType);
}

test('Repeat block appears in toolbox and nested blocks execute the correct number of times', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-repeat&stepDelayMs=0`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#status[data-state="idle"]');

    // Repeat block should be visible in the toolbox for this level
    await page.waitForSelector('#block-list #block-repeat', { timeout: 5000 });
    const toolboxBlocks = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#block-list .block-item')).map((el) => el.id)
    );
    assert.ok(toolboxBlocks.includes('block-repeat'), `repeat block missing from toolbox; found: ${toolboxBlocks.join(',')}`);

    // Drag the repeat block to the workspace
    await dragBlockToWorkspace(page, 'repeat');
    await page.waitForSelector('.program-step--repeat', { timeout: 5000 });

    // Repeat block shows an add-to-body button
    const addBtnExists = await page.evaluate(() => document.querySelector('.program-step__add-to-body') !== null);
    assert.equal(addBtnExists, true, 'add-to-body button should exist');

    // Select moveForward then click "+" to add to repeat body
    await page.click('#block-moveForward');
    await page.click('.program-step__add-to-body');
    await page.waitForSelector('.program-step--body', { timeout: 5000 });

    const bodyBlock = await page.evaluate(() => {
      const el = document.querySelector('.program-step--body');
      return el ? el.dataset.stepId : null;
    });
    assert.ok(bodyBlock !== null, 'body step should be rendered inside repeat block');

    // Play — repeat(3, [moveForward]) runs without crash
    await page.click('#play-button');
    await page.waitForSelector('#status:not([data-state="idle"]):not([data-state="running"])', { timeout: 10000 });

    const finalStatus = await page.evaluate(() => document.querySelector('#status')?.dataset?.state ?? '');
    assert.notEqual(finalStatus, 'unexpectedError');
    assert.notEqual(finalStatus, 'unsupported');
    assert.notEqual(finalStatus, 'invalidRepeatCount');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
