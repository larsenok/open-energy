#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
if (!args.length || args[0] !== '--check') {
  console.error('[prettier] Only --check mode is supported in this stub.');
  process.exit(1);
}

const patterns = args.slice(1);

function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function expand(pattern) {
  if (pattern.includes('**/')) {
    const [basePart, suffixPart] = pattern.split('**/');
    const baseDir = resolve(basePart || '.');
    const suffix = suffixPart.replace('*', '');
    return walk(baseDir).filter((file) => file.endsWith(suffix));
  }
  return [resolve(pattern)];
}

const targets = patterns.flatMap((pattern) => expand(pattern));
const uniqueTargets = Array.from(new Set(targets));

let hasError = false;
for (const file of uniqueTargets) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch (error) {
    console.error(`[prettier] Unable to read ${file}:`, error.message);
    hasError = true;
    continue;
  }

  if (!content.endsWith('\n')) {
    console.error(`[prettier] ${file} is missing a terminating newline.`);
    hasError = true;
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (/[\t ]+$/.test(line)) {
      console.error(`[prettier] ${file}:${index + 1} has trailing whitespace.`);
      hasError = true;
    }
  });
}

if (hasError) {
  process.exit(1);
}
process.exit(0);
