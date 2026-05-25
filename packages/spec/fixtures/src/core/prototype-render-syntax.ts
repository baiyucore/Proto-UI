export type PrototypeRenderSyntaxExpectation =
  | 'invalid-prototype-definition-fails-fast'
  | 'setup-receives-definition-handle'
  | 'setup-returned-render-is-executed'
  | 'void-setup-uses-default-slot-render'
  | 'invalid-setup-return-fails-fast'
  | 'render-receives-renderer-handle-and-returns-template-children'
  | 'renderer-read-runtime-input-without-write-entry';

export type PrototypeRenderSyntaxCase = {
  id: string;
  title: string;
  specCase: string;
  covers: readonly string[];
  expectation: PrototypeRenderSyntaxExpectation;
  notes?: readonly string[];
};

export const PROTOTYPE_RENDER_SYNTAX_CASES = [
  {
    id: 'definition-name-and-setup',
    title: 'prototype definition requires a name and setup function',
    specCase: 'T-CORE-SYNTAX-0001-CASE-DEFINITION-SHAPE',
    covers: ['C-CORE-SYNTAX-0003-A', 'C-CORE-SYNTAX-0003-B', 'C-CORE-SYNTAX-0003-D'],
    expectation: 'invalid-prototype-definition-fails-fast',
  },
  {
    id: 'setup-receives-def',
    title: 'setup receives the definition handle',
    specCase: 'T-CORE-SYNTAX-0001-CASE-SETUP-DEF',
    covers: ['C-CORE-SYNTAX-0003-C', 'C-CORE-SYNTAX-0004-A'],
    expectation: 'setup-receives-definition-handle',
  },
  {
    id: 'setup-returned-render',
    title: 'setup-returned function is used as render',
    specCase: 'T-CORE-SYNTAX-0001-CASE-SETUP-RETURN-RENDER',
    covers: ['C-CORE-SYNTAX-0004-B', 'C-CORE-SYNTAX-0005-A'],
    expectation: 'setup-returned-render-is-executed',
  },
  {
    id: 'setup-void-default-slot',
    title: 'void setup return uses default slot render',
    specCase: 'T-CORE-SYNTAX-0001-CASE-SETUP-VOID-DEFAULT',
    covers: ['C-CORE-SYNTAX-0004-C'],
    expectation: 'void-setup-uses-default-slot-render',
    notes: ['Default slot render is a stable v0 contract.'],
  },
  {
    id: 'setup-invalid-return',
    title: 'setup rejects non-render non-void returns',
    specCase: 'T-CORE-SYNTAX-0001-CASE-SETUP-RETURN-INVALID',
    covers: ['C-CORE-SYNTAX-0004-D'],
    expectation: 'invalid-setup-return-fails-fast',
  },
  {
    id: 'render-receives-renderer',
    title: 'render receives renderer handle and returns TemplateChildren',
    specCase: 'T-CORE-SYNTAX-0001-CASE-RENDER-HANDLE',
    covers: ['C-CORE-SYNTAX-0005-B', 'C-CORE-SYNTAX-0005-C', 'C-CORE-SYNTAX-0006-A'],
    expectation: 'render-receives-renderer-handle-and-returns-template-children',
  },
  {
    id: 'renderer-read-runtime-input-no-write',
    title: 'renderer read exposes props, context, and anatomy without write entries',
    specCase: 'T-CORE-SYNTAX-0001-CASE-RENDER-READ',
    covers: [
      'C-CORE-SYNTAX-0006-B',
      'C-CORE-SYNTAX-0006-C',
      'C-CORE-SYNTAX-0006-D',
      'C-CORE-SYNTAX-0006-E',
      'C-CORE-SYNTAX-0006-F',
      'C-LIFECYCLE-0003-D',
      'C-LIFECYCLE-0003-E',
    ],
    expectation: 'renderer-read-runtime-input-without-write-entry',
  },
] as const satisfies readonly PrototypeRenderSyntaxCase[];

export const PROTOTYPE_RENDER_SYNTAX_SPEC_CASES = [
  ...new Set(PROTOTYPE_RENDER_SYNTAX_CASES.map((testCase) => testCase.specCase)),
] as const;
