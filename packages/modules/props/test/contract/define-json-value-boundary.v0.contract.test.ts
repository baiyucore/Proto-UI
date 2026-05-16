import { JSON_PROPS_VALUE_BOUNDARY_CASES } from '@proto.ui/spec-fixtures/props/json-value-boundary';
import { describe, expect, it } from 'vitest';

import { PropsKernel } from '../../src/kernel/kernel';

const MODULE_PROPS_DEFINE_SPEC_CASES = new Set([
  'T-PROPS-0001-CASE-JSON-PRIMITIVES',
  'T-PROPS-0001-CASE-JSON-CONTAINERS',
  'T-PROPS-0001-CASE-NON-JSON-TOP-LEVEL',
  'T-PROPS-0001-CASE-NON-JSON-NESTED',
]);

const MODULE_PROPS_DEFINE_BOUNDARY_CASES = JSON_PROPS_VALUE_BOUNDARY_CASES.filter((testCase) =>
  MODULE_PROPS_DEFINE_SPEC_CASES.has(testCase.specCase)
);

describe('props: define JSON value boundary (T-PROPS-0001)', () => {
  for (const testCase of MODULE_PROPS_DEFINE_BOUNDARY_CASES) {
    const acceptsPortableValue = testCase.expectation === 'accepted-as-portable';

    it(`${testCase.id}: define default ${acceptsPortableValue ? 'accepts' : 'rejects'} ${testCase.title}`, () => {
      const value = testCase.createValue();
      const pm = new PropsKernel<{ value: unknown }>();

      if (acceptsPortableValue) {
        pm.define({ value: { type: 'any', default: value } });
        expect(pm.get()).toEqual({ value });
      } else {
        expect(() => pm.define({ value: { type: 'any', default: value } })).toThrow(
          /JSON props value/i
        );
      }
    });

    it(`${testCase.id}: setDefaults ${acceptsPortableValue ? 'accepts' : 'rejects'} ${testCase.title}`, () => {
      const value = testCase.createValue();
      const pm = new PropsKernel<{ value: unknown }>();
      pm.define({ value: { type: 'any' } });

      if (acceptsPortableValue) {
        pm.setDefaults({ value });
        expect(pm.get()).toEqual({ value });
      } else {
        expect(() => pm.setDefaults({ value })).toThrow(/non-JSON props value/i);
      }
    });
  }
});
