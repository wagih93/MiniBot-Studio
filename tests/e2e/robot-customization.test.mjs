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

test('Robot customization offers local starter options and keeps movement rules intact', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    const starterSetSnapshot = await page.evaluate(() => ({
      designCount: document.querySelectorAll('#robot-customization [data-robot-design]').length,
      colorCount: document.querySelectorAll('#robot-customization [data-robot-color]').length
    }));
    assert.equal(starterSetSnapshot.designCount, 3);
    assert.equal(starterSetSnapshot.colorCount, 3);

    await page.click('#robot-design-explorer-button');
    await page.waitForSelector('#status[data-state="robotAppearanceUpdated"]');
    await page.click('#robot-color-purple-button');
    await page.waitForSelector('#status[data-state="robotAppearanceUpdated"]');

    const customizedSnapshot = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .cell.robot');
      return {
        hasExplorerDesign: robotCell?.classList.contains('robot-design-explorer') ?? false,
        hasPurpleColor: robotCell?.classList.contains('robot-color-purple') ?? false
      };
    });
    assert.equal(customizedSnapshot.hasExplorerDesign, true);
    assert.equal(customizedSnapshot.hasPurpleColor, true);

    await addBlockToWorkspace(page, 'moveForward');
    await page.click('#play-button');
    await page.waitForFunction(() => {
      const state = document.querySelector('#status')?.getAttribute('data-state');
      return state === 'complete' || state === 'levelComplete';
    });

    const movementSnapshot = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .cell.robot');
      return {
        robotColumn: robotCell?.getAttribute('data-column') ?? '',
        hasExplorerDesign: robotCell?.classList.contains('robot-design-explorer') ?? false,
        hasPurpleColor: robotCell?.classList.contains('robot-color-purple') ?? false
      };
    });

    assert.equal(movementSnapshot.robotColumn, '1');
    assert.equal(movementSnapshot.hasExplorerDesign, true);
    assert.equal(movementSnapshot.hasPurpleColor, true);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Robot customization preferences persist locally across reloads', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    await page.click('#robot-design-turbo-button');
    await page.waitForSelector('#status[data-state="robotAppearanceUpdated"]');
    await page.click('#robot-color-green-button');
    await page.waitForSelector('#status[data-state="robotAppearanceUpdated"]');

    await page.reload({ waitUntil: 'networkidle' });

    const persistedSnapshot = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .cell.robot');
      return {
        storedAppearance: window.localStorage.getItem('minibot.settings.robotAppearance.v1'),
        selectedDesign: document.querySelector('[data-robot-design][data-selected="true"]')?.id ?? '',
        selectedColor: document.querySelector('[data-robot-color][data-selected="true"]')?.id ?? '',
        hasTurboDesign: robotCell?.classList.contains('robot-design-turbo') ?? false,
        hasGreenColor: robotCell?.classList.contains('robot-color-green') ?? false
      };
    });

    assert.notEqual(persistedSnapshot.storedAppearance, null);
    assert.equal(persistedSnapshot.selectedDesign, 'robot-design-turbo-button');
    assert.equal(persistedSnapshot.selectedColor, 'robot-color-green-button');
    assert.equal(persistedSnapshot.hasTurboDesign, true);
    assert.equal(persistedSnapshot.hasGreenColor, true);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Robot color options maintain sufficient contrast against the world', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    const contrastSnapshot = await page.evaluate(() => {
      function parseColor(colorValue) {
        const match = colorValue.match(/rgba?\(([^)]+)\)/);
        if (!match) {
          return { red: 0, green: 0, blue: 0 };
        }
        const channels = match[1].split(',').map((value) => Number.parseFloat(value.trim()));
        return {
          red: channels[0] ?? 0,
          green: channels[1] ?? 0,
          blue: channels[2] ?? 0
        };
      }

      function toLinear(channel) {
        const normalized = channel / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      }

      function luminance(color) {
        return (0.2126 * toLinear(color.red)) + (0.7152 * toLinear(color.green)) + (0.0722 * toLinear(color.blue));
      }

      function contrastRatio(firstColor, secondColor) {
        const firstLuminance = luminance(firstColor);
        const secondLuminance = luminance(secondColor);
        const lighter = Math.max(firstLuminance, secondLuminance);
        const darker = Math.min(firstLuminance, secondLuminance);
        return (lighter + 0.05) / (darker + 0.05);
      }

      const ratios = [];
      for (const button of document.querySelectorAll('[data-robot-color]')) {
        button.click();
        const robotCell = document.querySelector('#world-grid .cell.robot');
        const foreground = parseColor(getComputedStyle(robotCell).color);
        const background = parseColor(getComputedStyle(robotCell).backgroundColor);
        ratios.push(contrastRatio(foreground, background));
      }

      return ratios;
    });

    assert.ok(contrastSnapshot.every((ratio) => ratio >= 4.5));
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
