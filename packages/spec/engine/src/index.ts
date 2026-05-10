import {
  compareSpecVersions,
  isSpecEntityAvailableAt,
  isVersionInRange,
  type SpecEntity,
  type SpecRelationTarget,
  type SpecRelations,
} from '@proto.ui/spec-schema';

export type SpecSnapshot = {
  version: string;
  generatedAt: string;
  entities: SpecEntity[];
};

export type SpecSnapshotDiff = {
  fromVersion: string;
  toVersion: string;
  added: SpecEntity[];
  removed: SpecEntity[];
  revised: Array<{
    before: SpecEntity;
    after: SpecEntity;
    revisions: SpecEntity['revisions'];
  }>;
};

export type SpecWorkspace = {
  entities: SpecEntity[];
};

export function sortSpecEntities(entities: SpecEntity[]): SpecEntity[] {
  return [...entities].sort((a, b) => a.id.localeCompare(b.id));
}

export function createSpecWorkspace(entities: SpecEntity[]): SpecWorkspace {
  const seen = new Set<string>();

  for (const entity of entities) {
    if (seen.has(entity.id)) {
      throw new Error(`Duplicate spec entity ID: ${entity.id}`);
    }

    seen.add(entity.id);
  }

  return { entities: sortSpecEntities(entities) };
}

export function getSpecSnapshot(workspace: SpecWorkspace, version: string): SpecSnapshot {
  return {
    version,
    generatedAt: new Date().toISOString(),
    entities: sortSpecEntities(
      workspace.entities.filter((entity) => isSpecEntityAvailableAt(entity, version))
    ),
  };
}

export function diffSpecSnapshots(from: SpecSnapshot, to: SpecSnapshot): SpecSnapshotDiff {
  const fromById = new Map(from.entities.map((entity) => [entity.id, entity]));
  const toById = new Map(to.entities.map((entity) => [entity.id, entity]));
  const added: SpecEntity[] = [];
  const removed: SpecEntity[] = [];
  const revised: SpecSnapshotDiff['revised'] = [];

  for (const entity of to.entities) {
    const previous = fromById.get(entity.id);

    if (!previous) {
      added.push(entity);
      continue;
    }

    const revisions = entity.revisions.filter(
      (revision) =>
        compareSpecVersions(revision.version, from.version) > 0 &&
        compareSpecVersions(revision.version, to.version) <= 0
    );

    if (revisions.length > 0 || previous.status !== entity.status) {
      revised.push({ before: previous, after: entity, revisions });
    }
  }

  for (const entity of from.entities) {
    if (!toById.has(entity.id)) {
      removed.push(entity);
    }
  }

  return {
    fromVersion: from.version,
    toVersion: to.version,
    added: sortSpecEntities(added),
    removed: sortSpecEntities(removed),
    revised: revised.sort((a, b) => a.after.id.localeCompare(b.after.id)),
  };
}

export function getRelationTargets(relations: SpecRelations | undefined): SpecRelationTarget[] {
  if (!relations) return [];

  return Object.values(relations)
    .flatMap((targets) => targets ?? [])
    .filter(Boolean);
}

export function filterRelationsForVersion(
  relations: SpecRelations | undefined,
  version: string
): SpecRelations {
  if (!relations) return undefined;

  const next: NonNullable<SpecRelations> = {};

  for (const [kind, targets] of Object.entries(relations)) {
    const activeTargets = (targets ?? []).filter((target) => isVersionInRange(version, target));
    if (activeTargets.length > 0) {
      next[kind as keyof NonNullable<SpecRelations>] = activeTargets;
    }
  }

  return Object.keys(next).length > 0 ? next : undefined;
}
