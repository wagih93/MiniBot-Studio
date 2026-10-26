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
    playButton: makeElement(), stopButton: makeElement(), resetButton: makeElement(), nextLevelButton: makeElement({ hidden: true }),
    retryLevelButton: makeElement(), returnHomeButton: makeElement(), saveProgramButton: makeElement(), hintButton: makeElement(),
    parentAreaElement: makeElement({ hidden: true }), parentProgressSummaryElement: makeElement(), parentConceptListElement: makeElement({
      textContent: '',
      _items: [],
      append(item) { this._items.push(item); }
    }), clearProgressButton: makeElement(), closeParentAreaButton: makeElement(),
    programWorkspaceElement: makeElement(), levelErrorElement: makeElement(), levelErrorMessageElement: makeElement(),
    levelCompletionElement: makeElement({ hidden: true }), levelCompletionMessageElement: makeElement()
  };
  const labels = {
    pageTitle: 'MiniBot Studio',
    heading: 'مختبر الروبوت',
    primaryActions: { start: 'ابدأ', continue: 'واصل', parents: 'للأهل' },
    parentArea: {
      heading: 'منطقة الأهل',
      description: 'إدارة التقدم',
      clearProgressConfirm: 'تأكيد',
      completedLevelsTemplate: 'المستويات المكتملة: {count}',
      conceptCountTemplate: '{concept}: جُرّب في {count} مستوى.',
      learningConceptLabels: {
        sequencing: 'التسلسل',
        directions: 'الاتجاهات',
        repetition: 'التكرار'
      }
    },
    world: { heading: 'عالم الروبوت' },
    blockArea: { heading: 'الأوامر', programHeading: 'مساحة', firstLevelDemo: 'مثال' },
    controls: { play: 'تشغيل', stop: 'إيقاف', reset: 'إعادة', hint: 'تلميح', nextLevel: 'التالي', retryLevel: 'حاول', returnHome: 'رئيسية', saveProgram: 'احفظ', clearProgress: 'امسح', closeParentArea: 'إغلاق' },
    levelCompletion: { message: 'ممتاز', finalLevelMessage: 'أكملت الجميع' },
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
    onCloseParentsArea: overrides.onCloseParentsArea ?? (() => {}),
    onClearProgress: overrides.onClearProgress ?? (() => {}),
    onHint: overrides.onHint ?? (() => {}),
    onRetry: overrides.onRetry ?? (() => {}),
    onReturnHome: overrides.onReturnHome ?? (() => {}),
    onSaveProgram: overrides.onSaveProgram ?? (() => {}),
    onNextLevel: overrides.onNextLevel ?? (() => {})
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

test('createShellView showLevelCompletion shows celebration and next-level action', () => {
  const { view, elements } = makeShellView();
  view.showLevelCompletion(true);
  assert.equal(elements.levelCompletionElement.hidden, false);
  assert.equal(elements.nextLevelButton.hidden, false);
  assert.equal(elements.nextLevelButton.disabled, false);
  assert.equal(elements.levelCompletionMessageElement.textContent, 'ممتاز');
});

test('createShellView showLevelCompletion hides next-level action on final level', () => {
  const { view, elements } = makeShellView();
  view.showLevelCompletion(false);
  assert.equal(elements.levelCompletionElement.hidden, false);
  assert.equal(elements.nextLevelButton.hidden, true);
  assert.equal(elements.nextLevelButton.disabled, true);
  assert.equal(elements.levelCompletionMessageElement.textContent, 'أكملت الجميع');
});

test('createShellView hideLevelCompletion hides celebration state', () => {
  const { view, elements } = makeShellView();
  view.showLevelCompletion(true);
  view.hideLevelCompletion();
  assert.equal(elements.levelCompletionElement.hidden, true);
  assert.equal(elements.nextLevelButton.hidden, true);
  assert.equal(elements.levelCompletionMessageElement.textContent, '');
});

test('createShellView showParentArea and hideParentArea toggle visibility', () => {
  const { view, elements } = makeShellView();
  view.showParentArea();
  assert.equal(elements.parentAreaElement.hidden, false);
  view.hideParentArea();
  assert.equal(elements.parentAreaElement.hidden, true);
});

test('createShellView renderParentAreaSummary renders concept counts', () => {
  const createdListItems = [];
  global.document = {
    title: '',
    querySelector: (sel) => stubQuerySelector(sel),
    createElement: () => {
      const item = makeElement();
      createdListItems.push(item);
      return item;
    }
  };
  const { view, elements } = makeShellView();

  view.renderParentAreaSummary({
    completedLevelCount: 2,
    conceptSummaries: [
      { conceptKey: 'sequencing', completedLevelCount: 2 },
      { conceptKey: 'directions', completedLevelCount: 1 },
      { conceptKey: 'repetition', completedLevelCount: 0 }
    ]
  });

  assert.equal(elements.parentProgressSummaryElement.textContent, 'المستويات المكتملة: 2');
  assert.deepEqual(
    createdListItems.map((item) => item.textContent),
    ['التسلسل: جُرّب في 2 مستوى.', 'الاتجاهات: جُرّب في 1 مستوى.', 'التكرار: جُرّب في 0 مستوى.']
  );
});
