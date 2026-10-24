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

test('Program validation blocks invalid sequences with clear Arabic messages', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html?level=test-level-validation`, { waitUntil: 'networkidle' });

    await page.click('#play-button');
    const emptyStatus = await page.locator('#status').textContent();
    assert.match(emptyStatus ?? '', /أضف أوامر/);

    await page.goto(`${origin}/index.html?level=test-level-validation`, { waitUntil: 'networkidle' });
    await addBlockToWorkspace(page, 'moveForward');
    await page.click('#play-button');
    const missingStartStatus = await page.locator('#status').textContent();
    assert.match(missingStartStatus ?? '', /ابدأ بكتلة ابدأ/);

    await page.goto(`${origin}/index.html?level=test-level-validation`, { waitUntil: 'networkidle' });
    await addBlockToWorkspace(page, 'start');
    await page.click('#play-button');
    const missingRequiredStatus = await page.locator('#status').textContent();
    assert.match(missingRequiredStatus ?? '', /أمراً مطلوباً/);

    await page.goto(`${origin}/index.html?level=test-level-validation`, { waitUntil: 'networkidle' });
    await addBlockToWorkspace(page, 'start');
    await addBlockToWorkspace(page, 'moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="levelComplete"]');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
