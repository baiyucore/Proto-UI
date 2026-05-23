import { describe, expect, it } from 'vitest';
import type { DefHandle, Prototype, RunHandle } from '@proto.ui/core';
import { executeWithHost, type RuntimeHost } from '../../src';

function createHost(): RuntimeHost<any> {
  return {
    prototypeName: 'x-lifecycle-registration',
    getRawProps: () => ({}),
    commit(_children, signal) {
      signal?.done();
    },
    schedule(task) {
      task();
    },
  };
}

describe('runtime contract: lifecycle registration (v0)', () => {
  it('def.lifecycle exposes the v0 setup-only registration surface', async () => {
    const calls: string[] = [];
    const callbackRuns: Array<RunHandle<any>> = [];
    const registrationReturns: unknown[] = [];
    let capturedDef!: DefHandle<any>;

    const proto: Prototype = {
      name: 'x-lifecycle-registration',
      setup(def) {
        capturedDef = def;

        expect(Object.keys(def.lifecycle).sort()).toEqual([
          'onCreated',
          'onMounted',
          'onUnmounted',
          'onUpdated',
        ]);

        expect(() => {
          registrationReturns.push(
            def.lifecycle.onCreated((run) => {
              callbackRuns.push(run);
              calls.push('created');
            })
          );
          registrationReturns.push(
            def.lifecycle.onMounted((run) => {
              callbackRuns.push(run);
              calls.push('mounted');
            })
          );
          registrationReturns.push(
            def.lifecycle.onUpdated((run) => {
              callbackRuns.push(run);
              calls.push('updated');
            })
          );
          registrationReturns.push(
            def.lifecycle.onUnmounted((run) => {
              callbackRuns.push(run);
              calls.push('unmounted');
            })
          );
        }).not.toThrow();

        expect(calls).toEqual([]);
        expect(registrationReturns).toEqual([undefined, undefined, undefined, undefined]);

        return (r) => [r.el('div', 'ok')];
      },
    };

    const result = executeWithHost(proto, createHost());
    await Promise.resolve();

    expect(calls).toContain('created');
    expect(calls).toContain('mounted');
    expect(callbackRuns.length).toBeGreaterThanOrEqual(2);
    expect(callbackRuns.every((run) => run && typeof run.update === 'function')).toBe(true);

    expect(() => capturedDef.lifecycle.onCreated(() => undefined)).toThrow(/phase/i);
    expect(() => capturedDef.lifecycle.onMounted(() => undefined)).toThrow(/phase/i);
    expect(() => capturedDef.lifecycle.onUpdated(() => undefined)).toThrow(/phase/i);
    expect(() => capturedDef.lifecycle.onUnmounted(() => undefined)).toThrow(/phase/i);

    result.controller.update();
    expect(calls).toContain('updated');

    await result.invokeUnmounted();
    expect(calls).toContain('unmounted');
  });
});
