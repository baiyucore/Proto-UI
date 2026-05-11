import type { SpecSnapshot } from '@proto.ui/spec-engine';
import {
  SPEC_RELATION_KINDS,
  type SpecEntity,
  type SpecRelationKind,
  type SpecRelations,
} from '@proto.ui/spec-schema';

export type SpecGraphNode = {
  id: string;
  type: SpecEntity['type'];
  title: string;
  status: SpecEntity['status'];
};

export type SpecGraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: SpecRelationKind;
  relation: keyof NonNullable<SpecRelations>;
  anchors: string[];
};

export type SpecGraph = {
  nodes: SpecGraphNode[];
  edges: SpecGraphEdge[];
};

export function buildSpecGraph(snapshot: SpecSnapshot): SpecGraph {
  const nodes = snapshot.entities.map((entity) => ({
    id: entity.id,
    type: entity.type,
    title: entity.title,
    status: entity.status,
  }));
  const knownIds = new Set(nodes.map((node) => node.id));
  const edges: SpecGraphEdge[] = [];

  for (const entity of snapshot.entities) {
    for (const relationKind of SPEC_RELATION_KINDS) {
      appendEdges(edges, knownIds, entity, relationKind, entity[relationKind]);
    }
  }

  return { nodes, edges };
}

function appendEdges(
  edges: SpecGraphEdge[],
  knownIds: Set<string>,
  entity: SpecEntity,
  kind: SpecRelationKind,
  relations: SpecRelations | undefined
): void {
  if (!relations) return;

  for (const [relation, targets] of Object.entries(relations)) {
    for (const target of targets ?? []) {
      if (!knownIds.has(target.id)) continue;

      edges.push({
        id: `${entity.id}:${kind}:${relation}:${target.id}`,
        from: entity.id,
        to: target.id,
        kind,
        relation: relation as keyof NonNullable<SpecRelations>,
        anchors: target.anchors ?? [],
      });
    }
  }
}
