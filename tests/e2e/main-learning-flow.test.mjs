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

test('Main learning flow reaches success on the first level with Arabic RTL document settings', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-003`, { waitUntil: 'networkidle' });

    const languageSnapshot = await page.evaluate(() => ({
      lang: document.documentElement.getAttribute('lang'),
      direction: document.documentElement.getAttribute('dir')
    }));
    assert.equal(languageSnapshot.lang, 'ar');
    assert.equal(languageSnapshot.direction, 'rtl');

    await page.click('#start-button');
    await page.waitForFunction(() => (document.querySelector('#level-indicator')?.textContent ?? '').includes('1/5'));
    await addBlockToWorkspace(page, 'moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="levelComplete"]');

    const completionSnapshot = await page.evaluate(() => ({
      completionHidden: document.querySelector('#level-completion')?.hasAttribute('hidden') ?? true
    }));
    assert.equal(completionSnapshot.completionHidden, false);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Main learning flow restores progress after page reload', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-001`, { waitUntil: 'networkidle' });
    await addBlockToWorkspace(page, 'moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="levelComplete"]');

    await page.reload({ waitUntil: 'networkidle' });

    const continueVisible = await page.evaluate(() => {
      const continueButton = document.querySelector('#continue-button');
      return Boolean(continueButton) && !continueButton.hasAttribute('hidden');
    });
    assert.equal(continueVisible, true);

    await page.click('#continue-button');
    await page.waitForFunction(() => (document.querySelector('#level-indicator')?.textContent ?? '').includes('2/5'));
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Main learning flow supports stopping and resetting a running program', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-005&repeat=10&stepDelayMs=80&maxSteps=20`, {
      waitUntil: 'networkidle'
    });

    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="running"]');
    await page.click('#stop-button');
    await page.waitForSelector('#status[data-state="stopped"]');
    await page.click('#reset-button');
    await page.waitForSelector('#status[data-state="reset"]');

    const resetSnapshot = await page.evaluate(() => ({
      robotColumn: document.querySelector('#world-grid .robot')?.getAttribute('data-column') ?? '',
      status: document.querySelector('#status')?.getAttribute('data-state') ?? ''
    }));
    assert.equal(resetSnapshot.robotColumn, '0');
    assert.equal(resetSnapshot.status, 'reset');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
