import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const sourceRoots = [resolve('js')];
const scanExtensions = new Set(['.js', '.mjs']);
const arabicTextPattern = /[\u0600-\u06FF]/;
const bannedIdentifierRules = [
  { id: 'challenge', regex: /\bchallenge[A-Za-z0-9_]*\b/gi },
  { id: 'mission', regex: /\bmission[A-Za-z0-9_]*\b/gi },
  { id: 'stage', regex: /\bstage[A-Za-z0-9_]*\b/gi },
  { id: 'managerSuffix', regex: /\b[A-Za-z_$][A-Za-z0-9_$]*Manager\b/g },
  { id: 'helperSuffix', regex: /\b[A-Za-z_$][A-Za-z0-9_$]*Helper\b/g },
  { id: 'utilSuffix', regex: /\b[A-Za-z_$][A-Za-z0-9_$]*Util\b/g },
  { id: 'handlerSuffix', regex: /\b[A-Za-z_$][A-Za-z0-9_$]*Handler\b/g }
];
const bannedFileNameSegments = ['challenge', 'manager', 'helper', 'util', 'handler'];

function toPosixPath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function toRelativePath(filePath) {
  return toPosixPath(relative(process.cwd(), filePath));
}

async function listFiles(rootPath) {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absoluteEntryPath = join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absoluteEntryPath)));
      continue;
    }

    if (entry.isFile() && scanExtensions.has(extname(entry.name))) {
      files.push(absoluteEntryPath);
    }
  }

  return files;
}

function isArabicAllowedFile(relativeFilePath) {
  return relativeFilePath.startsWith('js/shared/i18n/') ||
    relativeFilePath.startsWith('js/features/levels/domain/data/');
}

function findLineViolations(source, regex, kind, filePath) {
  const violations = [];
  const lines = source.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    regex.lastIndex = 0;
    if (regex.test(line)) {
      violations.push({
        kind,
        filePath,
        lineNumber: lineIndex + 1,
        details: line.trim()
      });
    }
  }
  return violations;
}

const files = [];
for (const rootPath of sourceRoots) {
  files.push(...(await listFiles(rootPath)));
}

const violations = [];

for (const absoluteFilePath of files) {
  const relativeFilePath = toRelativePath(absoluteFilePath);
  const source = await readFile(absoluteFilePath, 'utf8');
  const lowerFilePath = relativeFilePath.toLowerCase();

  for (const bannedSegment of bannedFileNameSegments) {
    if (lowerFilePath.includes(bannedSegment)) {
      violations.push({
        kind: 'bannedFileName',
        filePath: relativeFilePath,
        lineNumber: 1,
        details: `contains banned segment "${bannedSegment}"`
      });
      break;
    }
  }

  for (const rule of bannedIdentifierRules) {
    violations.push(...findLineViolations(source, rule.regex, `bannedIdentifier:${rule.id}`, relativeFilePath));
  }

  if (!isArabicAllowedFile(relativeFilePath)) {
    violations.push(...findLineViolations(source, arabicTextPattern, 'arabicLiteralOutsideLocalizedContent', relativeFilePath));
  }
}

if (violations.length > 0) {
  console.error('Language check failed:');
  for (const violation of violations) {
    console.error(
      `- [${violation.kind}] ${violation.filePath}:${violation.lineNumber} ${violation.details}`
    );
  }
  process.exit(1);
}

console.log('Language check passed.');
