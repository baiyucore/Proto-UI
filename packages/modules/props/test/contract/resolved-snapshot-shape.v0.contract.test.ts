import { describe, expect, it } from 'vitest';

import { PropsKernel } from '../../src/kernel/kernel';

describe('props: resolved snapshot shape (T-PROPS-0005)', () => {
  it('contains every declared prop key even when raw input omits them', () => {
    const pm = new PropsKernel<{
      present: number;
      missingWithDefault: string;
      missingEmpty: boolean;
    }>();

    pm.define({
      present: { type: 'number' },
      missingWithDefault: { type: 'string', default: 'fallback' },
      missingEmpty: { type: 'boolean' },
    });

    pm.applyRaw({ present: 1 });

    expect(pm.get()).toEqual({
      present: 1,
      missingWithDefault: 'fallback',
      missingEmpty: null,
    });
    expect(Object.keys(pm.get()).sort()).toEqual(['missingEmpty', 'missingWithDefault', 'present']);
  });

  it('excludes undeclared raw prop keys from resolved props while preserving them in raw props', () => {
    const pm = new PropsKernel<{ declared: number }>();

    pm.define({
      declared: { type: 'number' },
    });

    pm.applyRaw({ declared: 1, extra: 2 });

    expect(pm.get()).toEqual({ declared: 1 });
    expect(pm.get()).not.toHaveProperty('extra');
    expect(pm.getRaw()).toEqual({ declared: 1, extra: 2 });
  });

  it('resolves each key independently when other keys are missing, empty, or invalid', () => {
    const pm = new PropsKernel<{
      valid: number;
      missing: string;
      empty: number | null;
      invalid: boolean;
    }>();

    pm.define({
      valid: { type: 'number' },
      missing: { type: 'string', default: 'missing-fallback' },
      empty: { type: 'number', empty: 'accept' },
      invalid: { type: 'boolean', default: true },
    });

    pm.applyRaw({
      valid: 42,
      empty: null,
      invalid: 'not-boolean',
    });

    expect(pm.get()).toEqual({
      valid: 42,
      missing: 'missing-fallback',
      empty: null,
      invalid: true,
    });
  });

  it('never exposes undefined and uses null as the canonical empty resolved value', () => {
    const pm = new PropsKernel<{
      missing: string;
      providedUndefined: number | null;
      providedNull: boolean | null;
    }>();

    pm.define({
      missing: { type: 'string' },
      providedUndefined: { type: 'number', empty: 'accept' },
      providedNull: { type: 'boolean', empty: 'accept' },
    });

    pm.applyRaw({
      providedUndefined: undefined,
      providedNull: null,
    });

    expect(pm.get()).toEqual({
      missing: null,
      providedUndefined: null,
      providedNull: null,
    });
    expect(Object.values(pm.get())).not.toContain(undefined);
    expect(pm.getRaw()).toEqual({
      providedUndefined: null,
      providedNull: null,
    });
  });

  it('returns a shallowly immutable resolved snapshot', () => {
    const pm = new PropsKernel<{ value: number; nested: { count: number } }>();

    pm.define({
      value: { type: 'number' },
      nested: { type: 'object' },
    });

    pm.applyRaw({
      value: 1,
      nested: { count: 1 },
    });

    const snapshot = pm.get();

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(() => {
      (snapshot as { value: number }).value = 2;
    }).toThrow();
    expect(pm.get().value).toBe(1);
  });
});
