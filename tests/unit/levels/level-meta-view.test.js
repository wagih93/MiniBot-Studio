import test from 'node:test';
import assert from 'node:assert/strict';
import { createLevelMetaView } from '../../../js/features/levels/index.js';

function makeElement(init = {}) {
  return { textContent: '', hidden: false, disabled: false, ...init };
}

const labels = {
  levelIndicatorTemplate: 'المستوى {current}/{total}',
  hintPrefix: 'تلميح:',
  successPrefix: 'الهدف:',
  collectionPrefix: 'النجوم المجموعة:',
  sensorPrefix: 'المستشعر:',
  sensorBlocked: 'يوجد عائق أمام الروبوت.',
  sensorClear: 'الطريق أمام الروبوت واضح.',
  defaultHint: 'اتبع المسار حتى النجمة.',
  defaultSuccess: 'صل إلى النجمة لتنجح.',
  reachGoalSuccess: 'وصل إلى الهدف المحدد.'
};
const playableLevelIds = ['level-001', 'level-002', 'level-003', 'level-004', 'level-005'];

function makeView() {
  const levelHintElement = makeElement();
  const hintButtonElement = makeElement();
  const objectiveConditionElement = makeElement();
  const collectionSummaryElement = makeElement();
  const sensorStateElement = makeElement();
  const levelIndicatorElement = makeElement();
  const getCollectedCollectibleCount = (progress) => progress.collected;
  const view = createLevelMetaView({
    levelHintElement,
    hintButtonElement,
    objectiveConditionElement,
    collectionSummaryElement,
    sensorStateElement,
    levelIndicatorElement,
    labels,
    playableLevelIds,
    getCollectedCollectibleCount
  });
  return {
    view,
    levelHintElement,
    hintButtonElement,
    objectiveConditionElement,
    collectionSummaryElement,
    sensorStateElement,
    levelIndicatorElement
  };
}

test('createLevelMetaView render sets hint and success condition from level', () => {
  const { view, levelHintElement, objectiveConditionElement } = makeView();
  const level = { hints: ['تلميح المستوى'], successConditions: { collectAllCollectibles: true } };
  view.render(level);
  assert.ok(levelHintElement.textContent.includes('تلميح المستوى'));
  assert.equal(objectiveConditionElement.textContent, labels.defaultSuccess);
});

test('createLevelMetaView render uses defaultHint when hints is empty', () => {
  const { view, levelHintElement, hintButtonElement } = makeView();
  const level = { hints: [], successConditions: {} };
  view.render(level);
  assert.ok(levelHintElement.textContent.includes(labels.defaultHint));
  assert.equal(hintButtonElement.hidden, false);
  assert.equal(hintButtonElement.disabled, false);
});

test('createLevelMetaView updateLevelIndicator shows correct current/total', () => {
  const { view, levelIndicatorElement } = makeView();
  view.updateLevelIndicator('level-002');
  assert.equal(levelIndicatorElement.textContent, 'المستوى 2/5');
});

test('createLevelMetaView updateLevelIndicator defaults to 1 for unknown level', () => {
  const { view, levelIndicatorElement } = makeView();
  view.updateLevelIndicator('unknown-level');
  assert.equal(levelIndicatorElement.textContent, 'المستوى 1/5');
});

test('createLevelMetaView updateCollectionSummary shows collected count', () => {
  const { view, collectionSummaryElement } = makeView();
  view.updateCollectionSummary({ collected: 2, totalCollectibles: 5 });
  assert.ok(collectionSummaryElement.textContent.includes('2/5'));
});

test('createLevelMetaView updateSensorState renders Arabic clear and blocked labels', () => {
  const { view, sensorStateElement } = makeView();
  view.updateSensorState('clear');
  assert.ok(sensorStateElement.textContent.includes(labels.sensorPrefix));
  assert.ok(sensorStateElement.textContent.includes(labels.sensorClear));

  view.updateSensorState('blocked');
  assert.ok(sensorStateElement.textContent.includes(labels.sensorBlocked));
});

test('createLevelMetaView showNextHint advances progressively and keeps one piece per step', () => {
  const { view, levelHintElement } = makeView();
  const level = { hints: ['الخطوة الأولى', 'الخطوة الثانية'], successConditions: {} };
  view.render(level);

  const firstHintResult = view.showNextHint();
  assert.equal(firstHintResult.hintText, 'الخطوة الثانية');
  assert.ok(levelHintElement.textContent.includes('الخطوة الثانية'));

  const repeatedHintResult = view.showNextHint();
  assert.equal(repeatedHintResult.hintText, 'الخطوة الثانية');
  assert.equal(repeatedHintResult.hasMore, false);
});

test('createLevelMetaView showNextHint can trigger optional speech callback', () => {
  const { view } = makeView();
  const spokenHints = [];
  const level = { hints: ['أول تلميح', 'ثاني تلميح'], successConditions: {} };
  view.render(level);

  const hintResult = view.showNextHint({
    speakHint: (hintText) => {
      spokenHints.push(hintText);
      return true;
    }
  });

  assert.equal(hintResult.wasSpoken, true);
  assert.deepEqual(spokenHints, ['ثاني تلميح']);
});
