import { JSON_PROPS_VALUE_BOUNDARY_CASES } from '@proto.ui/spec-fixtures/props/json-value-boundary';
import { describe, expect, it } from 'vitest';

import { PropsKernel } from '../../src/kernel/kernel';

const FALLBACK_VALUE = 'fallback-value';

function isPortableValueCase(testCase: (typeof JSON_PROPS_VALUE_BOUNDARY_CASES)[number]): boolean {
  return testCase.expectation === 'accepted-as-portable';
}

describe('props: resolved JSON value boundary (T-PROPS-0001)', () => {
  for (const testCase of JSON_PROPS_VALUE_BOUNDARY_CASES) {
    it(`${testCase.id}: resolved props ${isPortableValueCase(testCase) ? 'preserve' : 'exclude'} ${testCase.title}`, () => {
      const value = testCase.createValue();
      const pm = new PropsKernel<{ value: unknown }>();

      pm.define({
        value: {
          type: 'any',
          default: FALLBACK_VALUE,
          empty: testCase.id === 'json-primitive-null' ? 'accept' : 'fallback',
        },
      });

      pm.applyRaw({ value });

      if (isPortableValueCase(testCase)) {
        expect(pm.get()).toEqual({ value });
        return;
      }

      expect(pm.get()).toEqual({ value: FALLBACK_VALUE });
    });

    if (testCase.expectation === 'raw-observable-but-not-portable') {
      it(`${testCase.id}: raw props may observe host-local input without promoting it to resolved props`, () => {
        const value = testCase.createValue();
        const pm = new PropsKernel<{ value: unknown }>();

        pm.define({
          value: {
            type: 'any',
            default: FALLBACK_VALUE,
          },
        });

        pm.applyRaw({ value });

        expect(pm.getRaw()).toEqual({ value });
        expect(pm.get()).toEqual({ value: FALLBACK_VALUE });
      });
    }
  }
});
