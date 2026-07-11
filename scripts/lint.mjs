import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const roots = ['src', 'tests', 'scripts'];
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (/\.(js|mjs)$/.test(entry.name)) files.push(target);
  }
}

for (const root of roots) await walk(root);
const forbidden = [/\bvar\s+/, /console\.log\(/, /debugger\s*;/];
const failures = [];
for (const file of files) {
  const source = await readFile(file, 'utf8');
  for (const rule of forbidden) if (rule.test(source)) failures.push(`${file}: disallowed pattern ${rule}`);
  if (!source.endsWith('\n')) failures.push(`${file}: missing trailing newline`);
}
if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(`Linted ${files.length} JavaScript files.\n`);
