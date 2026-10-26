import test from 'node:test';
import assert from 'node:assert/strict';
import { createLearningProgressSummary } from '../../../js/features/learning-progress/index.js';

test('createLearningProgressSummary counts completed levels per learning concept', () => {
  const summary = createLearningProgressSummary({
    completedLevelIds: ['level-001', 'level-003', 'level-004'],
    levelsById: {
      'level-001': { learningConcepts: ['sequencing'] },
      'level-003': { learningConcepts: ['sequencing', 'directions'] },
      'level-004': { learningConcepts: ['directions'] }
    }
  });

  assert.equal(summary.completedLevelCount, 3);
  assert.deepEqual(summary.conceptSummaries, [
    { conceptKey: 'sequencing', completedLevelCount: 2 },
    { conceptKey: 'directions', completedLevelCount: 2 },
    { conceptKey: 'repetition', completedLevelCount: 0 }
  ]);
});

test('createLearningProgressSummary deduplicates completed levels and ignores unknown concepts', () => {
  const summary = createLearningProgressSummary({
    completedLevelIds: ['level-001', 'level-001', 'missing-level'],
    levelsById: {
      'level-001': { learningConcepts: ['sequencing', 'unsupported-concept'] }
    }
  });

  assert.equal(summary.completedLevelCount, 1);
  assert.deepEqual(summary.conceptSummaries, [
    { conceptKey: 'sequencing', completedLevelCount: 1 },
    { conceptKey: 'directions', completedLevelCount: 0 },
    { conceptKey: 'repetition', completedLevelCount: 0 }
  ]);
});

test('createLearningProgressSummary supports a custom concept list', () => {
  const summary = createLearningProgressSummary({
    completedLevelIds: ['level-005'],
    levelsById: {
      'level-005': { learningConcepts: ['sequencing', 'repetition'] }
    },
    learningConceptKeys: ['repetition']
  });

  assert.equal(summary.completedLevelCount, 1);
  assert.deepEqual(summary.conceptSummaries, [
    { conceptKey: 'repetition', completedLevelCount: 1 }
  ]);
});
