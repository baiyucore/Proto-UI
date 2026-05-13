#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { findProtoPackages, getRoot } from './version-utils.mjs';

// publish-single is patch-only by contract — cross-minor releases must go
// through publish-all + VERSION + stamp-version.mjs so all @proto.ui/* packages
// move in lockstep. Keeping a --bump flag here would imply minor is reachable
// from this script, which it intentionally is not.
const args = process.argv.slice(2);
const targets = [];
let preferPublished = false;
let registry = '';
let publishedVersionsFile = '';
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--') continue;
  if (arg === '--prefer-published') {
    preferPublished = true;
    continue;
  }
  if (arg === '--registry') {
    registry = args[++i] ?? '';
    continue;
  }
  if (arg === '--published-versions-file') {
    publishedVersionsFile = args[++i] ?? '';
    preferPublished = true;
    continue;
  }
  targets.push(arg);
}

if (targets.length === 0) {
  console.error('bump-version: at least one package name is required');
  process.exit(1);
}

const all = findProtoPackages();
const byName = new Map(all.map((pkg) => [pkg.manifest.name, pkg]));

// Validate every target before touching disk. If anything is wrong, exit before
// any package.json is rewritten — a half-applied bump would leave the workspace
// in a state that check-lockstep cannot interpret cleanly.
const plan = [];
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
  const localPatch = Number(patch);
  const publishedPatch = preferPublished
    ? highestPublishedPatch(name, major, minor, { registry, publishedVersionsFile })
    : null;
  const basePatch = Math.max(localPatch, publishedPatch ?? -1);
  const next = `${major}.${minor}.${basePatch + 1}`;
  plan.push({ pkg, name, current, next });
}

// All targets validated; apply writes.
const bumped = [];
for (const entry of plan) {
  entry.pkg.manifest.version = entry.next;
  writeFileSync(entry.pkg.manifestPath, `${JSON.stringify(entry.pkg.manifest, null, 2)}\n`);
  console.log(`bumped ${entry.name}: ${entry.current} -> ${entry.next}`);
  bumped.push({ name: entry.name, from: entry.current, to: entry.next });
}

const summaryPath = join(getRoot(), 'release-bump.json');
writeFileSync(summaryPath, `${JSON.stringify({ bumped }, null, 2)}\n`);
console.log(`bump-version: wrote summary to ${summaryPath}`);

function highestPublishedPatch(name, major, minor, options) {
  const versions = loadPublishedVersions(name, options);
  let highest = null;
  for (const version of versions) {
    const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)$/);
    if (!match) continue;
    if (match[1] !== major || match[2] !== minor) continue;
    const patch = Number(match[3]);
    highest = highest == null ? patch : Math.max(highest, patch);
  }
  return highest;
}

function loadPublishedVersions(name, options) {
  if (options.publishedVersionsFile) {
    const data = JSON.parse(readFileSync(options.publishedVersionsFile, 'utf8'));
    return data[name] ?? [];
  }

  const viewArgs = ['view', name, 'versions', '--json'];
  if (options.registry) viewArgs.push('--registry', options.registry);
  const result = spawnSync('npm', viewArgs, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    const output = `${result.stderr}\n${result.stdout}`;
    if (/E404|404 Not Found|not found/i.test(output)) return [];
    console.error(`bump-version: failed to read published versions for ${name}`);
    console.error(output.trim());
    process.exit(1);
  }

  const parsed = JSON.parse(result.stdout || '[]');
  return Array.isArray(parsed) ? parsed : [parsed];
}
