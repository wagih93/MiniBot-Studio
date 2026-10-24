import { brokenLevel } from './data/broken-level.js';
import { levelCollect } from './data/level-collect.js';
import { level001 } from './data/level-001.js';
import { level002 } from './data/level-002.js';
import { testLevelValidation } from './data/test-level-validation.js';

const levelEntries = [level001, level002, levelCollect, testLevelValidation, brokenLevel];

const levelsById = new Map(levelEntries.map((level) => [level.id, level]));

export function getLevelById(levelId) {
  return levelsById.get(levelId) ?? null;
}

export function listLevelIds() {
  return levelEntries.map((level) => level.id);
}
