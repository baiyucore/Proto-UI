import path from 'node:path';

import { loadSpecWorkspaceFromDirectory } from '@proto.ui/spec-engine/node';
import { EVENT_TYPE_PAYLOAD_CASES } from '@proto.ui/spec-fixtures/event/type-payload';
import { describe, expect, it } from 'vitest';

describe('spec fixtures: event type and payload', () => {
  it('stays aligned with T-EVENT-0002 and covered contracts', async () => {
    const workspace = await loadSpecWorkspaceFromDirectory(path.resolve(process.cwd(), 'spec'));
    expect(workspace.issues).toEqual([]);

    const testSpec = workspace.entities.find((entity) => entity.id === 'T-EVENT-0002');
    expect(testSpec).toBeDefined();
    expect(testSpec?.type).toBe('test');

    const specCaseIds = new Set<string>(testSpec?.cases.map((testCase) => testCase.id));
    const fixtureSpecCases = new Set<string>(
      EVENT_TYPE_PAYLOAD_CASES.map((testCase) => testCase.specCase)
    );

    for (const testCase of EVENT_TYPE_PAYLOAD_CASES) {
      expect(
        specCaseIds.has(testCase.specCase),
        `${testCase.id} references ${testCase.specCase}`
      ).toBe(true);

      for (const criterionId of testCase.covers) {
        const contractId = criterionId.replace(/-[A-Z]$/, '');
        const contract = workspace.entities.find((entity) => entity.id === contractId);
        expect(contract, `${testCase.id} references ${contractId}`).toBeDefined();
        expect(
          contract?.criteria.some((criterion) => criterion.id === criterionId),
          `${testCase.id} covers ${criterionId}`
        ).toBe(true);
      }
    }

    expect(fixtureSpecCases).toEqual(specCaseIds);

    const fixtureImplementation = testSpec?.implementations.find(
      (implementation) => implementation.id === 'event-type-payload-fixture'
    );

    expect(fixtureImplementation?.status).toBe('active');
    expect(fixtureImplementation?.path).toBe('packages/spec/fixtures/src/event/type-payload.ts');
    expect(new Set(fixtureImplementation?.consumesCases ?? [])).toEqual(specCaseIds);
  });
});
