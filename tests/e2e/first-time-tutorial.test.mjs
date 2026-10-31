import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('First-use tutorial guides one focused action at a time and can be skipped/replayed', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.removeItem('minibot.tutorial.completed');
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#tutorial-panel:not([hidden])');

    const firstStepSnapshot = await page.evaluate(() => {
      const tutorialPanel = document.querySelector('#tutorial-panel');
      const panelBounds = tutorialPanel?.getBoundingClientRect();
      return {
        stepText: document.querySelector('#tutorial-step-indicator')?.textContent?.trim() ?? '',
        bodyText: document.querySelector('#tutorial-body')?.textContent?.trim() ?? '',
        toolboxFocused: document.querySelector('#block-list')?.getAttribute('data-tutorial-focus') === 'true',
        worldVisible: !(document.querySelector('#robot-world')?.hasAttribute('hidden') ?? true),
        panelCoversMostScreen: (panelBounds?.height ?? 0) > window.innerHeight * 0.8
      };
    });

    assert.match(firstStepSnapshot.stepText, /1/);
    assert.ok(firstStepSnapshot.bodyText.length > 0);
    assert.equal(firstStepSnapshot.toolboxFocused, true);
    assert.equal(firstStepSnapshot.worldVisible, true);
    assert.equal(firstStepSnapshot.panelCoversMostScreen, false);

    await page.click('#tutorial-next-button');
    await page.waitForFunction(() => document.querySelector('#program-workspace')?.getAttribute('data-tutorial-focus') === 'true');

    await page.click('#tutorial-next-button');
    await page.waitForFunction(() => document.querySelector('#play-button')?.getAttribute('data-tutorial-focus') === 'true');

    await page.click('#tutorial-skip-button');
    await page.waitForSelector('#tutorial-panel[hidden]');

    const skippedSnapshot = await page.evaluate(() => ({
      tutorialCompleteFlag: window.localStorage.getItem('minibot.tutorial.completed'),
      playFocused: document.querySelector('#play-button')?.getAttribute('data-tutorial-focus')
    }));
    assert.equal(skippedSnapshot.tutorialCompleteFlag, 'true');
    assert.equal(skippedSnapshot.playFocused, null);

    await page.click('#tutorial-button');
    await page.waitForSelector('#tutorial-panel:not([hidden])');

    const replaySnapshot = await page.evaluate(() => ({
      stepText: document.querySelector('#tutorial-step-indicator')?.textContent?.trim() ?? '',
      toolboxFocused: document.querySelector('#block-list')?.getAttribute('data-tutorial-focus') === 'true'
    }));
    assert.match(replaySnapshot.stepText, /1/);
    assert.equal(replaySnapshot.toolboxFocused, true);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Tutorial text and narration remain Arabic', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.removeItem('minibot.tutorial.completed');
    window.__spokenTutorialUtterances = [];
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
          window.__spokenTutorialUtterances.push({ text: utterance.text, lang: utterance.lang });
        },
        cancel() {}
      }
    });
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#tutorial-panel:not([hidden])');
    await page.click('#tutorial-audio-button');
    await page.waitForSelector('#status[data-state="tutorialSpoken"]');

    const tutorialLanguageSnapshot = await page.evaluate(() => ({
      heading: document.querySelector('#tutorial-heading')?.textContent?.trim() ?? '',
      body: document.querySelector('#tutorial-body')?.textContent?.trim() ?? '',
      spoken: window.__spokenTutorialUtterances
    }));

    assert.match(tutorialLanguageSnapshot.heading, /[\u0600-\u06FF]/);
    assert.match(tutorialLanguageSnapshot.body, /[\u0600-\u06FF]/);
    assert.equal(tutorialLanguageSnapshot.spoken.length, 1);
    assert.equal(tutorialLanguageSnapshot.spoken[0].lang, 'ar');
    assert.match(tutorialLanguageSnapshot.spoken[0].text, /[\u0600-\u06FF]/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
