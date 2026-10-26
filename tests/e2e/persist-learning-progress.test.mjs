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

test('Completed levels are persisted locally and Continue restores progress after reopening', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const firstPage = await context.newPage();

  try {
    await firstPage.goto(`${origin}/tests/e2e/test-entry.html?level=level-001`, { waitUntil: 'networkidle' });
    await addBlockToWorkspace(firstPage, 'moveForward');
    await firstPage.click('#play-button');
    await firstPage.waitForSelector('#status[data-state="levelComplete"]');

    const storageAfterCompletion = await firstPage.evaluate(() => ({
      savedLevelId: window.localStorage.getItem('minibot.progress.levelId'),
      completedLevelIds: JSON.parse(window.localStorage.getItem('minibot.progress.completedLevelIds.v1') ?? '[]')
    }));

    assert.equal(storageAfterCompletion.savedLevelId, 'level-002');
    assert.deepEqual(storageAfterCompletion.completedLevelIds, ['level-001']);

    await firstPage.close();
    const reopenedPage = await context.newPage();
    await reopenedPage.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    const continueVisible = await reopenedPage.evaluate(() => {
      const continueButton = document.querySelector('#continue-button');
      return Boolean(continueButton) && !continueButton.hasAttribute('hidden');
    });
    assert.equal(continueVisible, true);

    await reopenedPage.click('#continue-button');
    await reopenedPage.waitForFunction(() => (document.querySelector('#level-indicator')?.textContent ?? '').includes('2/5'));

    const resumedLevelIndicator = await reopenedPage.evaluate(
      () => document.querySelector('#level-indicator')?.textContent?.trim() ?? ''
    );
    assert.match(resumedLevelIndicator, /2\/5/);
    await reopenedPage.close();
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Parent area clears saved progress only after explicit confirmation', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem('minibot.progress.levelId', 'level-003');
    window.localStorage.setItem('minibot.progress.completedLevelIds.v1', JSON.stringify(['level-001', 'level-002']));
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });
    await page.click('#parents-button');

    page.once('dialog', (dialog) => dialog.dismiss());
    await page.click('#clear-progress-button');
    await page.waitForSelector('#status[data-state="progressClearCancelled"]');

    const storageAfterCancel = await page.evaluate(() => ({
      savedLevelId: window.localStorage.getItem('minibot.progress.levelId'),
      completedLevelIds: JSON.parse(window.localStorage.getItem('minibot.progress.completedLevelIds.v1') ?? '[]')
    }));
    assert.equal(storageAfterCancel.savedLevelId, 'level-003');
    assert.deepEqual(storageAfterCancel.completedLevelIds, ['level-001', 'level-002']);

    await page.click('#parents-button');
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('#clear-progress-button');
    await page.waitForSelector('#status[data-state="progressCleared"]');

    const storageAfterClear = await page.evaluate(() => ({
      savedLevelId: window.localStorage.getItem('minibot.progress.levelId'),
      completedLevelIds: window.localStorage.getItem('minibot.progress.completedLevelIds.v1'),
      continueHidden: document.querySelector('#continue-button')?.hasAttribute('hidden') ?? true
    }));
    assert.equal(storageAfterClear.savedLevelId, null);
    assert.equal(storageAfterClear.completedLevelIds, null);
    assert.equal(storageAfterClear.continueHidden, true);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
