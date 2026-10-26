import { level001 } from './data/level-001.js';
import { level002 } from './data/level-002.js';
import { level003 } from './data/level-003.js';
import { level004 } from './data/level-004.js';
import { level005 } from './data/level-005.js';

const levelEntries = [level001, level002, level003, level004, level005];
const levelsById = new Map(levelEntries.map((level) => [level.id, level]));

export function getLevelById(levelId) {
  return levelsById.get(levelId) ?? null;
}

export function listLevelIds() {
  return levelEntries.map((level) => level.id);
}
