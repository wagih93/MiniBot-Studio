import test from 'node:test';
import assert from 'node:assert/strict';
import { levelCollect } from '../../js/features/levels/domain/data/level-collect.js';
import {
  createObjectiveProgress,
  getCollectedCollectibleCount,
  updateObjectiveProgress
} from '../../js/features/program-execution/index.js';

test('objective tracker collects collectibles and marks completion', () => {
  const objectiveProgress = createObjectiveProgress(levelCollect);
  const progress = updateObjectiveProgress(levelCollect, objectiveProgress, {
    row: 0,
    column: 1,
    direction: 'east'
  });

  assert.equal(progress.collectedCollectibleKey, '0-1');
  assert.equal(progress.isObjectiveComplete, true);
  assert.equal(getCollectedCollectibleCount(objectiveProgress), 0);
  assert.equal(getCollectedCollectibleCount(progress.objectiveProgress), 1);
});

test('objective tracker does not collect the same collectible twice', () => {
  const initialObjectiveProgress = createObjectiveProgress(levelCollect);
  const firstProgress = updateObjectiveProgress(levelCollect, initialObjectiveProgress, {
    row: 0,
    column: 1,
    direction: 'east'
  });
  const repeatProgress = updateObjectiveProgress(levelCollect, firstProgress.objectiveProgress, {
    row: 0,
    column: 1,
    direction: 'east'
  });

  assert.equal(repeatProgress.collectedCollectibleKey, null);
  assert.equal(getCollectedCollectibleCount(repeatProgress.objectiveProgress), 1);
});
