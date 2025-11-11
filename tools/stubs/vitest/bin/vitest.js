#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const filtered = args.filter((arg) => arg !== 'run');
const targets = filtered.length ? filtered : ['tests'];
const resolvedTargets = targets.map((entry) => resolve(entry));

const result = spawnSync(process.execPath, ['--test', ...resolvedTargets], {
  stdio: 'inherit'
});

process.exit(result.status ?? 0);
