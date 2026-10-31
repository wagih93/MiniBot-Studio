import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

async function collectCriticalAccessibilityIssues(page) {
  return page.evaluate(() => {
    const { isVisible, readAccessibleName } = (window.getInPageUtilities?.() ?? {
      isVisible: () => false,
      readAccessibleName: () => ''
    });
    const arabicPattern = /[\u0600-\u06FF]/;
    const interactiveElements = Array.from(
      document.querySelectorAll('button, input, [href], [tabindex]:not([tabindex="-1"])')
    ).filter((element) => !element.disabled && isVisible(element));

    const issues = [];
    for (const element of interactiveElements) {
      const elementId = element.id || element.tagName.toLowerCase();
      const accessibleName = readAccessibleName(element);
      if (accessibleName.length === 0) {
        issues.push(`${elementId}:missing-accessible-name`);
        continue;
      }
      if (!arabicPattern.test(accessibleName)) {
        issues.push(`${elementId}:name-not-arabic`);
      }
    }

    return issues;
  });
}

async function assertKeyboardOrderAndFocusVisible(page, expectedIds) {
  const expectedFocusOrder = await page.evaluate((candidateIds) => {
    const { isVisible } = (window.getInPageUtilities?.() ?? { isVisible: () => false });
    return candidateIds.filter((id) => {
      const element = document.getElementById(id);
      return element && !element.disabled && isVisible(element);
    });
  }, expectedIds);

  await page.click('body', { position: { x: 5, y: 5 } });
  const focusVisits = [];
  for (let index = 0; index < 48; index += 1) {
    await page.keyboard.press('Tab');
    const focusState = await page.evaluate(() => {
      const activeElement = document.activeElement;
      if (!activeElement) {
        return null;
      }
      const styles = getComputedStyle(activeElement);
      return {
        id: activeElement.id ?? '',
        focusVisible:
          styles.outlineStyle !== 'none' ||
          styles.outlineWidth !== '0px' ||
          styles.boxShadow !== 'none'
      };
    });
    if (focusState && focusState.id) {
      focusVisits.push(focusState);
    }
  }

  const firstVisitIndex = new Map();
  for (let index = 0; index < focusVisits.length; index += 1) {
    const visit = focusVisits[index];
    if (!firstVisitIndex.has(visit.id)) {
      firstVisitIndex.set(visit.id, index);
    }
  }

  for (const expectedId of expectedFocusOrder) {
    assert.ok(firstVisitIndex.has(expectedId), `Expected keyboard navigation to reach #${expectedId}`);
  }

  let previousVisit = -1;
  for (const expectedId of expectedFocusOrder) {
    const currentVisit = firstVisitIndex.get(expectedId);
    assert.ok(currentVisit > previousVisit, `Expected logical focus order to include #${expectedId} after prior controls`);
    previousVisit = currentVisit;
  }

  const focusVisibilityFailures = focusVisits.filter((visit) => !visit.focusVisible).map((visit) => visit.id);
  assert.deepEqual(focusVisibilityFailures, []);
}

test('Accessibility audit reports no critical issues on home, level, and parent area', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem('minibot.tutorial.completed', 'true');
    window.getInPageUtilities = () => ({
      isVisible(element) {
        if (!element) {
          return false;
        }
        let current = element;
        while (current) {
          if (current.hasAttribute && current.hasAttribute('hidden')) {
            return false;
          }
          const style = getComputedStyle(current);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
          }
          current = current.parentElement;
        }
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      },
      readAccessibleName(element) {
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel && ariaLabel.trim().length > 0) {
          return ariaLabel.trim();
        }

        const labelledBy = element.getAttribute('aria-labelledby');
        if (labelledBy) {
          const labelText = labelledBy
            .split(/\s+/)
            .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
            .filter((text) => text.length > 0)
            .join(' ');
          if (labelText.length > 0) {
            return labelText;
          }
        }

        if (element instanceof HTMLInputElement && element.id) {
          const parentLabel = document.querySelector(`label[for="${element.id}"]`);
          const labelText = parentLabel?.textContent?.trim() ?? '';
          if (labelText.length > 0) {
            return labelText;
          }
        }

        return element.textContent?.trim() ?? '';
      }
    });
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });
    assert.deepEqual(await collectCriticalAccessibilityIssues(page), []);

    await page.click('#start-button');
    await page.waitForSelector('#status[data-state="idle"]');
    assert.deepEqual(await collectCriticalAccessibilityIssues(page), []);

    await page.click('#parents-button');
    await page.waitForSelector('#parent-area:not([hidden])');
    assert.deepEqual(await collectCriticalAccessibilityIssues(page), []);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Keyboard navigation reaches all visible controls in logical order with visible focus', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem('minibot.tutorial.completed', 'true');
    window.getInPageUtilities = () => ({
      isVisible(element) {
        if (!element) {
          return false;
        }
        let current = element;
        while (current) {
          if (current.hasAttribute && current.hasAttribute('hidden')) {
            return false;
          }
          const style = getComputedStyle(current);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
          }
          current = current.parentElement;
        }
        const bounds = element.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0;
      }
    });
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });
    await assertKeyboardOrderAndFocusVisible(page, [
      'start-button',
      'parents-button',
      'tutorial-button'
    ]);

    await page.click('#start-button');
    await page.waitForSelector('#status[data-state="idle"]');
    await assertKeyboardOrderAndFocusVisible(page, [
      'start-button',
      'parents-button',
      'tutorial-button',
      'hint-button',
      'play-instruction-audio-button',
      'save-program-button',
      'play-button',
      'reset-button'
    ]);

    await page.click('#parents-button');
    await page.waitForSelector('#parent-area:not([hidden])');
    await assertKeyboardOrderAndFocusVisible(page, [
      'parents-button',
      'sound-effects-toggle',
      'clear-progress-button',
      'close-parent-area-button'
    ]);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
