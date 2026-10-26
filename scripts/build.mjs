import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { findTopLevelDirectoryMatches } from './build-path-checks.mjs';

const requiredDocumentationPaths = [
  'docs/COPILOT_PROJECT_SETUP.md',
  'docs/PRODUCT_BACKLOG_STYKANIMATE.md',
  'docs/implementation-status.md'
];
const shippedEntries = ['index.html', 'css', 'js'];
const distRootPath = resolve('dist');

function failBuild(message, details = []) {
  console.error(message);
  for (const detail of details) {
    console.error(`- ${detail}`);
  }
  process.exit(1);
}

async function ensureRequiredDocumentation() {
  const missingPaths = requiredDocumentationPaths.filter((path) => !existsSync(path));
  if (missingPaths.length > 0) {
    failBuild('Build failed. Missing required documentation files:', missingPaths);
  }
}

async function createDistOutput() {
  await rm(distRootPath, { recursive: true, force: true });
  await mkdir(distRootPath, { recursive: true });

  for (const entry of shippedEntries) {
    const sourcePath = resolve(entry);
    const targetPath = resolve(distRootPath, entry);
    await cp(sourcePath, targetPath, { recursive: true });
  }
}

async function validateDistContents() {
  const distEntries = await readdir(distRootPath, { withFileTypes: true });
  const entryNames = distEntries.map((entry) => entry.name).sort();
  const expectedNames = [...shippedEntries].sort();
  if (entryNames.length !== expectedNames.length ||
    entryNames.some((name, index) => name !== expectedNames[index])) {
    failBuild(
      'Build failed. dist/ contains unexpected root entries.',
      [`Expected: ${expectedNames.join(', ')}`, `Actual: ${entryNames.join(', ')}`]
    );
  }

  const jsEntries = await readdir(resolve(distRootPath, 'js'), { recursive: true });
  const normalizedJsEntries = jsEntries.map((entry) => String(entry).replace(/\\/g, '/'));
  if (normalizedJsEntries.some((entry) =>
    entry === 'tests' || entry.startsWith('tests/') || entry.includes('/tests/'))
  ) {
    failBuild('Build failed. dist/js contains test files.');
  }

  const legacyDirs = ['simulator', 'levels', 'i18n'];
  const legacyMatches = findTopLevelDirectoryMatches(normalizedJsEntries, legacyDirs);
  for (const legacyDir of legacyMatches) {
    failBuild(`Build failed. dist/js still contains legacy directory: ${legacyDir}`);
  }
}

async function validateDistCsp() {
  const indexHtmlPath = resolve(distRootPath, 'index.html');
  const indexHtml = await readFile(indexHtmlPath, 'utf8');
  const cspMatch = indexHtml.match(
    /<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]+content=(["'])([\s\S]*?)\1/i
  );
  if (!cspMatch) {
    failBuild('Build failed. dist/index.html is missing CSP meta tag.');
  }

  const cspValue = cspMatch[2];
  const requiredDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ];
  const missingDirectives = requiredDirectives.filter((directive) => !cspValue.includes(directive));
  if (missingDirectives.length > 0) {
    failBuild('Build failed. dist/index.html CSP is missing required directives.', missingDirectives);
  }
}

await ensureRequiredDocumentation();
await createDistOutput();
await validateDistContents();
await validateDistCsp();

console.log('Build completed successfully. dist/ is ready.');
