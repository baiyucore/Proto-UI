import { describe, expect, it } from 'vitest';
import type { Prototype } from '@proto.ui/core';
import {
  CANONICAL_RUNTIME_CHECKPOINTS,
  executeWithHost,
  type RuntimeCheckpoint,
  type RuntimeHost,
} from '../../src';

describe('contract: runtime / lifecycle canonical checkpoints (v0)', () => {
  it('exports stable CP0-CP10 canonical checkpoint names', () => {
    expect(CANONICAL_RUNTIME_CHECKPOINTS).toEqual([
      'CP0_SETUP_EXIT',
      'CP1_CREATED_CALLBACKS',
      'CP2_LOGICAL_TREE_READY',
      'CP3_COMMIT_START',
      'CP4_COMMIT_DONE',
      'CP5_MOUNTED_CALLBACKS',
      'CP6_UPDATE_RENDER',
      'CP7_UPDATE_COMMIT_DONE',
      'CP8_UPDATED_CALLBACKS',
      'CP9_UNMOUNT_BEGIN',
      'CP10_DISPOSE_COMPLETE',
    ]);
  });

  it('records initial, update, and dispose flow with canonical checkpoints', async () => {
    const trace: RuntimeCheckpoint[] = [];
    const scheduled: Array<() => void> = [];

    const P: Prototype = {
      name: 'x-lifecycle-checkpoints',
      setup(def) {
        def.lifecycle.onCreated(() => {});
        def.lifecycle.onMounted(() => {});
        def.lifecycle.onUpdated(() => {});
        def.lifecycle.onUnmounted(() => {});
        return (r) => [r.el('div', 'v')];
      },
    };

    const host: RuntimeHost<any> = {
      prototypeName: P.name,
      getRawProps: () => ({}),
      commit(_children, signal) {
        signal?.done();
      },
      schedule(task) {
        scheduled.push(task);
      },
      onLifecycleCheckpoint(cp) {
        trace.push(cp);
      },
    };

    const { controller, invokeUnmounted } = executeWithHost(P, host);

    expect(trace).toEqual([
      'CP0_SETUP_EXIT',
      'CP1_CREATED_CALLBACKS',
      'CP2_LOGICAL_TREE_READY',
      'CP3_COMMIT_START',
      'CP4_COMMIT_DONE',
    ]);

    expect(scheduled).toHaveLength(1);
    scheduled.shift()!();
    expect(trace).toEqual([
      'CP0_SETUP_EXIT',
      'CP1_CREATED_CALLBACKS',
      'CP2_LOGICAL_TREE_READY',
      'CP3_COMMIT_START',
      'CP4_COMMIT_DONE',
      'CP5_MOUNTED_CALLBACKS',
    ]);

    controller.update();
    expect(trace.slice(-3)).toEqual([
      'CP6_UPDATE_RENDER',
      'CP7_UPDATE_COMMIT_DONE',
      'CP8_UPDATED_CALLBACKS',
    ]);

    await invokeUnmounted();
    expect(trace.slice(-2)).toEqual(['CP9_UNMOUNT_BEGIN', 'CP10_DISPOSE_COMPLETE']);
  });

  it('does not record update commit completion checkpoints before signal.done()', () => {
    const trace: RuntimeCheckpoint[] = [];
    const scheduled: Array<() => void> = [];
    const pendingDone: Array<() => void> = [];

    const P: Prototype = {
      name: 'x-lifecycle-checkpoints-delayed',
      setup(def) {
        def.lifecycle.onUpdated(() => {});
        return (r) => [r.el('div', 'v')];
      },
    };

    const host: RuntimeHost<any> = {
      prototypeName: P.name,
      getRawProps: () => ({}),
      commit(_children, signal) {
        if (signal) pendingDone.push(signal.done);
      },
      schedule(task) {
        scheduled.push(task);
      },
      onLifecycleCheckpoint(cp) {
        trace.push(cp);
      },
    };

    const { controller } = executeWithHost(P, host);

    expect(pendingDone).toHaveLength(1);
    pendingDone.shift()!();
    scheduled.shift()?.();

    trace.length = 0;
    controller.update();

    expect(trace).toEqual(['CP6_UPDATE_RENDER']);
    expect(pendingDone).toHaveLength(1);

    pendingDone.shift()!();

    expect(trace).toEqual(['CP6_UPDATE_RENDER', 'CP7_UPDATE_COMMIT_DONE', 'CP8_UPDATED_CALLBACKS']);
  });

  it('coalesces update intents while an async update commit is still pending', () => {
    const trace: RuntimeCheckpoint[] = [];
    const scheduled: Array<() => void> = [];
    const pendingDone: Array<() => void> = [];

    const P: Prototype = {
      name: 'x-lifecycle-checkpoints-queued-update',
      setup(def) {
        def.lifecycle.onUpdated(() => {});
        return (r) => [r.el('div', 'v')];
      },
    };

    const host: RuntimeHost<any> = {
      prototypeName: P.name,
      getRawProps: () => ({}),
      commit(_children, signal) {
        if (signal) pendingDone.push(signal.done);
      },
      schedule(task) {
        scheduled.push(task);
      },
      onLifecycleCheckpoint(cp) {
        trace.push(cp);
      },
    };

    const { controller } = executeWithHost(P, host);

    pendingDone.shift()!();
    scheduled.shift()?.();

    trace.length = 0;
    controller.update();
    controller.update();

    expect(trace).toEqual(['CP6_UPDATE_RENDER']);
    expect(pendingDone).toHaveLength(1);

    pendingDone.shift()!();

    expect(trace).toEqual([
      'CP6_UPDATE_RENDER',
      'CP7_UPDATE_COMMIT_DONE',
      'CP8_UPDATED_CALLBACKS',
      'CP6_UPDATE_RENDER',
    ]);
    expect(pendingDone).toHaveLength(1);

    pendingDone.shift()!();

    expect(trace).toEqual([
      'CP6_UPDATE_RENDER',
      'CP7_UPDATE_COMMIT_DONE',
      'CP8_UPDATED_CALLBACKS',
      'CP6_UPDATE_RENDER',
      'CP7_UPDATE_COMMIT_DONE',
      'CP8_UPDATED_CALLBACKS',
    ]);
  });
});
