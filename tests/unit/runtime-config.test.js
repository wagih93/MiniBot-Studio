import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production runtime does not read URL parameters for behavior', async () => {
  const robotLabSource = await readFile('js/robot-lab.js', 'utf8');
  const appSource = await readFile('js/app.js', 'utf8');

  assert.equal(appSource.includes('window.location.search'), false);
  assert.equal(robotLabSource.includes('window.location.search'), false);
  assert.equal(robotLabSource.includes("searchParams.get('maxSteps')"), false);
  assert.equal(robotLabSource.includes("searchParams.get('repeat')"), false);
  assert.equal(robotLabSource.includes("searchParams.get('stepDelayMs')"), false);
});

test('production entry sources exclude former query-parameter hooks', async () => {
  const appSource = await readFile('js/app.js', 'utf8');
  const robotLabSource = await readFile('js/robot-lab.js', 'utf8');
  const combinedSource = `${appSource}\n${robotLabSource}`;

  assert.equal(combinedSource.includes('maxSteps='), false);
  assert.equal(combinedSource.includes('repeat='), false);
  assert.equal(combinedSource.includes('stepDelayMs='), false);
});
