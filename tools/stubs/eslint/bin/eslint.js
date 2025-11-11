#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);
if (!args.length) {
  process.exit(0);
}

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

const targets = args.flatMap((pattern) => expand(pattern));
const uniqueTargets = Array.from(new Set(targets));

let hasError = false;
for (const file of uniqueTargets) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) {
    hasError = true;
  }
}

process.exit(hasError ? 1 : 0);
