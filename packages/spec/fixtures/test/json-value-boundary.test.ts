import path from 'node:path';

import { loadSpecWorkspaceFromDirectory } from '@proto.ui/spec-engine/node';
import { JSON_PROPS_VALUE_BOUNDARY_CASES } from '@proto.ui/spec-fixtures/props/json-value-boundary';
import { describe, expect, it } from 'vitest';

describe('spec fixtures: JSON props value boundary', () => {
  it('stays aligned with T-PROPS-0001 and C-PROPS-0003', async () => {
    const workspace = await loadSpecWorkspaceFromDirectory(path.resolve(process.cwd(), 'spec'));
    expect(workspace.issues).toEqual([]);

    const testSpec = workspace.entities.find((entity) => entity.id === 'T-PROPS-0001');
    const contract = workspace.entities.find((entity) => entity.id === 'C-PROPS-0003');

    expect(testSpec).toBeDefined();
    expect(contract).toBeDefined();
    expect(testSpec?.type).toBe('test');
    expect(contract?.type).toBe('contract');

    const specCaseIds = new Set<string>(testSpec?.cases.map((testCase) => testCase.id));
    const criteriaIds = new Set<string>(contract?.criteria.map((criterion) => criterion.id));
    const fixtureSpecCases = new Set<string>(
      JSON_PROPS_VALUE_BOUNDARY_CASES.map((testCase) => testCase.specCase)
    );

    for (const testCase of JSON_PROPS_VALUE_BOUNDARY_CASES) {
      expect(
        specCaseIds.has(testCase.specCase),
        `${testCase.id} references ${testCase.specCase}`
      ).toBe(true);

      for (const criterionId of testCase.covers) {
        expect(criteriaIds.has(criterionId), `${testCase.id} covers ${criterionId}`).toBe(true);
      }
    }

    for (const specCaseId of specCaseIds) {
      expect(fixtureSpecCases.has(specCaseId), `${specCaseId} should have fixture coverage`).toBe(
        true
      );
    }

    const fixtureImplementation = testSpec?.implementations.find(
      (implementation) => implementation.id === 'props-json-value-boundary-fixture'
    );

    expect(fixtureImplementation).toBeDefined();
    expect(fixtureImplementation?.status).toBe('active');
    expect(fixtureImplementation?.path).toBe(
      'packages/spec/fixtures/src/props/json-value-boundary.ts'
    );
    expect(new Set(fixtureImplementation?.consumesCases ?? [])).toEqual(specCaseIds);
  });
});
