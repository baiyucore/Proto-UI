import path from 'node:path';

import { loadSpecWorkspaceFromDirectory } from '@proto.ui/spec-engine/node';
import { PROTOTYPE_RENDER_SYNTAX_CASES } from '@proto.ui/spec-fixtures/core/prototype-render-syntax';
import { describe, expect, it } from 'vitest';

describe('spec fixtures: prototype render syntax', () => {
  it('stays aligned with T-CORE-SYNTAX-0001 and covered contracts', async () => {
    const workspace = await loadSpecWorkspaceFromDirectory(path.resolve(process.cwd(), 'spec'));
    expect(workspace.issues).toEqual([]);

    const testSpec = workspace.entities.find((entity) => entity.id === 'T-CORE-SYNTAX-0001');
    expect(testSpec).toBeDefined();
    expect(testSpec?.type).toBe('test');

    const contracts = new Map(
      workspace.entities
        .filter((entity) => entity.type === 'contract')
        .map((entity) => [entity.id, new Set(entity.criteria.map((criterion) => criterion.id))])
    );

    const specCaseIds = new Set<string>(testSpec?.cases.map((testCase) => testCase.id));
    const fixtureSpecCases = new Set<string>(
      PROTOTYPE_RENDER_SYNTAX_CASES.map((testCase) => testCase.specCase)
    );

    for (const testCase of PROTOTYPE_RENDER_SYNTAX_CASES) {
      expect(
        specCaseIds.has(testCase.specCase),
        `${testCase.id} references ${testCase.specCase}`
      ).toBe(true);

      for (const criterionId of testCase.covers) {
        const contractId = criterionId.replace(/-[A-Z]+$/, '');
        expect(
          contracts.get(contractId)?.has(criterionId),
          `${testCase.id} covers ${criterionId}`
        ).toBe(true);
      }
    }

    for (const specCaseId of specCaseIds) {
      expect(fixtureSpecCases.has(specCaseId), `${specCaseId} should have fixture coverage`).toBe(
        true
      );
    }

    const fixtureImplementation = testSpec?.implementations.find(
      (implementation) => implementation.id === 'core-prototype-render-syntax-fixture'
    );

    expect(fixtureImplementation).toBeDefined();
    expect(fixtureImplementation?.status).toBe('active');
    expect(fixtureImplementation?.path).toBe(
      'packages/spec/fixtures/src/core/prototype-render-syntax.ts'
    );
    expect(new Set(fixtureImplementation?.consumesCases ?? [])).toEqual(specCaseIds);
  });
});
