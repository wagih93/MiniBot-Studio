import test from 'node:test';
import assert from 'node:assert/strict';
import { createLevelMetaView } from '../../../js/features/levels/index.js';

function makeElement(init = {}) {
  return { textContent: '', ...init };
}

const labels = {
  levelIndicatorTemplate: 'المستوى {current}/{total}',
  hintPrefix: 'تلميح:',
  successPrefix: 'الهدف:',
  collectionPrefix: 'النجوم المجموعة:',
  defaultHint: 'اتبع المسار حتى النجمة.',
  defaultSuccess: 'صل إلى النجمة لتنجح.',
  reachGoalSuccess: 'وصل إلى الهدف المحدد.'
};
const playableLevelIds = ['level-001', 'level-002', 'level-collect'];

function makeView() {
  const levelHintElement = makeElement();
  const objectiveConditionElement = makeElement();
  const collectionSummaryElement = makeElement();
  const levelIndicatorElement = makeElement();
  const getCollectedCollectibleCount = (progress) => progress.collected;
  const view = createLevelMetaView({ levelHintElement, objectiveConditionElement, collectionSummaryElement, levelIndicatorElement, labels, playableLevelIds, getCollectedCollectibleCount });
  return { view, levelHintElement, objectiveConditionElement, collectionSummaryElement, levelIndicatorElement };
}

test('createLevelMetaView render sets hint and success condition from level', () => {
  const { view, levelHintElement, objectiveConditionElement } = makeView();
  const level = { hints: ['تلميح المستوى'], successConditions: { collectAllCollectibles: true } };
  view.render(level);
  assert.ok(levelHintElement.textContent.includes('تلميح المستوى'));
  assert.equal(objectiveConditionElement.textContent, labels.defaultSuccess);
});

test('createLevelMetaView render uses defaultHint when hints is empty', () => {
  const { view, levelHintElement } = makeView();
  const level = { hints: [], successConditions: {} };
  view.render(level);
  assert.ok(levelHintElement.textContent.includes(labels.defaultHint));
});

test('createLevelMetaView updateLevelIndicator shows correct current/total', () => {
  const { view, levelIndicatorElement } = makeView();
  view.updateLevelIndicator('level-002');
  assert.equal(levelIndicatorElement.textContent, 'المستوى 2/3');
});

test('createLevelMetaView updateLevelIndicator defaults to 1 for unknown level', () => {
  const { view, levelIndicatorElement } = makeView();
  view.updateLevelIndicator('unknown-level');
  assert.equal(levelIndicatorElement.textContent, 'المستوى 1/3');
});

test('createLevelMetaView updateCollectionSummary shows collected count', () => {
  const { view, collectionSummaryElement } = makeView();
  view.updateCollectionSummary({ collected: 2, totalCollectibles: 5 });
  assert.ok(collectionSummaryElement.textContent.includes('2/5'));
});
