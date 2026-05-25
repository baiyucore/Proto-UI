import { describe, expect, it } from 'vitest';
import type { EffectsPort, Prototype, StyleHandle } from '@proto.ui/core';
import { tw } from '@proto.ui/core';
import { EFFECTS_CAP } from '@proto.ui/module-feedback';
import { executeWithHost, type RuntimeHost } from '../../src';

describe('runtime: feedback.style runtime patch v0', () => {
  it('exposes patch/suppress/clearPatch on the runtime feedback style handle', () => {
    const styles: StyleHandle[] = [];
    const proto: Prototype = {
      name: 'feedback-style-runtime-patch-surface',
      setup(def: any) {
        def.feedback.style.use(tw('opacity-50 bg-blue-500'));
        def.lifecycle.onMounted((run: any) => {
          expect(typeof run.feedback.style.patch).toBe('function');
          expect(typeof run.feedback.style.suppress).toBe('function');
          expect(typeof run.feedback.style.clearPatch).toBe('function');

          run.feedback.style.patch(tw('opacity-100'));
          run.feedback.style.suppress(tw('bg-blue-500'));
          run.feedback.style.clearPatch();
        });
        return (r: any) => [r.el('div', 'ok')];
      },
    } as any;

    executeWithHost(proto, makeHost(proto.name, styles));

    expect(lastTokens(styles)).toEqual(['opacity-50', 'bg-blue-500']);
  });

  it('applies patch and suppress over setup style without structural render', () => {
    const styles: StyleHandle[] = [];
    let renderCount = 0;
    let commitCount = 0;

    const proto: Prototype = {
      name: 'feedback-style-runtime-patch-no-render',
      setup(def: any) {
        def.feedback.style.use(tw('opacity-50 bg-blue-500 text-white'));
        def.lifecycle.onMounted((run: any) => {
          run.feedback.style.patch(tw('opacity-100'));
          run.feedback.style.suppress(tw('bg-blue-500'));
        });
        return (r: any) => {
          renderCount += 1;
          return [r.el('div', 'ok')];
        };
      },
    } as any;

    executeWithHost(
      proto,
      makeHost(proto.name, styles, {
        onCommit: () => {
          commitCount += 1;
        },
      })
    );

    expect(lastTokens(styles)).toEqual(['text-white', 'opacity-100']);
    expect(renderCount).toBe(1);
    expect(commitCount).toBe(1);
  });

  it('applies the patch layer after rule-produced style intents and before style translation', () => {
    const styles: StyleHandle[] = [];

    const proto: Prototype<{ active?: boolean }> = {
      name: 'feedback-style-runtime-patch-after-rule',
      setup(def: any) {
        def.props.define({ active: { type: 'boolean', default: true } } as any);
        def.rule({
          when: (w: any) => w.prop('active').eq(true),
          intent: (i: any) => i.feedback.style.use(tw('opacity-50 bg-blue-500')),
        });
        def.lifecycle.onMounted((run: any) => {
          run.feedback.style.patch(tw('opacity-100'));
          run.feedback.style.suppress(tw('bg-blue-500'));
        });
        return (r: any) => [r.el('div', 'ok')];
      },
    } as any;

    executeWithHost(
      proto,
      makeHost(proto.name, styles, {
        rawProps: { active: true },
      })
    );

    expect(lastTokens(styles)).toEqual(['opacity-100']);
  });

  it('rejects runtime patch inputs that are not author-side style tokens', () => {
    const proto: Prototype = {
      name: 'feedback-style-runtime-patch-token-purity',
      setup(def: any) {
        def.lifecycle.onMounted((run: any) => {
          run.feedback.style.patch(tw('hover:opacity-100'));
        });
        return (r: any) => [r.el('div', 'ok')];
      },
    } as any;

    expect(() => executeWithHost(proto, makeHost(proto.name, []))).toThrow();
  });
});

function makeHost(
  prototypeName: string,
  styles: StyleHandle[],
  options: {
    rawProps?: Record<string, any>;
    onCommit?: () => void;
  } = {}
): RuntimeHost<any> {
  const effects: EffectsPort = {
    queueStyle(handle) {
      styles.push({ kind: handle.kind, tokens: [...handle.tokens] });
    },
    requestFlush() {},
  };

  return {
    prototypeName,
    getRawProps: () => options.rawProps ?? {},
    commit(_children, signal) {
      options.onCommit?.();
      signal?.done();
    },
    schedule(task) {
      task();
    },
    onRuntimeReady(wiring) {
      wiring.attach('feedback', [[EFFECTS_CAP, effects]]);
    },
  };
}

function lastTokens(styles: StyleHandle[]): string[] {
  return styles[styles.length - 1]?.tokens ?? [];
}
