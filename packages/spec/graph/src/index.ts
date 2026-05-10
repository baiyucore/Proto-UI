import type { SpecSnapshot } from '@proto.ui/spec-engine';
import type { SpecEntity, SpecRelations } from '@proto.ui/spec-schema';

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
  kind: 'relates' | 'requires' | 'verifies';
  relation: keyof NonNullable<SpecRelations>;
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
    appendEdges(edges, knownIds, entity, 'relates', entity.relates);
    appendEdges(edges, knownIds, entity, 'requires', entity.requires);
    appendEdges(edges, knownIds, entity, 'verifies', entity.verifies);
  }

  return { nodes, edges };
}

function appendEdges(
  edges: SpecGraphEdge[],
  knownIds: Set<string>,
  entity: SpecEntity,
  kind: SpecGraphEdge['kind'],
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
      });
    }
  }
}
