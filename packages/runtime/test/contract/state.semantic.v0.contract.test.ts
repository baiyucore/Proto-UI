import { describe, expect, it } from 'vitest';
import type { Prototype } from '@proto.ui/core';
import { defineAsHook, tw } from '@proto.ui/core';
import { EVENT_GLOBAL_TARGET_CAP, EVENT_ROOT_TARGET_CAP } from '@proto.ui/module-event';
import type { RuntimeHost } from '../../src';
import { executeWithHost } from '../../src';

function createMockTarget() {
  type Rec = { type: string; fn: (ev: any) => void; options?: unknown };
  const listeners: Rec[] = [];

  return {
    addEventListener(type: string, fn: (ev: any) => void, options?: unknown) {
      listeners.push({ type, fn, options });
    },
    removeEventListener(type: string, fn: (ev: any) => void, options?: unknown) {
      for (let i = listeners.length - 1; i >= 0; i--) {
        const rec = listeners[i]!;
        if (rec.type !== type || rec.fn !== fn || rec.options !== options) continue;
        listeners.splice(i, 1);
        return;
      }
    },
    dispatchEvent() {
      return true;
    },
    fire(type: string, ev: any = { type }) {
      for (const rec of listeners.filter((item) => item.type === type).slice()) {
        rec.fn(ev);
      }
    },
  } as EventTarget & { fire(type: string, ev?: any): void };
}

function createHost(
  prototypeName: string,
  targets?: { root?: EventTarget | null; global?: EventTarget | null }
): RuntimeHost<any> {
  return {
    prototypeName,
    getRawProps() {
      return {};
    },
    commit(_children, signal) {
      signal?.done();
    },
    schedule(task) {
      task();
    },
    onRuntimeReady(wiring) {
      if (targets?.root !== undefined || targets?.global !== undefined) {
        wiring.attach('event', [
          [EVENT_ROOT_TARGET_CAP, () => targets.root ?? null],
          [EVENT_GLOBAL_TARGET_CAP, () => targets.global ?? null],
        ]);
      }
    },
  };
}

describe('runtime contract: state semantic accessors (v0)', () => {
  it('fromInteraction returns a shared borrowed handle for the same semantic slot', () => {
    let a: any;
    let b: any;

    const P: Prototype = {
      name: 'state-interaction-shared',
      setup(def) {
        a = def.state.fromInteraction('disabled');
        b = def.state.fromInteraction('disabled');

        def.rule({
          when: (w: any) => w.state(a).eq(true),
          intent: (i: any) => i.feedback.style.use(tw('opacity-50')),
        });

        def.lifecycle.onCreated(() => {
          a.set(true);
        });

        return (r) => [r.el('div', 'ok')];
      },
    };

    const host = createHost(P.name);

    const { controller } = executeWithHost(P as any, host as any);
    expect(a).toBe(b);
    expect(typeof a.watch).toBe('function');
    expect(controller.getRuleStyleTokens()).toContain('opacity-50');
  });

  it('fromAccessibility returns a shared borrowed handle for the same semantic slot', () => {
    let a: any;
    let b: any;

    const P: Prototype = {
      name: 'state-accessibility-shared',
      setup(def) {
        a = def.state.fromAccessibility('expanded');
        b = def.state.fromAccessibility('expanded');

        def.rule({
          when: (w: any) => w.state(a).eq(true),
          intent: (i: any) => i.feedback.style.use(tw('bg-muted')),
        });

        def.lifecycle.onCreated(() => {
          a.set(true);
        });

        return (r) => [r.el('div', 'ok')];
      },
    };

    const host = createHost(P.name);

    const { controller } = executeWithHost(P as any, host as any);
    expect(a).toBe(b);
    expect(typeof a.watch).toBe('function');
    expect(controller.getRuleStyleTokens()).toContain('bg-muted');
  });

  it('fromInteraction supports focusVisible as a shared semantic slot', () => {
    let a: any;
    let b: any;

    const P: Prototype = {
      name: 'state-interaction-focus-visible-shared',
      setup(def) {
        a = def.state.fromInteraction('focusVisible');
        b = def.state.fromInteraction('focusVisible');
        return (r) => [r.el('div', 'ok')];
      },
    };

    const root = createMockTarget();
    const global = createMockTarget();
    const host = createHost(P.name, { root, global });

    executeWithHost(P as any, host as any);
    expect(a).toBe(b);
    expect(typeof a.watch).toBe('function');
  });

  it('fromInteraction(hovered) is maintained by runtime-managed pointer events', () => {
    let hovered: any;
    const root = createMockTarget();

    const P: Prototype = {
      name: 'state-interaction-hovered-wiring',
      setup(def) {
        hovered = def.state.fromInteraction('hovered');
        return (r) => [r.el('div', 'ok')];
      },
    };

    executeWithHost(P as any, createHost(P.name, { root }) as any);

    expect(hovered.get()).toBe(false);
    root.fire('pointer.enter', { type: 'pointer.enter' });
    expect(hovered.get()).toBe(true);
    root.fire('pointer.leave', { type: 'pointer.leave' });
    expect(hovered.get()).toBe(false);
  });

  it('runtime-managed interaction state updates before prototype event callbacks observe it', () => {
    let seenInAuthorCallback: boolean | undefined;
    const root = createMockTarget();

    const P: Prototype = {
      name: 'state-interaction-before-author-event',
      setup(def) {
        const hovered = def.state.fromInteraction('hovered');
        def.event.on('pointer.enter', () => {
          seenInAuthorCallback = hovered.get();
        });
        return (r) => [r.el('div', 'ok')];
      },
    };

    executeWithHost(P as any, createHost(P.name, { root }) as any);

    root.fire('pointer.enter', { type: 'pointer.enter' });
    expect(seenInAuthorCallback).toBe(true);
  });

  it('runtime-managed interaction state respects disabled as an interaction gate', () => {
    let disabled: any;
    let hovered: any;
    let focused: any;
    let focusVisible: any;
    let pressed: any;
    const root = createMockTarget();
    const global = createMockTarget();

    const P: Prototype = {
      name: 'state-interaction-disabled-gate',
      setup(def) {
        disabled = def.state.fromInteraction('disabled');
        hovered = def.state.fromInteraction('hovered');
        focused = def.state.fromInteraction('focused');
        focusVisible = def.state.fromInteraction('focusVisible');
        pressed = def.state.fromInteraction('pressed');
        return (r) => [r.el('div', 'ok')];
      },
    };

    const result = executeWithHost(P as any, createHost(P.name, { root, global }) as any);

    root.fire('pointer.enter', { type: 'pointer.enter' });
    global.fire('key.down', { type: 'key.down' });
    root.fire('host:focus', { type: 'host:focus' });
    root.fire('pointer.down', { type: 'pointer.down' });

    expect(hovered.get()).toBe(true);
    expect(focused.get()).toBe(true);
    expect(pressed.get()).toBe(true);

    result.invokeInCallbackScope(() => {
      disabled.set(true, 'test: disabled gate');
    });

    expect(hovered.get()).toBe(false);
    expect(focused.get()).toBe(false);
    expect(focusVisible.get()).toBe(false);
    expect(pressed.get()).toBe(false);

    root.fire('pointer.enter', { type: 'pointer.enter' });
    root.fire('host:focus', { type: 'host:focus' });
    root.fire('pointer.down', { type: 'pointer.down' });

    expect(hovered.get()).toBe(false);
    expect(focused.get()).toBe(false);
    expect(focusVisible.get()).toBe(false);
    expect(pressed.get()).toBe(false);
  });

  it('runtime-managed focusVisible is cleared by pointer modality', () => {
    let focusVisible: any;
    const root = createMockTarget();
    const global = createMockTarget();

    const P: Prototype = {
      name: 'state-interaction-focus-visible-pointer-modality',
      setup(def) {
        focusVisible = def.state.fromInteraction('focusVisible');
        return (r) => [r.el('div', 'ok')];
      },
    };

    executeWithHost(P as any, createHost(P.name, { root, global }) as any);

    global.fire('key.down', { type: 'key.down' });
    root.fire('host:focus', { type: 'host:focus' });
    expect(focusVisible.get()).toBe(true);

    root.fire('pointer.down', { type: 'pointer.down' });
    expect(focusVisible.get()).toBe(false);
  });

  it('fromInteraction inside asHook shares the caller interaction subject state', () => {
    let inner: any;
    let outer: any;
    const root = createMockTarget();

    const asInteraction = defineAsHook({
      name: 'asInteractionState',
      setup(def) {
        inner = def.state.fromInteraction('hovered');
      },
    });

    const P: Prototype = {
      name: 'state-interaction-as-hook-shared',
      setup(def) {
        asInteraction();
        outer = def.state.fromInteraction('hovered');
        return (r) => [r.el('div', 'ok')];
      },
    };

    executeWithHost(P as any, createHost(P.name, { root }) as any);

    expect(inner).toBe(outer);
  });
});
