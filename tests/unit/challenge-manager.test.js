import test from 'node:test';
import assert from 'node:assert/strict';
import { levelCollect } from '../../js/levels/data/level-collect.js';
import { createChallengeState, getCollectedCount, updateChallengeProgress } from '../../js/levels/challenge-manager.js';

test('challenge manager collects goals and marks completion', () => {
  const challengeState = createChallengeState(levelCollect);
  const progress = updateChallengeProgress(levelCollect, challengeState, { row: 0, column: 1, direction: 'east' });

  assert.equal(progress.collectedGoalKey, '0-1');
  assert.equal(progress.isComplete, true);
  assert.equal(getCollectedCount(challengeState), 1);
});

test('challenge manager does not collect the same goal twice', () => {
  const challengeState = createChallengeState(levelCollect);
  updateChallengeProgress(levelCollect, challengeState, { row: 0, column: 1, direction: 'east' });
  const repeatProgress = updateChallengeProgress(levelCollect, challengeState, {
    row: 0,
    column: 1,
    direction: 'east'
  });

  assert.equal(repeatProgress.collectedGoalKey, null);
  assert.equal(getCollectedCount(challengeState), 1);
});
