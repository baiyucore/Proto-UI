import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = resolve(__dirname, '..', 'bump-version.mjs');

function makeFixture(layout) {
  const root = mkdtempSync(join(tmpdir(), 'proto-bump-'));
  writeFileSync(join(root, 'VERSION'), `${layout.version}\n`);
  const packagesDir = join(root, 'packages');
  mkdirSync(packagesDir, { recursive: true });
  for (const pkg of layout.packages) {
    const dir = join(packagesDir, ...pkg.relPath.split('/'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'package.json'),
      `${JSON.stringify({ name: pkg.name, version: pkg.version }, null, 2)}\n`
    );
  }
  return root;
}

function runBump(root, args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: root,
    env: { ...process.env, PROTO_RELEASE_ROOT: root },
    encoding: 'utf8',
  });
}

function readManifestVersion(root, relPath) {
  const path = join(root, 'packages', ...relPath.split('/'), 'package.json');
  return JSON.parse(readFileSync(path, 'utf8')).version;
}

test('bumps a single package by patch by default', () => {
  const root = makeFixture({
    version: '0.1.0',
    packages: [{ relPath: 'cli', name: '@proto.ui/cli', version: '0.1.0' }],
  });
  try {
    const result = runBump(root, ['@proto.ui/cli']);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(readManifestVersion(root, 'cli'), '0.1.1');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('bumps multiple packages by patch', () => {
  const root = makeFixture({
    version: '0.1.0',
    packages: [
      { relPath: 'cli', name: '@proto.ui/cli', version: '0.1.5' },
      { relPath: 'core', name: '@proto.ui/core', version: '0.1.0' },
    ],
  });
  try {
    const result = runBump(root, ['@proto.ui/cli', '@proto.ui/core']);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(readManifestVersion(root, 'cli'), '0.1.6');
    assert.equal(readManifestVersion(root, 'core'), '0.1.1');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('prefers the highest published patch in the same minor when requested', () => {
  const root = makeFixture({
    version: '0.1.0',
    packages: [{ relPath: 'cli', name: '@proto.ui/cli', version: '0.1.1' }],
  });
  try {
    const versionsPath = join(root, 'published-versions.json');
    writeFileSync(
      versionsPath,
      `${JSON.stringify({ '@proto.ui/cli': ['0.1.0', '0.1.2', '0.2.0'] }, null, 2)}\n`
    );

    const result = runBump(root, [
      '--prefer-published',
      '--published-versions-file',
      versionsPath,
      '--',
      '@proto.ui/cli',
    ]);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(readManifestVersion(root, 'cli'), '0.1.3');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('writes release-bump.json summary in cwd', () => {
  const root = makeFixture({
    version: '0.1.0',
    packages: [
      { relPath: 'cli', name: '@proto.ui/cli', version: '0.1.0' },
      { relPath: 'core', name: '@proto.ui/core', version: '0.1.3' },
    ],
  });
  try {
    runBump(root, ['@proto.ui/cli', '@proto.ui/core']);
    const summary = JSON.parse(readFileSync(join(root, 'release-bump.json'), 'utf8'));
    assert.deepEqual(
      summary.bumped.sort((a, b) => a.name.localeCompare(b.name)),
      [
        { name: '@proto.ui/cli', from: '0.1.0', to: '0.1.1' },
        { name: '@proto.ui/core', from: '0.1.3', to: '0.1.4' },
      ]
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fails on unknown package', () => {
  const root = makeFixture({
    version: '0.1.0',
    packages: [{ relPath: 'cli', name: '@proto.ui/cli', version: '0.1.0' }],
  });
  try {
    const result = runBump(root, ['@proto.ui/does-not-exist']);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unknown/i);
    assert.ok(!existsSync(join(root, 'release-bump.json')), 'should not write summary on failure');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fails when no targets given', () => {
  const root = makeFixture({
    version: '0.1.0',
    packages: [{ relPath: 'cli', name: '@proto.ui/cli', version: '0.1.0' }],
  });
  try {
    const result = runBump(root, []);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /at least one package/i);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
