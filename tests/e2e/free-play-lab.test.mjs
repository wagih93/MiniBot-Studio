import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Free-play lab supports safe setup, run/reset, and does not persist story progress', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    await page.click('#lab-button');
    await page.waitForSelector('#status[data-state="labOpened"]');
    await page.waitForSelector('#lab-controls:not([hidden])');

    await page.click('#lab-mode-obstacle-button');
    await page.waitForSelector('#status[data-state="labModeObstacle"]');
    await page.click('#world-grid .cell[data-row="1"][data-column="0"]');

    const obstacleAdded = await page.evaluate(() => {
      const cell = document.querySelector('#world-grid .cell[data-row="1"][data-column="0"]');
      return cell?.classList.contains('wall') ?? false;
    });
    assert.equal(obstacleAdded, true);

    await page.click('#lab-mode-robot-button');
    await page.waitForSelector('#status[data-state="labModeRobot"]');
    await page.click('#world-grid .cell[data-row="2"][data-column="2"]');
    await page.waitForSelector('#status[data-state="labEditApplied"]');

    await page.click('#lab-mode-obstacle-button');
    await page.waitForSelector('#status[data-state="labModeObstacle"]');
    await page.click('#world-grid .cell[data-row="2"][data-column="2"]');
    await page.waitForSelector('#status[data-state="labEditInvalid"]');

    const safePlacementSnapshot = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .cell.robot');
      const blockedRobotCell = document.querySelector('#world-grid .cell[data-row="2"][data-column="2"]')?.classList.contains('wall') ?? false;
      return {
        robotRow: robotCell?.getAttribute('data-row') ?? '',
        robotColumn: robotCell?.getAttribute('data-column') ?? '',
        blockedRobotCell
      };
    });
    assert.equal(safePlacementSnapshot.robotRow, '2');
    assert.equal(safePlacementSnapshot.robotColumn, '2');
    assert.equal(safePlacementSnapshot.blockedRobotCell, false);

    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="running"]');
    await page.waitForSelector('#status[data-state="complete"], #status[data-state="blocked"]');

    await page.click('#reset-button');
    await page.waitForSelector('#status[data-state="reset"]');

    const resetSnapshot = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .cell.robot');
      return {
        robotRow: robotCell?.getAttribute('data-row') ?? '',
        robotColumn: robotCell?.getAttribute('data-column') ?? '',
        savedLevelId: window.localStorage.getItem('minibot.progress.levelId'),
        completedLevelIds: window.localStorage.getItem('minibot.progress.completedLevelIds.v1')
      };
    });

    assert.equal(resetSnapshot.robotRow, '2');
    assert.equal(resetSnapshot.robotColumn, '2');
    assert.equal(resetSnapshot.savedLevelId, null);
    assert.equal(resetSnapshot.completedLevelIds, null);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
