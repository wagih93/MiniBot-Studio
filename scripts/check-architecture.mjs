import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const jsRootPath = resolve('js');
const scanExtensions = new Set(['.js', '.mjs']);
const compositionRootFiles = new Set(['js/app.js', 'js/robot-lab.js']);
const allowlistPath = resolve('scripts/architecture-allowlist.json');

const effectsPatterns = [
  { id: 'document', regex: /\bdocument\b/ },
  { id: 'window', regex: /\bwindow\b/ },
  { id: 'localStorage', regex: /\blocalStorage\b/ },
  { id: 'timers', regex: /\bsetTimeout\b|\bsetInterval\b/ },
  { id: 'dateNow', regex: /\bDate\.now\b/ },
  { id: 'mathRandom', regex: /\bMath\.random\b/ },
  { id: 'console', regex: /\bconsole\./ }
];

function toPosixPath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function resolveFromProject(filePath) {
  return toPosixPath(relative(process.cwd(), filePath));
}

async function listFiles(rootPath) {
  const entries = await readdir(rootPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(rootPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && scanExtensions.has(extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function countChar(source, charToCount) {
  let count = 0;
  for (const char of source) {
    if (char === charToCount) {
      count += 1;
    }
  }
  return count;
}

function normalizeImportTarget(filePath, importPath) {
  if (!importPath.startsWith('.')) {
    return null;
  }

  let resolvedPath = resolve(filePath, '..', importPath);
  if (!extname(resolvedPath)) {
    if (importPath.endsWith('/')) {
      resolvedPath = `${resolvedPath}index.js`;
    } else {
      resolvedPath = `${resolvedPath}.js`;
    }
  }

  return resolveFromProject(resolvedPath);
}

function isDomainOrApplicationFile(filePath) {
  return /^js\/features\/[^/]+\/(domain|application)\//.test(filePath);
}

function isInfrastructureFile(filePath) {
  return /^js\/features\/[^/]+\/infrastructure\//.test(filePath);
}

function getSliceName(filePath) {
  const match = /^js\/features\/([^/]+)\//.exec(filePath);
  return match ? match[1] : null;
}

function getTopLevelMutableStateViolations(filePath, lines) {
  if (compositionRootFiles.has(filePath)) {
    return [];
  }

  let depth = 0;
  const violations = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmedLine = line.trim();
    if (depth === 0 && /^(let|var)\s+[A-Za-z_$]/.test(trimmedLine)) {
      violations.push({
        kind: 'moduleLevelMutableState',
        filePath,
        lineNumber: index + 1,
        details: trimmedLine
      });
    }

    depth += countChar(line, '{');
    depth -= countChar(line, '}');
    if (depth < 0) {
      depth = 0;
    }
  }

  return violations;
}

async function readAllowlist() {
  const rawAllowlist = await readFile(allowlistPath, 'utf8');
  const parsedAllowlist = JSON.parse(rawAllowlist);
  return {
    crossSliceInternalImport: new Set(parsedAllowlist.crossSliceInternalImport ?? []),
    domainOrApplicationEffects: new Set(parsedAllowlist.domainOrApplicationEffects ?? []),
    sharedDependsOnSlice: new Set(parsedAllowlist.sharedDependsOnSlice ?? []),
    moduleLevelMutableState: new Set(parsedAllowlist.moduleLevelMutableState ?? []),
    localStorageOutsideInfrastructure: new Set(parsedAllowlist.localStorageOutsideInfrastructure ?? [])
  };
}

const allowlist = await readAllowlist();
const files = await listFiles(jsRootPath);
const violations = [];

for (const absoluteFilePath of files) {
  const relativeFilePath = resolveFromProject(absoluteFilePath);
  const source = await readFile(absoluteFilePath, 'utf8');
  const lines = source.split(/\r?\n/);
  const currentSlice = getSliceName(relativeFilePath);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!isInfrastructureFile(relativeFilePath) && /\blocalStorage\b/.test(line)) {
      violations.push({
        kind: 'localStorageOutsideInfrastructure',
        filePath: relativeFilePath,
        lineNumber: index + 1,
        details: line.trim()
      });
    }

    const importMatch = line.match(/^\s*import(?:.+?\s+from\s+)?['"]([^'"]+)['"]/);
    if (!importMatch) {
      continue;
    }

    const importPath = importMatch[1];
    const normalizedTarget = normalizeImportTarget(absoluteFilePath, importPath);
    if (!normalizedTarget) {
      continue;
    }

    if (currentSlice && normalizedTarget.startsWith('js/features/')) {
      const targetSlice = getSliceName(normalizedTarget);
      const allowedTarget = `js/features/${targetSlice}/index.js`;
      if (
        targetSlice &&
        targetSlice !== currentSlice &&
        normalizedTarget !== allowedTarget
      ) {
        violations.push({
          kind: 'crossSliceInternalImport',
          filePath: relativeFilePath,
          lineNumber: index + 1,
          details: `${line.trim()} -> ${normalizedTarget}`
        });
      }
    }

    if (relativeFilePath.startsWith('js/shared/') && normalizedTarget.startsWith('js/features/')) {
      violations.push({
        kind: 'sharedDependsOnSlice',
        filePath: relativeFilePath,
        lineNumber: index + 1,
        details: `${line.trim()} -> ${normalizedTarget}`
      });
    }
  }

  if (isDomainOrApplicationFile(relativeFilePath)) {
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const pattern of effectsPatterns) {
        if (pattern.regex.test(line)) {
          violations.push({
            kind: 'domainOrApplicationEffects',
            filePath: relativeFilePath,
            lineNumber: index + 1,
            details: `[${pattern.id}] ${line.trim()}`
          });
        }
      }
    }
  }

  violations.push(...getTopLevelMutableStateViolations(relativeFilePath, lines));
}

const filteredViolations = violations.filter((violation) => {
  const allowlistKey = `${violation.filePath}:${violation.lineNumber}`;
  if (violation.kind === 'crossSliceInternalImport') {
    return !allowlist.crossSliceInternalImport.has(allowlistKey);
  }
  if (violation.kind === 'domainOrApplicationEffects') {
    return !allowlist.domainOrApplicationEffects.has(allowlistKey);
  }
  if (violation.kind === 'sharedDependsOnSlice') {
    return !allowlist.sharedDependsOnSlice.has(allowlistKey);
  }
  if (violation.kind === 'moduleLevelMutableState') {
    return !allowlist.moduleLevelMutableState.has(allowlistKey);
  }
  if (violation.kind === 'localStorageOutsideInfrastructure') {
    return !allowlist.localStorageOutsideInfrastructure.has(allowlistKey);
  }
  return true;
});

if (filteredViolations.length > 0) {
  console.error('Architecture check failed:');
  for (const violation of filteredViolations) {
    console.error(
      `- [${violation.kind}] ${violation.filePath}:${violation.lineNumber} ${violation.details}`
    );
  }
  process.exit(1);
}

console.log('Architecture check passed.');
