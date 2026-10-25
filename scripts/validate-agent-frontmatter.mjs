import { readFile } from 'node:fs/promises';

const agentFilePath = '.github/agents/minibot-backlog-implementer.agent.md';

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    throw new Error('Missing YAML frontmatter block.');
  }

  const fields = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }
    const separatorIndex = line.indexOf(':');
    if (separatorIndex <= 0) {
      throw new Error(`Invalid frontmatter line: "${rawLine}"`);
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    fields[key] = value;
  }

  return fields;
}

const fileContent = await readFile(agentFilePath, 'utf8');
const frontmatter = parseFrontmatter(fileContent);

const requiredFields = ['name', 'description'];
const missingFields = requiredFields.filter((field) => !(field in frontmatter) || frontmatter[field].length === 0);

if (missingFields.length > 0) {
  throw new Error(`Missing required frontmatter fields: ${missingFields.join(', ')}`);
}

console.log('Agent frontmatter validation passed.');
console.log(`name: ${frontmatter.name}`);
console.log(`description: ${frontmatter.description}`);
