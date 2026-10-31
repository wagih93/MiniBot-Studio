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

function getAudioStubScript() {
  return () => {
    window.__audioFrequencies = [];

    class FakeOscillator {
      constructor() {
        this.onended = null;
        this._frequency = 0;
        this.frequency = {
          setValueAtTime: (value) => {
            this._frequency = value;
          }
        };
      }

      connect() {}

      start() {
        window.__audioFrequencies.push(this._frequency);
      }

      stop() {
        if (typeof this.onended === 'function') {
          this.onended();
        }
      }
    }

    class FakeGainNode {
      constructor() {
        this.gain = {
          setValueAtTime() {},
          exponentialRampToValueAtTime() {}
        };
      }

      connect() {}
    }

    class FakeAudioContext {
      constructor() {
        this.currentTime = 0;
        this.destination = {};
      }

      createOscillator() {
        return new FakeOscillator();
      }

      createGain() {
        return new FakeGainNode();
      }

      close() {
        return Promise.resolve();
      }
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: FakeAudioContext
    });
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      writable: true,
      value: undefined
    });
  };
}

test('Light block visibly changes and preserves robot light state until reset', async () => {
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
    await page.waitForSelector('#block-lightOn');

    await addBlockToWorkspace(page, 'lightOn');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="lightOn"]');
    await page.waitForSelector('#status[data-state="complete"]');

    const litStateSnapshot = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .cell.robot');
      return {
        hasLitClass: robotCell?.classList.contains('robot-light-on') ?? false,
        robotLabel: robotCell?.textContent?.trim() ?? ''
      };
    });

    assert.equal(litStateSnapshot.hasLitClass, true);
    assert.match(litStateSnapshot.robotLabel, /💡/);

    await page.click('#reset-button');
    await page.waitForSelector('#status[data-state="reset"]');

    const resetSnapshot = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .cell.robot');
      return robotCell?.classList.contains('robot-light-on') ?? true;
    });
    assert.equal(resetSnapshot, false);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Sound block plays local sound and does not break sequencing', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(getAudioStubScript());
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?stepDelayMs=90`, { waitUntil: 'networkidle' });
    await page.click('#lab-button');
    await page.waitForSelector('#status[data-state="labOpened"]');
    await page.waitForSelector('#block-playSound');

    await addBlockToWorkspace(page, 'playSound');
    await addBlockToWorkspace(page, 'moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="soundPlayed"]');
    await page.waitForFunction(() => {
      const state = document.querySelector('#status')?.getAttribute('data-state');
      return state === 'complete' || state === 'levelComplete';
    });

    const soundSnapshot = await page.evaluate(() => {
      const robotCell = document.querySelector('#world-grid .cell.robot');
      return {
        frequencies: window.__audioFrequencies ?? [],
        robotColumn: robotCell?.getAttribute('data-column') ?? ''
      };
    });

    assert.ok(soundSnapshot.frequencies.includes(640));
    assert.equal(soundSnapshot.robotColumn, '1');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Muted sound block still provides clear visual feedback', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem('minibot.settings.soundEffectsEnabled', 'false');
  });
  await context.addInitScript(getAudioStubScript());
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?stepDelayMs=120`, { waitUntil: 'networkidle' });
    await page.click('#lab-button');
    await page.waitForSelector('#status[data-state="labOpened"]');

    await addBlockToWorkspace(page, 'playSound');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="soundMuted"]');

    const mutedSnapshot = await page.evaluate(() => ({
      frequencies: window.__audioFrequencies ?? []
    }));
    assert.equal(mutedSnapshot.frequencies.length, 0);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
