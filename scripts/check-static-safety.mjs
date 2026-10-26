import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const scanRoots = [resolve('index.html'), resolve('js')];
const scannedExtensions = new Set(['.html', '.js', '.mjs']);
const allowlistPath = resolve('scripts', 'safety-allowlist.json');

const checks = [
  { id: 'eval', regex: /\beval\s*\(/ },
  { id: 'newFunction', regex: /new\s+Function\s*\(/ },
  { id: 'dynamicInnerHTML', regex: /\.innerHTML\s*=\s*(?!\s*['"`])/ }
];

async function readAllowlist() {
  const allowlistContent = await readFile(allowlistPath, 'utf8');
  return JSON.parse(allowlistContent);
}

async function collectFiles(rootPath) {
  try {
    const entries = await readdir(rootPath, { withFileTypes: true });
    const collected = [];

    for (const entry of entries) {
      const fullPath = join(rootPath, entry.name);
      if (entry.isDirectory()) {
        collected.push(...(await collectFiles(fullPath)));
        continue;
      }
      if (entry.isFile() && scannedExtensions.has(extname(entry.name))) {
        collected.push(fullPath);
      }
    }

    return collected;
  } catch {
    return [];
  }
}

async function resolveScanTargets() {
  const targets = [];
  for (const rootPath of scanRoots) {
    if (extname(rootPath)) {
      targets.push(rootPath);
      continue;
    }
    targets.push(...(await collectFiles(rootPath)));
  }
  return targets;
}

function toPosixPath(filePath) {
  return filePath.replace(/\\/g, '/');
}

async function findViolations() {
  const allowlist = await readAllowlist();
  const files = await resolveScanTargets();
  const violations = [];

  for (const filePath of files) {
    const normalizedPath = toPosixPath(relative(process.cwd(), filePath));
    const content = await readFile(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const check of checks) {
      const allowedPaths = new Set(allowlist[check.id] ?? []);
      if (allowedPaths.has(normalizedPath)) {
        continue;
      }

      lines.forEach((line, index) => {
        if (check.regex.test(line)) {
          violations.push({
            filePath: normalizedPath,
            checkId: check.id,
            lineNumber: index + 1,
            line: line.trim()
          });
        }
      });
    }
  }

  return violations;
}

const violations = await findViolations();

if (violations.length > 0) {
  console.error('Static safety check failed: prohibited patterns detected.');
  for (const violation of violations) {
    console.error(
      `- ${violation.filePath}:${violation.lineNumber} [${violation.checkId}] ${violation.line}`
    );
  }
  process.exit(1);
}

console.log('Static safety check passed.');
