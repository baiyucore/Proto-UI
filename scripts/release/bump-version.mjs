#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { findProtoPackages, getRoot } from './version-utils.mjs';

const args = process.argv.slice(2);
let bump = 'patch';
const targets = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--bump') {
    bump = args[++i];
  } else if (args[i] === '--') {
    continue;
  } else {
    targets.push(args[i]);
  }
}

if (targets.length === 0) {
  console.error('bump-version: at least one package name is required');
  process.exit(1);
}
if (!['patch', 'minor'].includes(bump)) {
  console.error(`bump-version: --bump must be patch or minor (got: ${bump})`);
  process.exit(1);
}

const all = findProtoPackages();
const byName = new Map(all.map((pkg) => [pkg.manifest.name, pkg]));

const bumped = [];
for (const name of targets) {
  const pkg = byName.get(name);
  if (!pkg) {
    console.error(`bump-version: unknown package ${name}`);
    process.exit(1);
  }
  const current = pkg.manifest.version || '';
  const match = current.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    console.error(`bump-version: bad version on ${name}: ${current}`);
    process.exit(1);
  }
  const [, major, minor, patch] = match;
  const next =
    bump === 'minor' ? `${major}.${Number(minor) + 1}.0` : `${major}.${minor}.${Number(patch) + 1}`;
  pkg.manifest.version = next;
  writeFileSync(pkg.manifestPath, `${JSON.stringify(pkg.manifest, null, 2)}\n`);
  console.log(`bumped ${name}: ${current} -> ${next}`);
  bumped.push({ name, from: current, to: next });
}

const summaryPath = join(getRoot(), 'release-bump.json');
writeFileSync(summaryPath, `${JSON.stringify({ bumped }, null, 2)}\n`);
console.log(`bump-version: wrote summary to ${summaryPath}`);
