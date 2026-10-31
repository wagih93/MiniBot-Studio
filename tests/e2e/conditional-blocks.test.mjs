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

test('Condition tutorial level appears before challenge level and allows nested commands', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-004&stepDelayMs=0`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#status[data-state="idle"]');
    await page.waitForSelector('#block-if');

    const tutorialHint = await page.evaluate(() => document.querySelector('#level-hint')?.textContent?.trim() ?? '');
    assert.match(tutorialHint, /مستوى تمهيدي/);

    await dragBlockToWorkspace(page, 'if');
    await page.waitForSelector('.program-step--if', { timeout: 5000 });
    await addBodyStep(page, 'turnRight');
    await addBodyStep(page, 'moveForward');
    await page.waitForFunction(() => document.querySelectorAll('.program-step--body').length === 2);

    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="levelComplete"]', { timeout: 10000 });

    await page.click('#next-level-button');
    await page.waitForFunction(() => (document.querySelector('#level-indicator')?.textContent ?? '').includes('5/5'));

    const challengeHint = await page.evaluate(() => document.querySelector('#level-hint')?.textContent?.trim() ?? '');
    assert.match(challengeHint, /تحدي/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Conditional body is skipped when the path is not blocked', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-005&stepDelayMs=0`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#status[data-state="idle"]');
    await page.waitForSelector('#block-if');

    await dragBlockToWorkspace(page, 'if');
    await page.waitForSelector('.program-step--if', { timeout: 5000 });
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
