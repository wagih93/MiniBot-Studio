import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Child-facing controls meet target size and contrast requirements', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.localStorage.setItem('minibot.tutorial.completed', 'true');
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    const accessibilitySnapshot = await page.evaluate(() => {
      const touchSelectors = [
        '#start-button',
        '#play-button',
        '#stop-button',
        '#reset-button',
        '#block-moveForward',
        '#hint-button',
        '#save-program-button'
      ];
      const textContrastSelectors = [
        '#start-button',
        '#play-button',
        '#level-indicator',
        '#status',
        '#hint-button'
      ];
      const graphicsContrastSelectors = ['.direction-icon', '#block-moveForward .block-item__icon'];

      function parseColor(colorValue) {
        const match = colorValue.match(/rgba?\(([^)]+)\)/);
        if (!match) {
          return { red: 0, green: 0, blue: 0, alpha: 1 };
        }

        const channels = match[1].split(',').map((channel) => Number.parseFloat(channel.trim()));
        return {
          red: channels[0] ?? 0,
          green: channels[1] ?? 0,
          blue: channels[2] ?? 0,
          alpha: channels[3] ?? 1
        };
      }

      function toLinear(channel) {
        const normalized = channel / 255;
        if (normalized <= 0.03928) {
          return normalized / 12.92;
        }
        return ((normalized + 0.055) / 1.055) ** 2.4;
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

      function resolveBackgroundColor(element) {
        let currentElement = element;
        while (currentElement) {
          const background = parseColor(getComputedStyle(currentElement).backgroundColor);
          if (background.alpha > 0) {
            return background;
          }
          currentElement = currentElement.parentElement;
        }

        return { red: 255, green: 255, blue: 255, alpha: 1 };
      }

      const touchFailures = [];
      for (const selector of touchSelectors) {
        const element = document.querySelector(selector);
        if (!element) {
          touchFailures.push(`${selector}:missing`);
          continue;
        }
        const bounds = element.getBoundingClientRect();
        if (bounds.width < 64 || bounds.height < 64) {
          touchFailures.push(`${selector}:${Math.round(bounds.width)}x${Math.round(bounds.height)}`);
        }
      }

      const textContrastFailures = [];
      for (const selector of textContrastSelectors) {
        const element = document.querySelector(selector);
        if (!element) {
          textContrastFailures.push(`${selector}:missing`);
          continue;
        }
        const foregroundColor = parseColor(getComputedStyle(element).color);
        const backgroundColor = resolveBackgroundColor(element);
        const ratio = contrastRatio(foregroundColor, backgroundColor);
        if (ratio < 4.5) {
          textContrastFailures.push(`${selector}:${ratio.toFixed(2)}`);
        }
      }

      const graphicsContrastFailures = [];
      for (const selector of graphicsContrastSelectors) {
        const element = document.querySelector(selector);
        if (!element) {
          graphicsContrastFailures.push(`${selector}:missing`);
          continue;
        }
        const borderColor = parseColor(getComputedStyle(element).borderColor);
        const backgroundColor = resolveBackgroundColor(element);
        const ratio = contrastRatio(borderColor, backgroundColor);
        if (ratio < 3) {
          graphicsContrastFailures.push(`${selector}:${ratio.toFixed(2)}`);
        }
      }

      return {
        touchFailures,
        textContrastFailures,
        graphicsContrastFailures
      };
    });

    assert.deepEqual(accessibilitySnapshot.touchFailures, []);
    assert.deepEqual(accessibilitySnapshot.textContrastFailures, []);
    assert.deepEqual(accessibilitySnapshot.graphicsContrastFailures, []);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Reduced motion preference suppresses animation duration', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext({
    reducedMotion: 'reduce'
  });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/tests/e2e/test-entry.html`, { waitUntil: 'networkidle' });

    const reducedMotionSnapshot = await page.evaluate(() => {
      function durationToMilliseconds(durationValue) {
        const firstDuration = durationValue.split(',')[0].trim();
        if (firstDuration.endsWith('ms')) {
          return Number.parseFloat(firstDuration);
        }
        if (firstDuration.endsWith('s')) {
          return Number.parseFloat(firstDuration) * 1000;
        }
        return Number.NaN;
      }

      const robotCell = document.querySelector('.cell.robot');
      robotCell?.classList.add('moving-east');
      const targetCell = document.querySelector('.cell.target');
      targetCell?.classList.add('target-collected');
      const completionIcon = document.querySelector('.level-completion__icon');

      const durations = [
        durationToMilliseconds(getComputedStyle(robotCell).animationDuration),
        durationToMilliseconds(getComputedStyle(targetCell).animationDuration),
        durationToMilliseconds(getComputedStyle(completionIcon).animationDuration)
      ];

      return {
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        durations
      };
    });

    assert.equal(reducedMotionSnapshot.prefersReducedMotion, true);
    assert.ok(reducedMotionSnapshot.durations.every((duration) => Number.isFinite(duration) && duration <= 1));
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});
