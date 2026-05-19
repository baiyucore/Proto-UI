import { describe, expect, it } from 'vitest';

import { PropsKernel } from '../../src/kernel/kernel';

describe('props: fallback resolution (T-PROPS-0006)', () => {
  it('T-PROPS-0006-CASE-MISSING-FALLBACK / C-PROPS-0009-A: missing input enters fallback chain', () => {
    const pm = new PropsKernel<{ value: number | null }>();

    pm.define({
      value: { type: 'number', default: 1 },
    });

    pm.applyRaw({});

    expect(pm.isProvided('value')).toBe(false);
    expect(pm.get()).toEqual({ value: 1 });
  });

  it('T-PROPS-0006-CASE-EMPTY-ACCEPT / C-PROPS-0009-B: empty accept resolves to null and does not update prevValid', () => {
    const pm = new PropsKernel<{ value: number | null }>();

    pm.define({
      value: { type: 'number', default: 1, empty: 'accept' },
    });

    pm.applyRaw({ value: 2 });
    expect(pm.get()).toEqual({ value: 2 });

    pm.applyRaw({ value: null });
    expect(pm.get()).toEqual({ value: null });

    pm.applyRaw({});
    expect(pm.get()).toEqual({ value: 2 });
  });

  it('T-PROPS-0006-CASE-EMPTY-FALLBACK / C-PROPS-0009-C: empty fallback enters fallback chain', () => {
    const pm = new PropsKernel<{ value: number }>();

    pm.define({
      value: { type: 'number', default: 1, empty: 'fallback' },
    });

    pm.applyRaw({ value: null });

    expect(pm.isProvided('value')).toBe(true);
    expect(pm.get()).toEqual({ value: 1 });
  });

  it('T-PROPS-0006-CASE-INVALID-FALLBACK / C-PROPS-0009-D: invalid non-empty input enters fallback chain', () => {
    const pm = new PropsKernel<{ value: number | null }>();

    pm.define({
      value: { type: 'number', default: 1, empty: 'accept' },
    });

    pm.applyRaw({ value: 'not-number' });

    expect(pm.isProvided('value')).toBe(true);
    expect(pm.get()).toEqual({ value: 1 });
  });

  it('T-PROPS-0006-CASE-FALLBACK-ORDER / C-PROPS-0009-E: fallback order is prevValid, setDefaults, declaration default, then null', () => {
    const prevValid = new PropsKernel<{ value: number }>();
    prevValid.define({
      value: { type: 'number', default: 1 },
    });
    prevValid.setDefaults({ value: 9 });
    prevValid.applyRaw({ value: 2 });
    prevValid.applyRaw({});
    expect(prevValid.get()).toEqual({ value: 2 });

    const setDefaults = new PropsKernel<{ value: number }>();
    setDefaults.define({
      value: { type: 'number', default: 1 },
    });
    setDefaults.setDefaults({ value: 9 });
    setDefaults.applyRaw({});
    expect(setDefaults.get()).toEqual({ value: 9 });

    const declarationDefault = new PropsKernel<{ value: number }>();
    declarationDefault.define({
      value: { type: 'number', default: 1 },
    });
    declarationDefault.applyRaw({});
    expect(declarationDefault.get()).toEqual({ value: 1 });

    const terminalNull = new PropsKernel<{ value: number }>();
    terminalNull.define({
      value: { type: 'number' },
    });
    terminalNull.applyRaw({});
    expect(terminalNull.get()).toEqual({ value: null });
  });

  it('T-PROPS-0006-CASE-FALLBACK-TO-NULL / C-PROPS-0009-F: default fallback may end in null as canonical empty result', () => {
    const pm = new PropsKernel<{ value: number }>();

    pm.define({
      value: { type: 'number' },
    });

    pm.applyRaw({});

    expect(pm.get()).toEqual({ value: null });
  });

  it('T-PROPS-0006-CASE-EMPTY-ERROR / C-PROPS-0009-G: empty error requires a non-empty fallback or throws', () => {
    const noFallback = new PropsKernel<{ value: number }>();
    noFallback.define({
      value: { type: 'number', empty: 'error' },
    });

    expect(() => noFallback.applyRaw({})).toThrow(/empty="error"|missing/i);
    expect(() => noFallback.applyRaw({ value: null })).toThrow(/empty="error"/i);

    const withPrevValid = new PropsKernel<{ value: number }>();
    withPrevValid.define({
      value: { type: 'number', empty: 'error' },
    });
    withPrevValid.applyRaw({ value: 2 });
    withPrevValid.applyRaw({});

    expect(withPrevValid.get()).toEqual({ value: 2 });
  });

  it('T-PROPS-0006-CASE-PREV-VALID-NON-EMPTY / C-PROPS-0009-H: prevValid stores only non-empty valid values', () => {
    const pm = new PropsKernel<{ value: number | null }>();

    pm.define({
      value: { type: 'number', default: 1, empty: 'accept' },
    });

    pm.applyRaw({ value: null });
    expect(pm.get()).toEqual({ value: null });

    pm.applyRaw({});

    expect(pm.get()).toEqual({ value: 1 });
  });
});
