import { definePrototype, type Prototype, type RunHandle } from '@proto.ui/core';
import { JSON_PROPS_VALUE_BOUNDARY_CASES } from '@proto.ui/spec-fixtures/props/json-value-boundary';
import { describe, expect, it } from 'vitest';

const FALLBACK_VALUE = 'adapter-fallback-value';

type BoundaryObservation = {
  phase: 'mounted' | 'updated';
  resolvedValue: unknown;
  rawValue: unknown;
  provided: boolean;
};

export type AdapterPropsBoundaryMounted = {
  updateProps(nextProps: Record<string, unknown>): void | Promise<void>;
  unmount(): void | Promise<void>;
};

export type AdapterPropsBoundaryHarness = {
  adapterName: string;
  mount(
    proto: Prototype<any>,
    props: Record<string, unknown>
  ): AdapterPropsBoundaryMounted | Promise<AdapterPropsBoundaryMounted>;
};

function isPortableValueCase(testCase: (typeof JSON_PROPS_VALUE_BOUNDARY_CASES)[number]): boolean {
  return testCase.expectation === 'accepted-as-portable';
}

function createBoundaryPrototype(args: {
  name: string;
  acceptNull: boolean;
  observations: BoundaryObservation[];
}) {
  const { name, acceptNull, observations } = args;

  return definePrototype<{ value: unknown }>({
    name,
    setup(def) {
      def.props.define({
        value: {
          type: 'any',
          default: FALLBACK_VALUE,
          empty: acceptNull ? 'accept' : 'fallback',
        },
      });

      const observe = (phase: BoundaryObservation['phase'], run: RunHandle<{ value: unknown }>) => {
        observations.push({
          phase,
          resolvedValue: run.props.get().value,
          rawValue: run.props.getRaw().value,
          provided: run.props.isProvided('value'),
        });
      };

      def.lifecycle.onMounted((run) => observe('mounted', run));
      def.lifecycle.onUpdated((run) => observe('updated', run));

      return (renderer) => [renderer.el('div', `${name}:ready`)];
    },
  });
}

function expectBoundaryObservation(
  observation: BoundaryObservation | undefined,
  value: unknown,
  testCase: (typeof JSON_PROPS_VALUE_BOUNDARY_CASES)[number]
) {
  expect(observation, `${testCase.id} should produce an adapter observation`).toBeDefined();
  expect(observation?.provided).toBe(true);

  if (isPortableValueCase(testCase)) {
    expect(observation?.resolvedValue).toEqual(value);
    return;
  }

  expect(observation?.resolvedValue).toBe(FALLBACK_VALUE);

  if (testCase.expectation === 'raw-observable-but-not-portable') {
    expect(observation?.rawValue).toBe(value);
  }
}

function lastObservation(
  observations: BoundaryObservation[],
  phase: BoundaryObservation['phase']
): BoundaryObservation | undefined {
  for (let index = observations.length - 1; index >= 0; index -= 1) {
    const observation = observations[index];
    if (observation?.phase === phase) return observation;
  }
  return undefined;
}

function latestObservation(observations: BoundaryObservation[]): BoundaryObservation | undefined {
  return observations[observations.length - 1];
}

export function describeAdapterPropsJsonValueBoundaryConformance(
  harness: AdapterPropsBoundaryHarness
) {
  describe(`${harness.adapterName}: adapter props JSON value boundary conformance`, () => {
    for (const testCase of JSON_PROPS_VALUE_BOUNDARY_CASES) {
      it(`${testCase.id}: passes host props through mount without expanding resolved props semantics`, async () => {
        const value = testCase.createValue();
        const observations: BoundaryObservation[] = [];
        const proto = createBoundaryPrototype({
          name: `${harness.adapterName}-props-json-value-boundary-mount-${testCase.id}`,
          acceptNull: testCase.id === 'json-primitive-null',
          observations,
        });

        const mounted = await harness.mount(proto, { value });

        try {
          expectBoundaryObservation(latestObservation(observations), value, testCase);
        } finally {
          await mounted.unmount();
        }
      });

      it(`${testCase.id}: passes host props through update without expanding resolved props semantics`, async () => {
        const value = testCase.createValue();
        const observations: BoundaryObservation[] = [];
        const proto = createBoundaryPrototype({
          name: `${harness.adapterName}-props-json-value-boundary-update-${testCase.id}`,
          acceptNull: testCase.id === 'json-primitive-null',
          observations,
        });

        const mounted = await harness.mount(proto, {});

        try {
          await mounted.updateProps({ value });

          const updateObservation = lastObservation(observations, 'updated');
          expectBoundaryObservation(updateObservation, value, testCase);
        } finally {
          await mounted.unmount();
        }
      });
    }
  });
}
