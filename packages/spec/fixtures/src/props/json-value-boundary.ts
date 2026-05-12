class HostLocalClassInstance {
  readonly kind = 'host-local-class-instance';
}

export type JsonPropsValueBoundaryExpectation =
  | 'accepted-as-portable'
  | 'excluded-from-portable-resolved-semantics'
  | 'raw-observable-but-not-portable';

export type JsonPropsValueBoundaryCase = {
  id: string;
  title: string;
  specCase: string;
  covers: readonly string[];
  valueKind: string;
  expectation: JsonPropsValueBoundaryExpectation;
  createValue: () => unknown;
  notes?: readonly string[];
};

export const JSON_PROPS_VALUE_BOUNDARY_CASES = [
  {
    id: 'json-primitive-string',
    title: 'string is a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-JSON-PRIMITIVES',
    covers: ['C-PROPS-0003-A'],
    valueKind: 'json-primitive',
    expectation: 'accepted-as-portable',
    createValue: () => 'Proto UI',
  },
  {
    id: 'json-primitive-number',
    title: 'finite number is a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-JSON-PRIMITIVES',
    covers: ['C-PROPS-0003-A'],
    valueKind: 'json-primitive',
    expectation: 'accepted-as-portable',
    createValue: () => 42,
  },
  {
    id: 'json-primitive-boolean',
    title: 'boolean is a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-JSON-PRIMITIVES',
    covers: ['C-PROPS-0003-A'],
    valueKind: 'json-primitive',
    expectation: 'accepted-as-portable',
    createValue: () => true,
  },
  {
    id: 'json-primitive-null',
    title: 'null is a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-JSON-PRIMITIVES',
    covers: ['C-PROPS-0003-A'],
    valueKind: 'json-primitive',
    expectation: 'accepted-as-portable',
    createValue: () => null,
  },
  {
    id: 'json-array-nested',
    title: 'array is portable when every nested value is JSON',
    specCase: 'T-PROPS-0001-CASE-JSON-CONTAINERS',
    covers: ['C-PROPS-0003-B'],
    valueKind: 'json-container',
    expectation: 'accepted-as-portable',
    createValue: () => ['a', 1, false, null, { nested: ['b'] }],
  },
  {
    id: 'json-object-nested',
    title: 'object is portable when every nested value is JSON',
    specCase: 'T-PROPS-0001-CASE-JSON-CONTAINERS',
    covers: ['C-PROPS-0003-C'],
    valueKind: 'json-container',
    expectation: 'accepted-as-portable',
    createValue: () => ({
      label: 'Save',
      count: 1,
      disabled: false,
      meta: { intent: 'primary', tags: ['action'] },
      empty: null,
    }),
  },
  {
    id: 'non-json-undefined',
    title: 'undefined is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-TOP-LEVEL',
    covers: ['C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-top-level',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => undefined,
  },
  {
    id: 'non-json-function',
    title: 'function is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-TOP-LEVEL',
    covers: ['C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-top-level',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => () => undefined,
  },
  {
    id: 'non-json-symbol',
    title: 'symbol is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-TOP-LEVEL',
    covers: ['C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-top-level',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => Symbol('proto-ui'),
  },
  {
    id: 'non-json-bigint',
    title: 'bigint is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-TOP-LEVEL',
    covers: ['C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-top-level',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => 1n,
  },
  {
    id: 'non-json-date',
    title: 'Date is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-TOP-LEVEL',
    covers: ['C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-top-level',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => new Date('2026-05-11T00:00:00.000Z'),
  },
  {
    id: 'non-json-regexp',
    title: 'RegExp is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-TOP-LEVEL',
    covers: ['C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-top-level',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => /proto-ui/u,
  },
  {
    id: 'non-json-map',
    title: 'Map is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-TOP-LEVEL',
    covers: ['C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-top-level',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => new Map([['key', 'value']]),
  },
  {
    id: 'non-json-set',
    title: 'Set is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-TOP-LEVEL',
    covers: ['C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-top-level',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => new Set(['value']),
  },
  {
    id: 'non-json-class-instance',
    title: 'class instance is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-TOP-LEVEL',
    covers: ['C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-top-level',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => new HostLocalClassInstance(),
  },
  {
    id: 'non-json-object-containing-function',
    title: 'object containing a function is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-NESTED',
    covers: ['C-PROPS-0003-C', 'C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-nested',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => ({ action: () => undefined }),
  },
  {
    id: 'non-json-array-containing-undefined',
    title: 'array containing undefined is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-NESTED',
    covers: ['C-PROPS-0003-B', 'C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-nested',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => ['a', undefined],
  },
  {
    id: 'non-json-object-containing-date',
    title: 'object containing Date is not a portable JSON props value',
    specCase: 'T-PROPS-0001-CASE-NON-JSON-NESTED',
    covers: ['C-PROPS-0003-C', 'C-PROPS-0003-D', 'C-PROPS-0003-E'],
    valueKind: 'non-json-nested',
    expectation: 'excluded-from-portable-resolved-semantics',
    createValue: () => ({ createdAt: new Date('2026-05-11T00:00:00.000Z') }),
  },
  {
    id: 'raw-non-json-function',
    title: 'raw escape hatch may observe a host-local function without making it portable',
    specCase: 'T-PROPS-0001-CASE-RAW-ESCAPE-HATCH',
    covers: ['C-PROPS-0003-E'],
    valueKind: 'raw-host-local-input',
    expectation: 'raw-observable-but-not-portable',
    createValue: () => () => undefined,
    notes: ['Resolved portable props must not expose this value as an accepted JSON props value.'],
  },
] as const satisfies readonly JsonPropsValueBoundaryCase[];

export const JSON_PROPS_VALUE_BOUNDARY_SPEC_CASES = [
  ...new Set(JSON_PROPS_VALUE_BOUNDARY_CASES.map((testCase) => testCase.specCase)),
] as const;
