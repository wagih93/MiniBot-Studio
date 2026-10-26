import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

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

test('Sound effects are available for movement, collection, and success', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(getAudioStubScript());
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-001`, { waitUntil: 'networkidle' });
    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="levelComplete"]');

    const soundFrequencies = await page.evaluate(() => window.__audioFrequencies ?? []);
    assert.ok(soundFrequencies.includes(420));
    assert.ok(soundFrequencies.includes(560));
    assert.ok(soundFrequencies.includes(720));
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Sound effects respect mute while visual feedback stays available', async () => {
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
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-001`, { waitUntil: 'networkidle' });
    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="levelComplete"]');

    const mutedSnapshot = await page.evaluate(() => ({
      soundsPlayed: (window.__audioFrequencies ?? []).length,
      completionVisible: !(document.querySelector('#level-completion')?.hasAttribute('hidden') ?? true)
    }));
    assert.equal(mutedSnapshot.soundsPlayed, 0);
    assert.equal(mutedSnapshot.completionVisible, true);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Rapid robot actions throttle sound effects to avoid overlap', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(getAudioStubScript());
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-005&repeat=10&stepDelayMs=0&maxSteps=20`, {
      waitUntil: 'networkidle'
    });
    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForFunction(() => {
      const state = document.querySelector('#status')?.getAttribute('data-state') ?? '';
      return ['blocked', 'complete', 'levelComplete', 'stepLimitExceeded'].includes(state);
    });

    const movementSoundCount = await page.evaluate(() =>
      (window.__audioFrequencies ?? []).filter((frequency) => frequency === 420).length
    );
    assert.ok(movementSoundCount <= 2);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
