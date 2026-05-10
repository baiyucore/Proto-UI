import { z } from 'zod';

export const SPEC_ENTITY_TYPES = [
  'contract',
  'module',
  'decision',
  'host-cap',
  'test',
  'version',
  'knowledge',
] as const;

export const SPEC_ENTITY_PREFIXES = {
  contract: 'C',
  module: 'M',
  decision: 'D',
  'host-cap': 'HC',
  test: 'T',
  version: 'V',
  knowledge: 'K',
} as const satisfies Record<SpecEntityType, string>;

export const SPEC_ENTITY_STATUSES = ['draft', 'active', 'deprecated', 'removed'] as const;

export type SpecEntityType = (typeof SPEC_ENTITY_TYPES)[number];
export type SpecEntityStatus = (typeof SPEC_ENTITY_STATUSES)[number];

export type SpecIdParts = {
  id: string;
  prefix: string;
  domain: string;
  number: number;
};

const specIdPattern = /^(C|M|D|HC|T|V|K)-([A-Z0-9]+(?:-[A-Z0-9]+)*)-(\d{4})$/;
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export const specVersionSchema = z.string().regex(semverPattern, 'Expected a semver version.');

export const specRelationTargetSchema = z
  .union([
    z.string(),
    z.object({
      id: z.string(),
      since: specVersionSchema.optional(),
      until: specVersionSchema.optional(),
      note: z.string().optional(),
    }),
  ])
  .transform((value) => (typeof value === 'string' ? { id: value } : value));

export const specRelationsSchema = z
  .object({
    contracts: z.array(specRelationTargetSchema).optional(),
    modules: z.array(specRelationTargetSchema).optional(),
    decisions: z.array(specRelationTargetSchema).optional(),
    hostCaps: z.array(specRelationTargetSchema).optional(),
    tests: z.array(specRelationTargetSchema).optional(),
    knowledge: z.array(specRelationTargetSchema).optional(),
  })
  .partial()
  .optional();

export const specRevisionSchema = z.object({
  version: specVersionSchema,
  change: z.string().min(1),
  summary: z.string().optional(),
  breaking: z.boolean().optional(),
});

export const specSourceRefSchema = z.object({
  path: z.string().min(1),
  label: z.string().optional(),
  sections: z.array(z.string()).optional(),
});

export const specEntitySchema = z
  .object({
    id: z.string().regex(specIdPattern, 'Expected a Proto UI spec ID.'),
    type: z.enum(SPEC_ENTITY_TYPES),
    title: z.string().min(1),
    status: z.enum(SPEC_ENTITY_STATUSES).default('draft'),
    since: specVersionSchema,
    deprecatedSince: specVersionSchema.optional(),
    removedSince: specVersionSchema.optional(),
    replacedBy: z.string().optional(),
    summary: z.string().optional(),
    notes: z.string().optional(),
    sources: z.array(specSourceRefSchema).default([]),
    relates: specRelationsSchema,
    requires: specRelationsSchema,
    verifies: specRelationsSchema,
    revisions: z.array(specRevisionSchema).default([]),
    tags: z.array(z.string()).default([]),
  })
  .superRefine((entity, context) => {
    const parts = parseSpecId(entity.id);
    const expectedPrefix = SPEC_ENTITY_PREFIXES[entity.type];

    if (parts.prefix !== expectedPrefix) {
      context.addIssue({
        code: 'custom',
        path: ['id'],
        message: `ID prefix ${parts.prefix} does not match entity type ${entity.type}.`,
      });
    }

    if (entity.status === 'deprecated' && !entity.deprecatedSince) {
      context.addIssue({
        code: 'custom',
        path: ['deprecatedSince'],
        message: 'Deprecated entities must set deprecatedSince.',
      });
    }

    if (entity.status === 'removed' && !entity.removedSince) {
      context.addIssue({
        code: 'custom',
        path: ['removedSince'],
        message: 'Removed entities must set removedSince.',
      });
    }
  });

export type SpecRelationTarget = z.infer<typeof specRelationTargetSchema>;
export type SpecRelations = z.infer<typeof specRelationsSchema>;
export type SpecRevision = z.infer<typeof specRevisionSchema>;
export type SpecSourceRef = z.infer<typeof specSourceRefSchema>;
export type SpecEntity = z.infer<typeof specEntitySchema>;

export type SpecValidationIssue = {
  filePath?: string;
  message: string;
};

export function parseSpecId(id: string): SpecIdParts {
  const match = specIdPattern.exec(id);

  if (!match) {
    throw new Error(`Invalid Proto UI spec ID: ${id}`);
  }

  return {
    id,
    prefix: match[1],
    domain: match[2],
    number: Number(match[3]),
  };
}

export function getSpecDomain(id: string): string {
  return parseSpecId(id).domain;
}

export function validateSpecEntity(input: unknown): SpecEntity {
  return specEntitySchema.parse(input);
}

export function compareSpecVersions(a: string, b: string): number {
  const [aCore, aPre] = a.split('-', 2);
  const [bCore, bPre] = b.split('-', 2);
  const aParts = aCore.split('.').map(Number);
  const bParts = bCore.split('.').map(Number);

  for (let index = 0; index < 3; index += 1) {
    const diff = aParts[index] - bParts[index];
    if (diff !== 0) return diff;
  }

  if (!aPre && bPre) return 1;
  if (aPre && !bPre) return -1;
  if (!aPre && !bPre) return 0;

  return aPre.localeCompare(bPre);
}

export function isVersionInRange(
  version: string,
  range: { since?: string; until?: string }
): boolean {
  if (range.since && compareSpecVersions(version, range.since) < 0) return false;
  if (range.until && compareSpecVersions(version, range.until) >= 0) return false;
  return true;
}

export function isSpecEntityAvailableAt(entity: SpecEntity, version: string): boolean {
  if (compareSpecVersions(version, entity.since) < 0) return false;
  if (entity.removedSince && compareSpecVersions(version, entity.removedSince) >= 0) return false;
  return true;
}
