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

test('Programs can be saved locally and restored after reload', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html?level=level-001`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#block-start');
    await addBlockToWorkspace(page, 'start');
    await addBlockToWorkspace(page, 'moveForward');
    await page.click('#save-program-button');
    await page.waitForSelector('#status');

    const savedStatus = await page.locator('#status').textContent();
    assert.match(savedStatus ?? '', /تم حفظ البرنامج/);

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('#program-list .program-step');

    const restoredSnapshot = await page.evaluate(() => ({
      labels: Array.from(document.querySelectorAll('#program-list .program-step__label')).map((item) =>
        item.textContent?.trim()
      ),
      status: document.querySelector('#status')?.textContent?.trim() ?? ''
    }));

    assert.deepEqual(restoredSnapshot.labels, ['ابدأ', 'تقدّم خطوة']);
    assert.match(restoredSnapshot.status, /استعادة البرنامج/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Corrupt saved programs are handled gracefully without crashing', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem('minibot.programs.v1', '{not-valid-json');
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });

    const healthSnapshot = await page.evaluate(() => ({
      status: document.querySelector('#status')?.textContent?.trim() ?? '',
      cellCount: document.querySelectorAll('#world-grid .cell').length,
      hasMoveBlock: Boolean(document.querySelector('#block-moveForward'))
    }));

    assert.match(healthSnapshot.status, /تعذّر استعادة البرنامج/);
    assert.ok(healthSnapshot.cellCount > 0);
    assert.equal(healthSnapshot.hasMoveBlock, true);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
