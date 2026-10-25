import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Grid world renders from level data with consistent and bounded cells', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    const defaultMetrics = await page.evaluate(() => {
      const grid = document.querySelector('#world-grid');
      const panel = document.querySelector('#robot-world');
      const cells = Array.from(document.querySelectorAll('#world-grid .cell'));
      const firstCell = cells[0]?.getBoundingClientRect();

      return {
        cellCount: cells.length,
        robotCount: document.querySelectorAll('#world-grid .robot').length,
        targetCount: document.querySelectorAll('#world-grid .target').length,
        wallCount: document.querySelectorAll('#world-grid .wall').length,
        outsideWorldElements: Array.from(document.querySelectorAll('.robot, .target, .wall')).filter(
          (element) => !document.querySelector('#world-grid')?.contains(element)
        ).length,
        allCellsSquare: cells.every((cell) => {
          const rect = cell.getBoundingClientRect();
          return Math.abs(rect.width - rect.height) <= 1;
        }),
        gridFitsPanel:
          grid.getBoundingClientRect().width <= panel.getBoundingClientRect().width &&
          grid.getBoundingClientRect().height <= panel.getBoundingClientRect().height,
        firstCellWidth: firstCell?.width ?? 0,
        firstCellHeight: firstCell?.height ?? 0
      };
    });

    assert.equal(defaultMetrics.cellCount, 16);
    assert.equal(defaultMetrics.robotCount, 1);
    assert.equal(defaultMetrics.targetCount, 1);
    assert.ok(defaultMetrics.wallCount >= 1);
    assert.equal(defaultMetrics.outsideWorldElements, 0);
    assert.equal(defaultMetrics.allCellsSquare, true);
    assert.equal(defaultMetrics.gridFitsPanel, true);
    assert.ok(defaultMetrics.firstCellWidth > 0);
    assert.ok(defaultMetrics.firstCellHeight > 0);

    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-002`, { waitUntil: 'networkidle' });
    const secondLevelCellCount = await page.locator('#world-grid .cell').count();
    assert.equal(secondLevelCellCount, 25);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

