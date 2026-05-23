import { PROTOTYPE_RENDER_SYNTAX_CASES } from '@proto.ui/spec-fixtures/core/prototype-render-syntax';
import { definePrototype } from '../../src';
import { describe, expect, it } from 'vitest';

const DEFINITION_SHAPE_CASE = PROTOTYPE_RENDER_SYNTAX_CASES.find(
  (testCase) => testCase.specCase === 'T-CORE-SYNTAX-0001-CASE-DEFINITION-SHAPE'
);

describe('contract: core / prototype definition syntax (v0)', () => {
  it(DEFINITION_SHAPE_CASE?.title ?? 'prototype definitions require name and setup', () => {
    expect(
      definePrototype({
        name: 'x-core-prototype-definition',
        setup() {
          return () => null;
        },
      })
    ).toMatchObject({ name: 'x-core-prototype-definition' });

    expect(() => definePrototype(null as any)).toThrow(/\[Prototype\] definePrototype/);
    expect(() => definePrototype({ setup() {} } as any)).toThrow(/\[Prototype\] illegal name/);
    expect(() => definePrototype({ name: 'x-missing-setup' } as any)).toThrow(
      /\[Prototype\] setup must be a function/
    );
  });
});
