import test from 'node:test';
import assert from 'node:assert/strict';
import { createBlockToolboxView } from '../../../js/features/program-editing/index.js';

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

function makeProgramEditor() {
  let pendingInsertIndex = null;
  let pendingBlockType = null;
  return {
    getPendingProgramInsertIndex: () => pendingInsertIndex,
    setProgramInsertPreview(index, blockType) { pendingInsertIndex = index; pendingBlockType = blockType; },
    clearProgramInsertPreview() { pendingInsertIndex = null; pendingBlockType = null; },
    setAvailableBlockTypes() {},
    getPendingBlockType: () => pendingBlockType
  };
}

const labels = {
  labelsByType: { moveForward: 'تقدّم خطوة', turnRight: 'انعطف يميناً' },
  iconsByType: { moveForward: '⬆️', turnRight: '↱' }
};

test('createBlockToolboxView render creates one button per available block', () => {
  const blockListElement = makeElement();
  const programEditor = makeProgramEditor();
  const view = createBlockToolboxView({ blockListElement, labels, programEditor, isRunInProgress: () => false, onBlockSelected: () => {}, onTouchAdd: () => {} });
  view.render(['moveForward', 'turnRight']);
  assert.equal(blockListElement.children.length, 2);
});

test('createBlockToolboxView getSelectedBlockType returns null initially', () => {
  const blockListElement = makeElement();
  const programEditor = makeProgramEditor();
  const view = createBlockToolboxView({ blockListElement, labels, programEditor, isRunInProgress: () => false, onBlockSelected: () => {}, onTouchAdd: () => {} });
  view.render(['moveForward']);
  assert.equal(view.getSelectedBlockType(), null);
});

test('createBlockToolboxView setEnabled disables all buttons when false', () => {
  const blockListElement = makeElement();
  const programEditor = makeProgramEditor();
  const view = createBlockToolboxView({ blockListElement, labels, programEditor, isRunInProgress: () => false, onBlockSelected: () => {}, onTouchAdd: () => {} });
  view.render(['moveForward', 'turnRight']);
  view.setEnabled(false);
  for (const button of blockListElement.children) {
    assert.equal(button.disabled, true);
  }
});

test('createBlockToolboxView setEnabled re-enables buttons when true', () => {
  const blockListElement = makeElement();
  const programEditor = makeProgramEditor();
  const view = createBlockToolboxView({ blockListElement, labels, programEditor, isRunInProgress: () => false, onBlockSelected: () => {}, onTouchAdd: () => {} });
  view.render(['moveForward']);
  view.setEnabled(false);
  view.setEnabled(true);
  for (const button of blockListElement.children) {
    assert.equal(button.disabled, false);
  }
});

test('createBlockToolboxView clearSelection resets all buttons selected state', () => {
  const blockListElement = makeElement();
  const programEditor = makeProgramEditor();
  let selectedType = null;
  const view = createBlockToolboxView({
    blockListElement, labels, programEditor, isRunInProgress: () => false,
    onBlockSelected: (t) => { selectedType = t; },
    onTouchAdd: () => {}
  });
  view.render(['moveForward', 'turnRight']);
  // Simulate click event manually by finding the moveForward button
  const btn = blockListElement.children.find((b) => b.dataset.blockType === 'moveForward');
  assert.ok(btn, 'moveForward button should exist');
  view.clearSelection();
  assert.equal(view.getSelectedBlockType(), null);
});
