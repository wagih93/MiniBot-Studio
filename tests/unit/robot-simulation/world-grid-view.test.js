import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorldGridView } from '../../../js/features/robot-simulation/index.js';

// Minimal DOM stub — no JSDOM needed
function makeElement(init = {}) {
  const classes = new Set();
  const el = {
    dataset: {}, style: {}, hidden: false, textContent: '', children: [],
    disabled: false,
    classList: {
      add(...cs) { for (const c of cs) classes.add(c); },
      contains: (c) => classes.has(c)
    },
    get _classes() { return classes; },
    replaceChildren(...nodes) { el.children = [...nodes]; },
    setAttribute(name, val) { (el.attrs = el.attrs || {})[name] = val; },
    getAttribute(name) { return (el.attrs || {})[name] ?? null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    append(...nodes) { el.children.push(...nodes); },
    ...init
  };
  return el;
}
globalThis.document = { createElement: () => makeElement() };

const simpleLevel = {
  id: 'test', grid: { rows: 2, columns: 2 },
  robot: { row: 0, column: 0, direction: 'east' },
  collectibles: [{ row: 1, column: 1, type: 'star' }],
  obstacles: [{ row: 0, column: 1 }],
  successConditions: {}, hints: []
};
const robotState = { row: 0, column: 0, direction: 'east' };
const objectiveProgress = { collectedKeys: new Set(), totalCollectibles: 1 };

test('createWorldGridView renders correct number of cells', () => {
  const worldGridElement = makeElement();
  const isCollectibleCollected = () => false;
  const view = createWorldGridView({ worldGridElement, isCollectibleCollected });
  view.render(simpleLevel, robotState, objectiveProgress);
  assert.equal(worldGridElement.children.length, 4); // 2x2 grid
});

test('createWorldGridView marks robot cell with robot class', () => {
  const worldGridElement = makeElement();
  const isCollectibleCollected = () => false;
  const view = createWorldGridView({ worldGridElement, isCollectibleCollected });
  view.render(simpleLevel, robotState, objectiveProgress);
  const robotCell = worldGridElement.children.find((c) => c._classes.has('robot'));
  assert.ok(robotCell, 'robot cell should exist');
  assert.equal(robotCell.dataset.direction, 'east');
});

test('createWorldGridView shows a lit robot state when light is on', () => {
  const worldGridElement = makeElement();
  const isCollectibleCollected = () => false;
  const view = createWorldGridView({ worldGridElement, isCollectibleCollected });
  view.render(simpleLevel, { ...robotState, lightOn: true }, objectiveProgress);
  const robotCell = worldGridElement.children.find((c) => c._classes.has('robot'));
  assert.ok(robotCell?._classes.has('robot-light-on'));
});

test('createWorldGridView marks obstacle cell with wall class', () => {
  const worldGridElement = makeElement();
  const isCollectibleCollected = () => false;
  const view = createWorldGridView({ worldGridElement, isCollectibleCollected });
  view.render(simpleLevel, robotState, objectiveProgress);
  const wallCell = worldGridElement.children.find((c) => c._classes.has('wall'));
  assert.ok(wallCell, 'wall cell should exist');
});

test('createWorldGridView marks uncollected collectible with target class', () => {
  const worldGridElement = makeElement();
  const isCollectibleCollected = () => false;
  const view = createWorldGridView({ worldGridElement, isCollectibleCollected });
  view.render(simpleLevel, robotState, objectiveProgress);
  const targetCell = worldGridElement.children.find((c) => c._classes.has('target'));
  assert.ok(targetCell, 'target cell should exist');
});

test('createWorldGridView marks collected collectible with target-collected class', () => {
  const worldGridElement = makeElement();
  const isCollectibleCollected = () => true;
  const view = createWorldGridView({ worldGridElement, isCollectibleCollected });
  view.render(simpleLevel, robotState, objectiveProgress);
  const collectedCell = worldGridElement.children.find((c) => c._classes.has('target-collected'));
  assert.ok(collectedCell, 'collected target cell should exist');
});

test('createWorldGridView sets grid-template-columns style', () => {
  const worldGridElement = makeElement();
  const view = createWorldGridView({ worldGridElement, isCollectibleCollected: () => false });
  view.render(simpleLevel, robotState, objectiveProgress);
  assert.ok(worldGridElement.style.gridTemplateColumns.includes('repeat(2'));
});
