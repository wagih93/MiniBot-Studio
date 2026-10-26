import test from 'node:test';
import assert from 'node:assert/strict';
import { createShellView } from '../../../js/features/shell/index.js';

function makeElement(init = {}) {
  return {
    hidden: false, disabled: false, textContent: '', dataset: {},
    _attrs: {},
    setAttribute(name, val) { this._attrs[name] = val; },
    getAttribute(name) { return this._attrs[name] ?? null; },
    addEventListener() {},
    querySelectorAll: () => [],
    ...init
  };
}

// Minimal document stub — replaces global during this test module
const elementMap = {};
function stubQuerySelector(sel) {
  const key = sel.replace(/^#/, '');
  if (!elementMap[key]) elementMap[key] = makeElement();
  return elementMap[key];
}

function makeShellView(overrides = {}) {
  const elements = {
    startButton: makeElement(), continueButton: makeElement(), parentsButton: makeElement(),
    playButton: makeElement(), stopButton: makeElement(), resetButton: makeElement(),
    retryLevelButton: makeElement(), returnHomeButton: makeElement(), saveProgramButton: makeElement(),
    programWorkspaceElement: makeElement(), levelErrorElement: makeElement(), levelErrorMessageElement: makeElement()
  };
  const labels = {
    pageTitle: 'MiniBot Studio',
    heading: 'مختبر الروبوت',
    primaryActions: { start: 'ابدأ', continue: 'واصل', parents: 'للأهل' },
    world: { heading: 'عالم الروبوت' },
    blockArea: { heading: 'الأوامر', programHeading: 'مساحة', firstLevelDemo: 'مثال' },
    controls: { play: 'تشغيل', stop: 'إيقاف', reset: 'إعادة', retryLevel: 'حاول', returnHome: 'رئيسية', saveProgram: 'احفظ' },
    movementGuideHeading: 'الحركة',
    movement: { forward: 'أمام', right: 'يمين', left: 'يسار' }
  };
  const globalStub = {
    title: '',
    querySelector: (sel) => stubQuerySelector(sel)
  };
  // Patch document for the shell view module
  const view = createShellView({
    elements,
    labels,
    readHasSavedProgress: overrides.readHasSavedProgress ?? (() => false),
    onPlay: overrides.onPlay ?? (() => {}),
    onStop: overrides.onStop ?? (() => {}),
    onReset: overrides.onReset ?? (() => {}),
    onStart: overrides.onStart ?? (() => {}),
    onContinue: overrides.onContinue ?? (() => {}),
    onParents: overrides.onParents ?? (() => {}),
    onRetry: overrides.onRetry ?? (() => {}),
    onReturnHome: overrides.onReturnHome ?? (() => {}),
    onSaveProgram: overrides.onSaveProgram ?? (() => {})
  });
  return { view, elements };
}

test('createShellView syncPrimaryActions hides continue when no saved progress', () => {
  const { view, elements } = makeShellView({ readHasSavedProgress: () => false });
  view.syncPrimaryActions(false);
  assert.equal(elements.continueButton.hidden, true);
});

test('createShellView syncPrimaryActions shows continue when saved progress exists', () => {
  const { view, elements } = makeShellView({ readHasSavedProgress: () => true });
  view.syncPrimaryActions(false);
  assert.equal(elements.continueButton.hidden, false);
});

test('createShellView syncPrimaryActions disables all action buttons when running', () => {
  const { view, elements } = makeShellView({ readHasSavedProgress: () => false });
  view.syncPrimaryActions(true);
  assert.equal(elements.startButton.disabled, true);
  assert.equal(elements.parentsButton.disabled, true);
});

test('createShellView setEditingEnabled disables control buttons when false', () => {
  const { view, elements } = makeShellView();
  const programListEl = makeElement({ querySelectorAll: () => [] });
  view.setEditingEnabled(false, programListEl);
  assert.equal(elements.playButton.disabled, true);
  assert.equal(elements.retryLevelButton.disabled, true);
  assert.equal(elements.saveProgramButton.disabled, true);
});

test('createShellView setEditingEnabled sets aria-disabled on workspace', () => {
  const { view, elements } = makeShellView();
  const programListEl = makeElement({ querySelectorAll: () => [] });
  view.setEditingEnabled(false, programListEl);
  assert.equal(elements.programWorkspaceElement._attrs['aria-disabled'], 'true');
  view.setEditingEnabled(true, programListEl);
  assert.equal(elements.programWorkspaceElement._attrs['aria-disabled'], 'false');
});

test('createShellView showLevelError and hideLevelError toggle visibility', () => {
  const { view, elements } = makeShellView();
  view.showLevelError('رسالة خطأ');
  assert.equal(elements.levelErrorElement.hidden, false);
  assert.equal(elements.levelErrorMessageElement.textContent, 'رسالة خطأ');
  view.hideLevelError();
  assert.equal(elements.levelErrorElement.hidden, true);
  assert.equal(elements.levelErrorMessageElement.textContent, '');
});
