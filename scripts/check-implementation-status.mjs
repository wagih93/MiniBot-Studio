import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const statusFilePath = resolve('docs/implementation-status.md');
const allowedStatuses = new Set(['Todo', 'In Progress', 'Blocked', 'In Review', 'Done', 'Deferred']);
const manualReviewPattern = /(manual check|required|human verification|pending manual verification)/i;

function parseStoryRows(markdown) {
  const rows = [];
  const lines = markdown.split(/\r?\n/);

  for (const line of lines) {
    if (!line.startsWith('| US-')) {
      continue;
    }

    const cells = splitMarkdownTableRow(line);
    if (cells.length !== 12) {
      rows.push({
        malformed: true,
        raw: line
      });
      continue;
    }

    rows.push({
      story: cells[0],
      title: cells[1],
      sprint: cells[2],
      priority: cells[3],
      status: cells[4],
      branch: cells[5],
      commitSha: cells[6],
      pr: cells[7],
      acStatus: cells[8],
      validation: cells[9],
      blockers: cells[10],
      nextAction: cells[11]
    });
  }

  return rows;
}

function splitMarkdownTableRow(line) {
  const rawCells = [];
  let currentCell = '';
  let inCodeSpan = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '`') {
      inCodeSpan = !inCodeSpan;
      currentCell += character;
      continue;
    }

    if (character === '|' && !inCodeSpan) {
      rawCells.push(currentCell);
      currentCell = '';
      continue;
    }

    currentCell += character;
  }

  rawCells.push(currentCell);

  if (rawCells[0] === '') {
    rawCells.shift();
  }
  if (rawCells[rawCells.length - 1] === '') {
    rawCells.pop();
  }

  return rawCells.map((cell) => cell.trim());
}

function isCommitSha(value) {
  return /^[0-9a-f]{7,40}$/i.test(value);
}

function isCommitOnCurrentHistory(commitSha) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', commitSha, 'HEAD'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function extractPullNumber(prCell) {
  if (!prCell || prCell === '-') {
    return null;
  }

  const match = prCell.match(/\/pull\/(\d+)$/);
  if (!match) {
    return null;
  }

  return Number.parseInt(match[1], 10);
}

function canUseGh() {
  try {
    execFileSync('gh', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function readPrState(prNumber) {
  const output = execFileSync(
    'gh',
    ['pr', 'view', String(prNumber), '--json', 'number,state,mergedAt,url'],
    { encoding: 'utf8' }
  );

  return JSON.parse(output);
}

function hasManualReviewPending(row) {
  return manualReviewPattern.test(`${row.blockers} ${row.nextAction} ${row.acStatus}`);
}

const markdown = await readFile(statusFilePath, 'utf8');
const rows = parseStoryRows(markdown);
const violations = [];
const warnings = [];

const ghAvailable = canUseGh();
const shouldEnforceGh = process.env.CI === 'true' || !!process.env.GH_TOKEN || !!process.env.GITHUB_TOKEN;
const prStateCache = new Map();

if (!ghAvailable && shouldEnforceGh) {
  violations.push('GitHub CLI is required for implementation-status validation in CI, but `gh` is unavailable.');
}
if (!ghAvailable && !shouldEnforceGh) {
  warnings.push('GitHub CLI is unavailable locally; PR state validation was skipped.');
}

for (const row of rows) {
  if (row.malformed) {
    violations.push(`Malformed status row: ${row.raw}`);
    continue;
  }

  if (!allowedStatuses.has(row.status)) {
    violations.push(`${row.story}: invalid status "${row.status}".`);
  }

  const hasCommitSha = row.commitSha !== '-';
  if (hasCommitSha && !isCommitSha(row.commitSha)) {
    violations.push(`${row.story}: commit SHA "${row.commitSha}" is not a valid SHA.`);
  }

  if (hasCommitSha && isCommitSha(row.commitSha) && (row.status === 'Done' || row.status === 'In Review')) {
    if (!isCommitOnCurrentHistory(row.commitSha)) {
      violations.push(`${row.story}: commit SHA "${row.commitSha}" is not on current git history (HEAD ancestry check failed).`);
    }
  }

  const prNumber = extractPullNumber(row.pr);
  const hasPr = prNumber !== null;
  if (row.status === 'In Review' && !hasPr) {
    violations.push(`${row.story}: status is In Review but PR URL is missing.`);
  }

  if (!hasPr || !ghAvailable) {
    continue;
  }

  let prStateInfo = prStateCache.get(prNumber);
  if (!prStateInfo) {
    try {
      prStateInfo = readPrState(prNumber);
      prStateCache.set(prNumber, prStateInfo);
    } catch (error) {
      if (shouldEnforceGh) {
        violations.push(`${row.story}: failed to read PR #${prNumber} state via gh (${error.message}).`);
      } else {
        warnings.push(`${row.story}: could not read PR #${prNumber} state locally (${error.message}).`);
      }
      continue;
    }
  }

  if (prStateInfo.state === 'OPEN' && row.status !== 'In Review') {
    violations.push(`${row.story}: PR #${prNumber} is OPEN, so status must be In Review (found ${row.status}).`);
  }

  if (row.status === 'In Review' && prStateInfo.state !== 'OPEN' && !hasManualReviewPending(row)) {
    violations.push(`${row.story}: status is In Review, but PR #${prNumber} is ${prStateInfo.state} and no manual-review blocker is documented.`);
  }

  if (row.status === 'Done' && prStateInfo.state === 'OPEN') {
    violations.push(`${row.story}: status is Done, but PR #${prNumber} is still OPEN.`);
  }
}

if (warnings.length > 0) {
  for (const warning of warnings) {
    console.warn(`Warning: ${warning}`);
  }
}

if (violations.length > 0) {
  console.error('Implementation status check failed:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log('Implementation status check passed.');
