import { definePrototype, type Prototype, type RunHandle } from '@proto.ui/core';
import { describe, expect, it } from 'vitest';

type SnapshotPhase = 'mounted' | 'updated';

type SnapshotObservation = {
  phase: SnapshotPhase;
  resolved: Record<string, unknown>;
  raw: Record<string, unknown>;
  provided: Record<string, boolean>;
};

export type AdapterResolvedSnapshotMounted = {
  updateProps(nextProps: Record<string, unknown>): void | Promise<void>;
  unmount(): void | Promise<void>;
};

export type AdapterResolvedSnapshotHarness = {
  adapterName: string;
  mount(
    proto: Prototype<any>,
    props: Record<string, unknown>
  ): AdapterResolvedSnapshotMounted | Promise<AdapterResolvedSnapshotMounted>;
};

function latestObservation(
  observations: SnapshotObservation[],
  phase?: SnapshotPhase
): SnapshotObservation | undefined {
  for (let index = observations.length - 1; index >= 0; index -= 1) {
    const observation = observations[index];
    if (!phase || observation?.phase === phase) return observation;
  }
  return undefined;
}

function observeProps(
  phase: SnapshotPhase,
  run: RunHandle<any>,
  keys: string[],
  observations: SnapshotObservation[]
) {
  const resolved = run.props.get() as Record<string, unknown>;
  const raw = run.props.getRaw() as Record<string, unknown>;

  observations.push({
    phase,
    resolved,
    raw,
    provided: Object.fromEntries(keys.map((key) => [key, run.props.isProvided(key)])),
  });
}

function createObservedPrototype(args: {
  name: string;
  props: Record<string, unknown>;
  providedKeys: string[];
  observations: SnapshotObservation[];
}) {
  const { name, props, providedKeys, observations } = args;

  return definePrototype<any>({
    name,
    setup(def) {
      def.props.define(props as any);

      const observe = (phase: SnapshotPhase, run: RunHandle<any>) => {
        observeProps(phase, run, providedKeys, observations);
      };

      def.lifecycle.onMounted((run) => observe('mounted', run));
      def.lifecycle.onUpdated((run) => observe('updated', run));

      return (renderer) => [renderer.el('div', `${name}:ready`)];
    },
  });
}

export function describeAdapterResolvedSnapshotShapeConformance(
  harness: AdapterResolvedSnapshotHarness
) {
  describe(`${harness.adapterName}: adapter resolved props snapshot shape conformance`, () => {
    it('mount path preserves declared-key resolved snapshot shape', async () => {
      const observations: SnapshotObservation[] = [];
      const proto = createObservedPrototype({
        name: `${harness.adapterName}-resolved-snapshot-declared-keys`,
        props: {
          present: { type: 'number' },
          missingWithDefault: { type: 'string', default: 'fallback' },
          missingEmpty: { type: 'boolean' },
        },
        providedKeys: ['present', 'missingWithDefault', 'missingEmpty'],
        observations,
      });

      const mounted = await harness.mount(proto, { present: 1 });

      try {
        const observation = latestObservation(observations);

        expect(observation?.resolved).toEqual({
          present: 1,
          missingWithDefault: 'fallback',
          missingEmpty: null,
        });
        expect(observation?.provided).toEqual({
          present: true,
          missingWithDefault: false,
          missingEmpty: false,
        });
      } finally {
        await mounted.unmount();
      }
    });

    it('update path excludes undeclared raw keys from resolved props', async () => {
      const observations: SnapshotObservation[] = [];
      const proto = createObservedPrototype({
        name: `${harness.adapterName}-resolved-snapshot-undeclared-keys`,
        props: {
          declared: { type: 'number' },
        },
        providedKeys: ['declared', 'extra'],
        observations,
      });

      const mounted = await harness.mount(proto, { declared: 1 });

      try {
        await mounted.updateProps({ declared: 2, extra: 9 });

        const observation = latestObservation(observations, 'updated');

        expect(observation?.resolved).toEqual({ declared: 2 });
        expect(observation?.resolved).not.toHaveProperty('extra');
        expect(observation?.raw).toEqual({ declared: 2, extra: 9 });
        expect(observation?.provided).toEqual({ declared: true, extra: true });
      } finally {
        await mounted.unmount();
      }
    });

    it('update path resolves each key independently', async () => {
      const observations: SnapshotObservation[] = [];
      const proto = createObservedPrototype({
        name: `${harness.adapterName}-resolved-snapshot-key-granularity`,
        props: {
          valid: { type: 'number' },
          missing: { type: 'string', default: 'missing-fallback' },
          empty: { type: 'number', empty: 'accept' },
          invalid: { type: 'boolean', default: true },
        },
        providedKeys: ['valid', 'missing', 'empty', 'invalid'],
        observations,
      });

      const mounted = await harness.mount(proto, {
        valid: 1,
        missing: 'initial',
        empty: 2,
        invalid: false,
      });

      try {
        await mounted.updateProps({
          valid: 42,
          empty: null,
          invalid: 'not-boolean',
        });

        const observation = latestObservation(observations, 'updated');

        expect(observation?.resolved).toEqual({
          valid: 42,
          missing: 'initial',
          empty: null,
          invalid: false,
        });
      } finally {
        await mounted.unmount();
      }
    });

    it('update path does not expose undefined and normalizes empty values to null', async () => {
      const observations: SnapshotObservation[] = [];
      const proto = createObservedPrototype({
        name: `${harness.adapterName}-resolved-snapshot-empty-normalization`,
        props: {
          missing: { type: 'string' },
          providedUndefined: { type: 'number', empty: 'accept' },
          providedNull: { type: 'boolean', empty: 'accept' },
        },
        providedKeys: ['missing', 'providedUndefined', 'providedNull'],
        observations,
      });

      const mounted = await harness.mount(proto, {
        providedUndefined: 1,
        providedNull: true,
      });

      try {
        await mounted.updateProps({
          providedUndefined: undefined,
          providedNull: null,
        });

        const observation = latestObservation(observations, 'updated');

        expect(observation?.resolved).toEqual({
          missing: null,
          providedUndefined: null,
          providedNull: null,
        });
        expect(Object.values(observation?.resolved ?? {})).not.toContain(undefined);
        expect(observation?.raw).toEqual({
          providedUndefined: null,
          providedNull: null,
        });
      } finally {
        await mounted.unmount();
      }
    });
  });
}
