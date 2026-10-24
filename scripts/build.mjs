import { existsSync } from 'node:fs';

const requiredPaths = [
  'docs/COPILOT_PROJECT_SETUP.md',
  'docs/PRODUCT_BACKLOG_STYKANIMATE.md',
  'docs/implementation-status.md'
];

const missingPaths = requiredPaths.filter((path) => !existsSync(path));

if (missingPaths.length > 0) {
  console.error('Build baseline check failed. Missing required files:');
  for (const path of missingPaths) {
    console.error(`- ${path}`);
  }
  process.exit(1);
}

console.log('Build baseline check passed.');
