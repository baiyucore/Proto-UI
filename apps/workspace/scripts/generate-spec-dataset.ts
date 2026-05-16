import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getSpecSnapshot } from '@proto.ui/spec-engine';
import { loadSpecWorkspaceFromDirectory } from '@proto.ui/spec-engine/node';

const appDir = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const repoRoot = path.resolve(appDir, '../..');
const specDir = path.join(repoRoot, 'spec');
const outDir = path.join(appDir, 'public');
const outFile = path.join(outDir, 'spec-workspace.json');

const workspace = await loadSpecWorkspaceFromDirectory(specDir);
const versions = collectVersions(workspace.entities);
const latestVersion = versions.at(-1) ?? '0.1.0';
const latestSnapshot = getSpecSnapshot(workspace, latestVersion);

await mkdir(outDir, { recursive: true });
await writeFile(
  outFile,
  `${JSON.stringify(
    {
      generatedAt: latestSnapshot.generatedAt,
      versions,
      latestVersion,
      entities: workspace.entities,
      issues: workspace.issues,
    },
    null,
    2
  )}\n`
);

if (workspace.issues.length > 0) {
  console.warn(`[spec] generated with ${workspace.issues.length} validation issue(s)`);
} else {
  console.log(
    `[spec] generated ${path.relative(repoRoot, outFile)} from ${workspace.entities.length} entities`
  );
}

function collectVersions(entities: typeof workspace.entities): string[] {
  const versions = new Set<string>();

  for (const entity of entities) {
    versions.add(entity.since);
    if (entity.deprecatedSince) versions.add(entity.deprecatedSince);
    if (entity.removedSince) versions.add(entity.removedSince);

    for (const revision of entity.revisions) {
      versions.add(revision.version);
    }
  }

  return [...versions].sort((a, b) => compareVersions(a, b));
}

function compareVersions(a: string, b: string): number {
  const aParts = a.split('-', 1)[0].split('.').map(Number);
  const bParts = b.split('-', 1)[0].split('.').map(Number);

  for (let index = 0; index < 3; index += 1) {
    const diff = aParts[index] - bParts[index];
    if (diff !== 0) return diff;
  }

  return a.localeCompare(b);
}
