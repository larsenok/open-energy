import { mkdir, rm, writeFile } from 'node:fs/promises';
import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateEnergyData } from './src/data/energy.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, 'dist');
const PUBLIC_DIR = join(__dirname, 'public');

function copyRecursive(src, dest) {
  if (!existsSync(src)) {
    return;
  }
  const stats = statSync(src);
  if (stats.isDirectory()) {
    if (!existsSync(dest)) {
      mkdir(dest, { recursive: true });
    }
    for (const entry of readdirSync(src)) {
      copyRecursive(join(src, entry), join(dest, entry));
    }
  } else {
    const parent = dirname(dest);
    if (!existsSync(parent)) {
      mkdir(parent, { recursive: true });
    }
    copyFileSync(src, dest);
  }
}

async function build() {
  if (existsSync(DIST_DIR)) {
    await rm(DIST_DIR, { recursive: true, force: true });
  }
  await mkdir(DIST_DIR, { recursive: true });

  copyRecursive(PUBLIC_DIR, DIST_DIR);

  const { energy, insights, cache } = await generateEnergyData();
  const dataDir = join(DIST_DIR, 'data');
  await mkdir(dataDir, { recursive: true });
  await Promise.all([
    writeFile(join(dataDir, 'energy.json'), JSON.stringify(energy, null, 2), 'utf8'),
    writeFile(join(dataDir, 'insights.json'), JSON.stringify(insights, null, 2), 'utf8'),
    writeFile(join(dataDir, 'open-data-cache.json'), JSON.stringify(cache, null, 2), 'utf8')
  ]);

  console.log(`✓ Built static assets in ${DIST_DIR}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
