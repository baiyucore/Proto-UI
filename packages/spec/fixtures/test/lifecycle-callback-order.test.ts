import path from 'node:path';

import { loadSpecWorkspaceFromDirectory } from '@proto.ui/spec-engine/node';
import { LIFECYCLE_CALLBACK_ORDER_CASES } from '@proto.ui/spec-fixtures/lifecycle/callback-order';
import { describe, expect, it } from 'vitest';

describe('spec fixtures: lifecycle callback order', () => {
  it('stays aligned with T-LIFECYCLE-0001 and C-LIFECYCLE-0002', async () => {
    const workspace = await loadSpecWorkspaceFromDirectory(path.resolve(process.cwd(), 'spec'));
    expect(workspace.issues).toEqual([]);

    const testSpec = workspace.entities.find((entity) => entity.id === 'T-LIFECYCLE-0001');
    const contract = workspace.entities.find((entity) => entity.id === 'C-LIFECYCLE-0002');

    expect(testSpec).toBeDefined();
    expect(contract).toBeDefined();
    expect(testSpec?.type).toBe('test');
    expect(contract?.type).toBe('contract');

    const specCaseIds = new Set<string>(testSpec?.cases.map((testCase) => testCase.id));
    const criteriaIds = new Set<string>(contract?.criteria.map((criterion) => criterion.id));
    const fixtureSpecCases = new Set<string>(
      LIFECYCLE_CALLBACK_ORDER_CASES.map((testCase) => testCase.specCase)
    );

    for (const testCase of LIFECYCLE_CALLBACK_ORDER_CASES) {
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
      (implementation) => implementation.id === 'lifecycle-callback-order-fixture'
    );

    expect(fixtureImplementation).toBeDefined();
    expect(fixtureImplementation?.status).toBe('active');
    expect(fixtureImplementation?.path).toBe(
      'packages/spec/fixtures/src/lifecycle/callback-order.ts'
    );
    expect(new Set(fixtureImplementation?.consumesCases ?? [])).toEqual(specCaseIds);
  });
});
