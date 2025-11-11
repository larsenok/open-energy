import { chmod, cp, mkdir, readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const nodeModules = join(root, 'node_modules');
const binDir = join(nodeModules, '.bin');
const stubs = ['vitest', 'eslint', 'prettier', 'eslint-config-prettier', 'eslint-plugin-prettier'];

async function ensureDir(path) {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function copyStub(name) {
  const source = join(root, 'tools', 'stubs', name);
  const target = join(nodeModules, name);
  if (!(await exists(source))) {
    throw new Error(`Stub package not found: ${name}`);
  }
  await cp(source, target, { recursive: true, force: true });

  const pkgFile = join(source, 'package.json');
  if (!(await exists(pkgFile))) {
    return;
  }
  const pkg = JSON.parse(await readFile(pkgFile, 'utf8'));
  if (!pkg.bin) {
    return;
  }

  await ensureDir(binDir);
  for (const [command, relative] of Object.entries(pkg.bin)) {
    const sourceBin = join(target, relative);
    const destination = join(binDir, command);
    await cp(sourceBin, destination, { recursive: true, force: true });
    await chmod(destination, 0o755);
  }
}

await ensureDir(nodeModules);
for (const name of stubs) {
  await copyStub(name);
}
