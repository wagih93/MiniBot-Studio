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

test('First level exposes Start and Move Forward blocks with a visual add-block demo', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });

    const firstLevelSnapshot = await page.evaluate(() => ({
      blockIds: Array.from(document.querySelectorAll('#block-list .block-item')).map((item) => item.id),
      demoVisible: !document.querySelector('#program-demo')?.hasAttribute('hidden'),
      demoText: document.querySelector('#program-demo')?.textContent?.trim() ?? ''
    }));

    assert.ok(firstLevelSnapshot.blockIds.includes('block-start'));
    assert.ok(firstLevelSnapshot.blockIds.includes('block-moveForward'));
    assert.equal(firstLevelSnapshot.demoVisible, true);
    assert.match(firstLevelSnapshot.demoText, /أضف كتلة ابدأ/);

    await addBlockToWorkspace(page, 'start');
    const demoAfterInsert = await page.evaluate(() =>
      !document.querySelector('#program-demo')?.hasAttribute('hidden')
    );
    assert.equal(demoAfterInsert, false);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Movement blocks run consecutively and show instruction outcomes', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html?level=level-002&stepDelayMs=120`, { waitUntil: 'networkidle' });

    await addBlockToWorkspace(page, 'moveForward');
    await addBlockToWorkspace(page, 'moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="running"]');
    await page.waitForSelector('#status[data-state="complete"]');

    const finalPosition = await page.evaluate(() => {
      const robot = document.querySelector('#world-grid .robot');
      return {
        row: robot?.getAttribute('data-row') ?? '',
        column: robot?.getAttribute('data-column') ?? ''
      };
    });

    assert.deepEqual(finalPosition, { row: '0', column: '2' });
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
