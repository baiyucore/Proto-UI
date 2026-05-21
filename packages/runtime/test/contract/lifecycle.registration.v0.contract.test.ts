import { describe, expect, it } from 'vitest';
import type { DefHandle, Prototype } from '@proto.ui/core';
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
  it('def.lifecycle callbacks are setup-only registrations', async () => {
    const calls: string[] = [];
    let capturedDef!: DefHandle<any>;

    const proto: Prototype = {
      name: 'x-lifecycle-registration',
      setup(def) {
        capturedDef = def;

        expect(() => def.lifecycle.onCreated(() => calls.push('created'))).not.toThrow();
        expect(() => def.lifecycle.onMounted(() => calls.push('mounted'))).not.toThrow();
        expect(() => def.lifecycle.onUpdated(() => calls.push('updated'))).not.toThrow();
        expect(() => def.lifecycle.onUnmounted(() => calls.push('unmounted'))).not.toThrow();

        return (r) => [r.el('div', 'ok')];
      },
    };

    const result = executeWithHost(proto, createHost());
    await Promise.resolve();

    expect(calls).toContain('created');
    expect(calls).toContain('mounted');

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
