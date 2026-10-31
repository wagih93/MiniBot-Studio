import test from 'node:test';
import assert from 'node:assert/strict';
import { createShellView } from '../../../js/features/shell/index.js';

function makeElement(init = {}) {
  return {
    hidden: false, disabled: false, textContent: '', dataset: {},
    _attrs: {},
    setAttribute(name, val) { this._attrs[name] = val; },
    getAttribute(name) { return this._attrs[name] ?? null; },
    removeAttribute(name) { delete this._attrs[name]; },
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
    startButton: makeElement(), continueButton: makeElement(), parentsButton: makeElement(), tutorialButton: makeElement(), labButton: makeElement(),
    playButton: makeElement(), stopButton: makeElement(), resetButton: makeElement(), nextLevelButton: makeElement({ hidden: true }),
    retryLevelButton: makeElement(), returnHomeButton: makeElement(), saveProgramButton: makeElement(), hintButton: makeElement(),
    playInstructionAudioButton: makeElement(),
    worldGridElement: makeElement(),
    labControlsElement: makeElement({ hidden: true }),
    labControlsHeadingElement: makeElement(),
    labModeRobotButton: makeElement(),
    labModeObstacleButton: makeElement(),
    robotCustomizationHeadingElement: makeElement(),
    robotDesignHeadingElement: makeElement(),
    robotColorHeadingElement: makeElement(),
    robotDesignButtons: [
      makeElement({ dataset: { robotDesign: 'classic' } }),
      makeElement({ dataset: { robotDesign: 'explorer' } }),
      makeElement({ dataset: { robotDesign: 'turbo' } })
    ],
    robotColorButtons: [
      makeElement({ dataset: { robotColor: 'blue' } }),
      makeElement({ dataset: { robotColor: 'green' } }),
      makeElement({ dataset: { robotColor: 'purple' } })
    ],
    parentAreaElement: makeElement({ hidden: true }), parentProgressSummaryElement: makeElement(), parentConceptListElement: makeElement({
      textContent: '',
      _items: [],
      append(item) { this._items.push(item); }
    }), soundEffectsToggle: makeElement({ checked: false }), clearProgressButton: makeElement(), closeParentAreaButton: makeElement(),
    tutorialPanelElement: makeElement({ hidden: true }),
    tutorialStepIndicatorElement: makeElement(),
    tutorialHeadingElement: makeElement(),
    tutorialBodyElement: makeElement(),
    tutorialNextButton: makeElement(),
    tutorialSkipButton: makeElement(),
    tutorialCloseButton: makeElement(),
    tutorialAudioButton: makeElement(),
    blockListElement: makeElement(),
    programWorkspaceElement: makeElement(), levelErrorElement: makeElement(), levelErrorMessageElement: makeElement(),
    levelCompletionElement: makeElement({ hidden: true }), levelCompletionMessageElement: makeElement()
  };
  const labels = {
    pageTitle: 'MiniBot Studio',
    heading: 'مختبر الروبوت',
    primaryActions: { start: 'ابدأ', continue: 'واصل', parents: 'للأهل', lab: 'المختبر الحر' },
    freePlayLab: { heading: 'المختبر الحر', modeRobot: 'حرّك الروبوت', modeObstacle: 'بدّل العوائق' },
    robotCustomization: {
      heading: 'تخصيص الروبوت',
      designHeading: 'شكل الروبوت',
      colorHeading: 'لون الروبوت',
      designOptions: { classic: 'كلاسيكي', explorer: 'مستكشف', turbo: 'سريع' },
      colorOptions: { blue: 'أزرق', green: 'أخضر', purple: 'بنفسجي' }
    },
    parentArea: {
      heading: 'منطقة الأهل',
      description: 'إدارة التقدم',
      soundEffectsLabel: 'تشغيل المؤثرات الصوتية',
      clearProgressConfirm: 'تأكيد',
      completedLevelsTemplate: 'المستويات المكتملة: {count}',
      conceptCountTemplate: '{concept}: جُرّب في {count} مستوى.',
      learningConceptLabels: {
        sequencing: 'التسلسل',
        directions: 'الاتجاهات',
        repetition: 'التكرار'
      }
    },
    tutorial: {
      replay: 'أعد الشرح',
      stepTemplate: 'الخطوة {current} من {total}',
      next: 'التالي',
      finish: 'أنهِ الشرح',
      skip: 'تخطَّ',
      close: 'إخفاء',
      playAudio: 'استمع'
    },
    world: { heading: 'عالم الروبوت' },
    blockArea: { heading: 'الأوامر', programHeading: 'مساحة', firstLevelDemo: 'مثال' },
    controls: { play: 'تشغيل', stop: 'إيقاف', reset: 'إعادة', hint: 'تلميح', playInstructionAudio: 'استمع', nextLevel: 'التالي', retryLevel: 'حاول', returnHome: 'رئيسية', saveProgram: 'احفظ', clearProgress: 'امسح', closeParentArea: 'إغلاق' },
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
    onToggleSoundEffects: overrides.onToggleSoundEffects ?? (() => {}),
    onPlayInstructionAudio: overrides.onPlayInstructionAudio ?? (() => {}),
    onOpenLab: overrides.onOpenLab ?? (() => {}),
    onOpenTutorial: overrides.onOpenTutorial ?? (() => {}),
    onSelectLabRobotMode: overrides.onSelectLabRobotMode ?? (() => {}),
    onSelectLabObstacleMode: overrides.onSelectLabObstacleMode ?? (() => {}),
    onLabCellSelected: overrides.onLabCellSelected ?? (() => {}),
    onSelectRobotDesign: overrides.onSelectRobotDesign ?? (() => {}),
    onSelectRobotColor: overrides.onSelectRobotColor ?? (() => {}),
    onTutorialNext: overrides.onTutorialNext ?? (() => {}),
    onTutorialSkip: overrides.onTutorialSkip ?? (() => {}),
    onTutorialClose: overrides.onTutorialClose ?? (() => {}),
    onPlayTutorialAudio: overrides.onPlayTutorialAudio ?? (() => {}),
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
  assert.equal(elements.tutorialButton.disabled, true);
  assert.equal(elements.labButton.disabled, true);
  assert.equal(elements.playInstructionAudioButton.disabled, true);
});

test('createShellView syncPrimaryActions re-enables primary actions after run end', () => {
  const { view, elements } = makeShellView({ readHasSavedProgress: () => true });
  view.syncPrimaryActions(true);
  view.syncPrimaryActions(false);
  assert.equal(elements.startButton.disabled, false);
  assert.equal(elements.continueButton.hidden, false);
  assert.equal(elements.continueButton.disabled, false);
  assert.equal(elements.parentsButton.disabled, false);
  assert.equal(elements.labButton.disabled, false);
  assert.equal(elements.playInstructionAudioButton.disabled, false);
});

test('createShellView setEditingEnabled disables control buttons when false', () => {
  const { view, elements } = makeShellView();
  const programListEl = makeElement({ querySelectorAll: () => [] });
  view.setEditingEnabled(false, programListEl);
  assert.equal(elements.playButton.disabled, true);
  assert.equal(elements.retryLevelButton.disabled, true);
  assert.equal(elements.saveProgramButton.disabled, true);
  assert.equal(elements.labModeRobotButton.disabled, true);
  assert.equal(elements.labModeObstacleButton.disabled, true);
  assert.equal(elements.robotDesignButtons.every((button) => button.disabled), true);
  assert.equal(elements.robotColorButtons.every((button) => button.disabled), true);
});

test('createShellView setLabControlsState toggles visibility and selected mode', () => {
  const { view, elements } = makeShellView();

  view.setLabControlsState(true, 'obstacle');
  assert.equal(elements.labControlsElement.hidden, false);
  assert.equal(elements.labModeRobotButton.dataset.selected, 'false');
  assert.equal(elements.labModeObstacleButton.dataset.selected, 'true');

  view.setLabControlsState(false, 'robot');
  assert.equal(elements.labControlsElement.hidden, true);
  assert.equal(elements.labModeRobotButton.dataset.selected, 'true');
  assert.equal(elements.labModeObstacleButton.dataset.selected, 'false');
});

test('createShellView setRobotAppearanceSelection updates selected design and color', () => {
  const { view, elements } = makeShellView();

  view.setRobotAppearanceSelection({ design: 'explorer', color: 'purple' });

  const selectedDesigns = elements.robotDesignButtons.filter((button) => button.dataset.selected === 'true');
  const selectedColors = elements.robotColorButtons.filter((button) => button.dataset.selected === 'true');
  assert.deepEqual(selectedDesigns.map((button) => button.dataset.robotDesign), ['explorer']);
  assert.deepEqual(selectedColors.map((button) => button.dataset.robotColor), ['purple']);
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

test('createShellView renderTutorialStep shows tutorial content and focused target', () => {
  const { view, elements } = makeShellView();

  view.renderTutorialStep({
    index: 0,
    total: 3,
    title: 'عنوان',
    description: 'وصف',
    focusTarget: 'toolbox',
    isLastStep: false
  });

  assert.equal(elements.tutorialPanelElement.hidden, false);
  assert.equal(elements.tutorialStepIndicatorElement.textContent, 'الخطوة 1 من 3');
  assert.equal(elements.tutorialHeadingElement.textContent, 'عنوان');
  assert.equal(elements.tutorialBodyElement.textContent, 'وصف');
  assert.equal(elements.tutorialNextButton.textContent, 'التالي');
  assert.equal(elements.blockListElement.getAttribute('data-tutorial-focus'), 'true');
});

test('createShellView hideTutorial clears tutorial state and focus styles', () => {
  const { view, elements } = makeShellView();
  view.renderTutorialStep({
    index: 2,
    total: 3,
    title: 'عنوان',
    description: 'وصف',
    focusTarget: 'play',
    isLastStep: true
  });

  view.hideTutorial();

  assert.equal(elements.tutorialPanelElement.hidden, true);
  assert.equal(elements.tutorialHeadingElement.textContent, '');
  assert.equal(elements.tutorialBodyElement.textContent, '');
  assert.equal(elements.playButton.getAttribute('data-tutorial-focus'), null);
});

test('createShellView setSoundEffectsEnabled syncs the sound toggle state', () => {
  const { view, elements } = makeShellView();
  view.setSoundEffectsEnabled(true);
  assert.equal(elements.soundEffectsToggle.checked, true);
  view.setSoundEffectsEnabled(false);
  assert.equal(elements.soundEffectsToggle.checked, false);
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
