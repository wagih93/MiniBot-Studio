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

test('Hint control is available and progressive hints do not change program state', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-001`, { waitUntil: 'networkidle' });

    await addBlockToWorkspace(page, 'moveForward');

    const beforeHint = await page.evaluate(() => ({
      hintText: document.querySelector('#level-hint')?.textContent?.trim() ?? '',
      collectionSummary: document.querySelector('#collection-summary')?.textContent?.trim() ?? '',
      programLabels: Array.from(document.querySelectorAll('#program-list .program-step__label')).map((item) =>
        item.textContent?.trim()
      ),
      hintButtonHidden: document.querySelector('#hint-button')?.hasAttribute('hidden') ?? true
    }));

    assert.equal(beforeHint.hintButtonHidden, false);

    await page.click('#hint-button');
    await page.waitForSelector('#status[data-state="hintShown"]');

    const afterHint = await page.evaluate(() => ({
      hintText: document.querySelector('#level-hint')?.textContent?.trim() ?? '',
      collectionSummary: document.querySelector('#collection-summary')?.textContent?.trim() ?? '',
      programLabels: Array.from(document.querySelectorAll('#program-list .program-step__label')).map((item) =>
        item.textContent?.trim()
      )
    }));

    assert.notEqual(afterHint.hintText, beforeHint.hintText);
    assert.deepEqual(afterHint.programLabels, beforeHint.programLabels);
    assert.equal(afterHint.collectionSummary, beforeHint.collectionSummary);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Hints can be spoken when sound is enabled', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();

  await context.addInitScript(() => {
    window.__spokenHints = [];
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
        cancel() {},
        speak(utterance) {
          window.__spokenHints.push({
            text: utterance.text,
            lang: utterance.lang
          });
        }
      }
    });
  });

  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html?level=level-001&hintSpeech=1`, {
      waitUntil: 'networkidle'
    });

    await page.click('#hint-button');
    await page.waitForSelector('#status[data-state="hintSpoken"]');

    const spokenHints = await page.evaluate(() => window.__spokenHints ?? []);
    assert.equal(spokenHints.length, 1);
    assert.equal(spokenHints[0].lang, 'ar');
    assert.match(spokenHints[0].text, /أضف أمر "تقدّم خطوة" مرة واحدة/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
