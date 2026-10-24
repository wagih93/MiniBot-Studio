import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { closeServer, createStaticServer, listenOnRandomPort } from './helpers/static-server.mjs';

test('Dragging toolbox blocks inserts them into the program workspace with visible insertion feedback', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });

    const previewCount = await page.evaluate(() => {
      const workspace = document.querySelector('#program-workspace');
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', 'moveForward');
      const bounds = workspace.getBoundingClientRect();
      const dragOver = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientY: bounds.top + 4
      });
      workspace.dispatchEvent(dragOver);
      return document.querySelectorAll('#program-list .program-placeholder').length;
    });

    assert.equal(previewCount, 1);

    await page.evaluate((blockType) => {
      const source = document.querySelector(`#block-${blockType}`);
      const workspace = document.querySelector('#program-workspace');
      const dataTransfer = new DataTransfer();

      const start = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      source.dispatchEvent(start);

      const bounds = workspace.getBoundingClientRect();
      const dragOver = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientY: bounds.bottom - 2
      });
      workspace.dispatchEvent(dragOver);

      const drop = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientY: bounds.bottom - 2
      });
      workspace.dispatchEvent(drop);

      source.dispatchEvent(
        new DragEvent('dragend', {
          bubbles: true,
          cancelable: true,
          dataTransfer
        })
      );
    }, 'moveForward');
    await page.evaluate((blockType) => {
      const source = document.querySelector(`#block-${blockType}`);
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
      source.dispatchEvent(
        new DragEvent('dragend', {
          bubbles: true,
          cancelable: true,
          dataTransfer
        })
      );
    }, 'turnRight');

    await page.evaluate(() => {
      const workspace = document.querySelector('#program-workspace');
      const firstStep = document.querySelector('#program-list .program-step');
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', 'turnLeft');
      const topY = firstStep.getBoundingClientRect().top + 1;

      const dragOver = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientY: topY
      });
      workspace.dispatchEvent(dragOver);

      const drop = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
        clientY: topY
      });
      workspace.dispatchEvent(drop);
    });

    const workspaceSnapshot = await page.evaluate(() => ({
      labels: Array.from(document.querySelectorAll('#program-list .program-step__label')).map((item) =>
        item.textContent?.trim()
      ),
      status: document.querySelector('#status')?.textContent?.trim() ?? ''
    }));

    assert.deepEqual(workspaceSnapshot.labels, ['انعطف يساراً', 'تقدّم خطوة', 'انعطف يميناً']);
    assert.match(workspaceSnapshot.status, /إضافة الأمر/);
  } finally {
    await context.close();
    await browser.close();
    await closeServer(server);
  }
});

test('Invalid drops are rejected and touch input can add blocks to the workspace', async () => {
  const server = createStaticServer();
  const port = await listenOnRandomPort(server);
  const origin = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch();
  const mouseContext = await browser.newContext();
  const mousePage = await mouseContext.newPage();

  try {
    await mousePage.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });

    const invalidDropStatus = await mousePage.evaluate(() => {
      const workspace = document.querySelector('#program-workspace');
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', 'unknownBlock');
      const drop = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer
      });
      workspace.dispatchEvent(drop);
      return document.querySelector('#status')?.textContent?.trim() ?? '';
    });

    assert.match(invalidDropStatus, /لا يمكن إضافة هذا الأمر/);
  } finally {
    await mouseContext.close();
  }

  const touchContext = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 768, height: 1024 }
  });
  const touchPage = await touchContext.newPage();

  try {
    await touchPage.goto(`${origin}/index.html`, { waitUntil: 'networkidle' });
    await touchPage.tap('#block-turnRight');

    const touchSnapshot = await touchPage.evaluate(() => ({
      labels: Array.from(document.querySelectorAll('#program-list .program-step__label')).map((item) =>
        item.textContent?.trim()
      )
    }));

    assert.deepEqual(touchSnapshot.labels, ['انعطف يميناً']);
  } finally {
    await touchContext.close();
    await browser.close();
    await closeServer(server);
  }
});
