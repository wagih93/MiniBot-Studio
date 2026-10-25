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

test('Turning blocks are available, rotate by 90 degrees, and combine with movement', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-001`, { waitUntil: 'networkidle' });

    const toolboxBlockIds = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#block-list .block-item')).map((item) => item.id)
    );
    assert.ok(toolboxBlockIds.includes('block-turnLeft'));
    assert.ok(toolboxBlockIds.includes('block-turnRight'));

    await addBlockToWorkspace(page, 'turnLeft');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="complete"]');

    const turnLeftSnapshot = await page.evaluate(() => {
      const robot = document.querySelector('#world-grid .robot');
      return {
        row: robot?.getAttribute('data-row') ?? '',
        column: robot?.getAttribute('data-column') ?? '',
        direction: robot?.getAttribute('data-direction') ?? '',
        text: robot?.textContent?.trim() ?? ''
      };
    });
    assert.deepEqual(
      { row: turnLeftSnapshot.row, column: turnLeftSnapshot.column, direction: turnLeftSnapshot.direction },
      { row: '0', column: '0', direction: 'north' }
    );
    assert.match(turnLeftSnapshot.text, /↑/);

    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-001&stepDelayMs=120`, { waitUntil: 'networkidle' });
    await addBlockToWorkspace(page, 'turnRight');
    await addBlockToWorkspace(page, 'turnRight');
    await addBlockToWorkspace(page, 'turnRight');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="complete"]');

    const repeatedTurnsSnapshot = await page.evaluate(() => {
      const robot = document.querySelector('#world-grid .robot');
      return {
        row: robot?.getAttribute('data-row') ?? '',
        column: robot?.getAttribute('data-column') ?? '',
        direction: robot?.getAttribute('data-direction') ?? '',
        text: robot?.textContent?.trim() ?? ''
      };
    });
    assert.deepEqual(
      {
        row: repeatedTurnsSnapshot.row,
        column: repeatedTurnsSnapshot.column,
        direction: repeatedTurnsSnapshot.direction
      },
      { row: '0', column: '0', direction: 'north' }
    );
    assert.match(repeatedTurnsSnapshot.text, /↑/);

    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-001&stepDelayMs=120`, { waitUntil: 'networkidle' });
    await addBlockToWorkspace(page, 'turnRight');
    await addBlockToWorkspace(page, 'moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="complete"]');

    const mixedSnapshot = await page.evaluate(() => {
      const robot = document.querySelector('#world-grid .robot');
      return {
        row: robot?.getAttribute('data-row') ?? '',
        column: robot?.getAttribute('data-column') ?? '',
        direction: robot?.getAttribute('data-direction') ?? '',
        text: robot?.textContent?.trim() ?? ''
      };
    });
    assert.deepEqual(
      { row: mixedSnapshot.row, column: mixedSnapshot.column, direction: mixedSnapshot.direction },
      { row: '1', column: '0', direction: 'south' }
    );
    assert.match(mixedSnapshot.text, /↓/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

