import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Instruction audio control plays Arabic speech when available', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__spokenUtterances = [];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      writable: true,
      value: class {
        constructor(text) {
          this.text = text;
          this.lang = '';
        }
      }
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      writable: true,
      value: {
        speak(utterance) {
          window.__spokenUtterances.push({ text: utterance.text, lang: utterance.lang });
        },
        cancel() {}
      }
    });
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    const initialSpeakCount = await page.evaluate(() => window.__spokenUtterances.length);
    assert.equal(initialSpeakCount, 0);

    await page.click('#play-instruction-audio-button');
    await page.waitForSelector('#status[data-state="instructionSpoken"]');

    const spokenSnapshot = await page.evaluate(() => window.__spokenUtterances);
    assert.equal(spokenSnapshot.length, 1);
    assert.equal(spokenSnapshot[0].lang, 'ar');
    assert.ok(spokenSnapshot[0].text.length > 0);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Instruction audio does not autoplay during normal interactions', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__spokenUtterances = [];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      writable: true,
      value: class {
        constructor(text) {
          this.text = text;
          this.lang = '';
        }
      }
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      writable: true,
      value: {
        speak(utterance) {
          window.__spokenUtterances.push({ text: utterance.text, lang: utterance.lang });
        },
        cancel() {}
      }
    });
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-003`, { waitUntil: 'networkidle' });
    await page.click('#start-button');
    await page.click('#hint-button');

    const spokenCountAfterInteractions = await page.evaluate(() => window.__spokenUtterances.length);
    assert.equal(spokenCountAfterInteractions, 0);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Instruction audio respects parent mute setting', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem('minibot.settings.soundEffectsEnabled', 'false');
    window.__spokenUtterances = [];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      writable: true,
      value: class {
        constructor(text) {
          this.text = text;
          this.lang = '';
        }
      }
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      writable: true,
      value: {
        speak(utterance) {
          window.__spokenUtterances.push({ text: utterance.text, lang: utterance.lang });
        },
        cancel() {}
      }
    });
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });
    await page.click('#play-instruction-audio-button');
    await page.waitForSelector('#status[data-state="instructionAudioMuted"]');

    const spokenCount = await page.evaluate(() => window.__spokenUtterances.length);
    assert.equal(spokenCount, 0);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Gameplay remains usable when text-to-speech is unavailable', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      writable: true,
      value: undefined
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      writable: true,
      value: undefined
    });
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-001`, { waitUntil: 'networkidle' });
    await page.click('#play-instruction-audio-button');
    await page.waitForSelector('#status[data-state="instructionSpeechUnavailable"]');

    await page.click('#block-moveForward');
    await page.click('#play-button');
    await page.waitForSelector('#status[data-state="levelComplete"]');
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
