import path from 'node:path';

import { loadSpecWorkspaceFromDirectory } from '@proto.ui/spec-engine/node';
import { EXPOSE_EVENT_CASES } from '@proto.ui/spec-fixtures/expose/event';
import { EXPOSE_STATE_CASES } from '@proto.ui/spec-fixtures/expose/state';
import { EXPOSE_SURFACE_CASES } from '@proto.ui/spec-fixtures/expose/surfaces';
import { describe, expect, it } from 'vitest';

type FixtureCase = {
  id: string;
  specCase: string;
  covers: readonly string[];
};

function assertFixtureAlignment(
  workspace: Awaited<ReturnType<typeof loadSpecWorkspaceFromDirectory>>,
  testId: string,
  fixtureId: string,
  fixturePath: string,
  cases: readonly FixtureCase[]
) {
  const testSpec = workspace.entities.find((entity) => entity.id === testId);
  expect(testSpec).toBeDefined();
  expect(testSpec?.type).toBe('test');

  const specCaseIds = new Set<string>(testSpec?.cases.map((testCase) => testCase.id));
  const fixtureSpecCases = new Set<string>(cases.map((testCase) => testCase.specCase));

  for (const testCase of cases) {
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
    (implementation) => implementation.id === fixtureId
  );

  expect(fixtureImplementation?.status).toBe('active');
  expect(fixtureImplementation?.path).toBe(fixturePath);
  expect(new Set(fixtureImplementation?.consumesCases ?? [])).toEqual(specCaseIds);
}

describe('spec fixtures: expose', () => {
  it('keeps expose surface fixtures aligned with T-EXPOSE-0001', async () => {
    const workspace = await loadSpecWorkspaceFromDirectory(path.resolve(process.cwd(), 'spec'));
    expect(workspace.issues).toEqual([]);

    assertFixtureAlignment(
      workspace,
      'T-EXPOSE-0001',
      'expose-surface-fixture',
      'packages/spec/fixtures/src/expose/surfaces.ts',
      EXPOSE_SURFACE_CASES
    );
  });

  it('keeps expose event fixtures aligned with T-EXPOSE-EVENT-0001', async () => {
    const workspace = await loadSpecWorkspaceFromDirectory(path.resolve(process.cwd(), 'spec'));
    expect(workspace.issues).toEqual([]);

    assertFixtureAlignment(
      workspace,
      'T-EXPOSE-EVENT-0001',
      'expose-event-fixture',
      'packages/spec/fixtures/src/expose/event.ts',
      EXPOSE_EVENT_CASES
    );
  });

  it('keeps expose-state fixtures aligned with T-EXPOSE-STATE-0001', async () => {
    const workspace = await loadSpecWorkspaceFromDirectory(path.resolve(process.cwd(), 'spec'));
    expect(workspace.issues).toEqual([]);

    assertFixtureAlignment(
      workspace,
      'T-EXPOSE-STATE-0001',
      'expose-state-fixture',
      'packages/spec/fixtures/src/expose/state.ts',
      EXPOSE_STATE_CASES
    );
  });
});
