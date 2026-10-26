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

test('Completing a level shows celebration and unlocks Next level when available', async () => {
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

    const celebrationSnapshot = await page.evaluate(() => ({
      hidden: document.querySelector('#level-completion')?.hasAttribute('hidden') ?? true,
      message: document.querySelector('#level-completion-message')?.textContent?.trim() ?? '',
      icon: document.querySelector('#level-completion .level-completion__icon')?.textContent?.trim() ?? '',
      nextHidden: document.querySelector('#next-level-button')?.hasAttribute('hidden') ?? true
    }));

    assert.equal(celebrationSnapshot.hidden, false);
    assert.match(celebrationSnapshot.message, /أحسنت/);
    assert.equal(celebrationSnapshot.icon, '🎉');
    assert.equal(celebrationSnapshot.nextHidden, false);

    await page.click('#next-level-button');
    await page.waitForFunction(() => (document.querySelector('#level-indicator')?.textContent ?? '').includes('2/5'));

    const afterNextLevelSnapshot = await page.evaluate(() => ({
      hidden: document.querySelector('#level-completion')?.hasAttribute('hidden') ?? true
    }));

    assert.equal(afterNextLevelSnapshot.hidden, true);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Incorrect attempts do not mark completion and keep feedback non-punitive', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-003`, { waitUntil: 'networkidle' });
    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="blocked"]');

    const failureSnapshot = await page.evaluate(() => ({
      statusText: document.querySelector('#status')?.textContent?.trim() ?? '',
      celebrationHidden: document.querySelector('#level-completion')?.hasAttribute('hidden') ?? true,
      savedLevelId: window.localStorage.getItem('minibot.progress.levelId')
    }));

    assert.equal(failureSnapshot.celebrationHidden, true);
    assert.equal(failureSnapshot.savedLevelId, null);
    assert.doesNotMatch(failureSnapshot.statusText, /فشلت|خسرت|عقوبة/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
