import { describe, expect, it } from 'vitest';
import type { Prototype } from '@proto.ui/core';
import { CANONICAL_RUNTIME_CHECKPOINTS, type RuntimeCheckpoint } from '@proto.ui/runtime';

import { createVueAdapter, type VueAdapterHandle } from '../../src/adapt';
import { flushVue, mountVueAdapter, VueAny } from '../utils/vue';

describe('contract: adapter-vue / lifecycle checkpoints (v0)', () => {
  it('maps Vue host commits into canonical lifecycle checkpoints', async () => {
    const trace: RuntimeCheckpoint[] = [];
    const callbacks: string[] = [];

    const proto: Prototype = {
      name: 'vue-lifecycle-checkpoints',
      setup(def) {
        def.lifecycle.onCreated(() => callbacks.push('created'));
        def.lifecycle.onMounted(() => callbacks.push('mounted'));
        def.lifecycle.onUpdated(() => callbacks.push('updated'));
        def.lifecycle.onUnmounted(() => callbacks.push('unmounted'));
        return (r) => [r.el('div', 'ok')];
      },
    };

    const adapter = createVueAdapter(VueAny);
    const Component = adapter(proto, {
      schedule: (task) => task(),
      diagnostics: {
        onLifecycleCheckpoint: (cp) => trace.push(cp),
      },
    });

    const mounted = mountVueAdapter(Component);
    await flushVue();

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

    (mounted.vm as VueAdapterHandle).update();

    expect(trace).toEqual(['CP6_UPDATE_RENDER']);
    expect(callbacks).toEqual(['created', 'mounted']);

    await flushVue();

    expect(trace).toEqual(['CP6_UPDATE_RENDER', 'CP7_UPDATE_COMMIT_DONE', 'CP8_UPDATED_CALLBACKS']);
    expect(callbacks).toEqual(['created', 'mounted', 'updated']);

    trace.length = 0;
    mounted.unmount();
    await flushVue();

    expect(trace).toEqual(['CP9_UNMOUNT_BEGIN', 'CP10_DISPOSE_COMPLETE']);
    expect(callbacks).toEqual(['created', 'mounted', 'updated', 'unmounted']);
  });
});
