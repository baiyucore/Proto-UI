import { describe, expect, it } from 'vitest';
import type { Prototype } from '@proto.ui/core';
import { CANONICAL_RUNTIME_CHECKPOINTS, type RuntimeCheckpoint } from '@proto.ui/runtime';

import { AdaptToWebComponent, type WebComponentAdapterElement } from '../../src/adapt';

async function flushWebComponentAdapter() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('contract: adapter-web-component / lifecycle checkpoints (v0)', () => {
  it('maps Web Component host commits into canonical lifecycle checkpoints', async () => {
    const trace: RuntimeCheckpoint[] = [];
    const callbacks: string[] = [];

    const proto: Prototype = {
      name: 'x-wc-lifecycle-checkpoints',
      setup(def) {
        def.lifecycle.onCreated(() => callbacks.push('created'));
        def.lifecycle.onMounted(() => callbacks.push('mounted'));
        def.lifecycle.onUpdated(() => callbacks.push('updated'));
        def.lifecycle.onUnmounted(() => callbacks.push('unmounted'));
        return (r) => [r.el('div', 'ok')];
      },
    };

    const Ctor = AdaptToWebComponent(proto, {
      register: false,
      registerAs: proto.name,
      diagnostics: {
        onLifecycleCheckpoint: (cp) => trace.push(cp),
      },
    });

    if (!customElements.get(proto.name)) {
      customElements.define(proto.name, Ctor);
    }

    const el = document.createElement(proto.name) as WebComponentAdapterElement;
    document.body.appendChild(el);
    await flushWebComponentAdapter();

    expect(trace).toEqual([
      'CP0_SETUP_EXIT',
      'CP1_CREATED_CALLBACKS',
      'CP2_LOGICAL_TREE_READY',
      'CP3_COMMIT_START',
      'CP4_COMMIT_DONE',
      'CP5_MOUNTED_CALLBACKS',
    ]);
    expect(callbacks).toEqual(['created', 'mounted']);
    expect(trace.every((cp) => CANONICAL_RUNTIME_CHECKPOINTS.includes(cp))).toBe(true);

    trace.length = 0;

    el.update();

    expect(trace).toEqual(['CP6_UPDATE_RENDER', 'CP7_UPDATE_COMMIT_DONE', 'CP8_UPDATED_CALLBACKS']);
    expect(callbacks).toEqual(['created', 'mounted', 'updated']);

    trace.length = 0;
    el.remove();
    await flushWebComponentAdapter();

    expect(trace).toEqual(['CP9_UNMOUNT_BEGIN', 'CP10_DISPOSE_COMPLETE']);
    expect(callbacks).toEqual(['created', 'mounted', 'updated', 'unmounted']);
  });
});
