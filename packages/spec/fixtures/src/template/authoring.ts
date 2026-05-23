export type TemplateAuthoringExpectation =
  | 'template-output-materializes-as-root-children'
  | 'template-node-structural-shape'
  | 'renderer-el-dispatch-and-props-validation'
  | 'template-children-normalize-v0'
  | 'template-slot-protocol-v0'
  | 'prototype-ref-template-type-rejected';

export type TemplateAuthoringCase = {
  id: string;
  title: string;
  specCase: string;
  covers: readonly string[];
  expectation: TemplateAuthoringExpectation;
  notes?: readonly string[];
};

export const TEMPLATE_AUTHORING_CASES = [
  {
    id: 'root-children-output',
    title: 'template output materializes inside the host root',
    specCase: 'T-TEMPLATE-0001-CASE-ROOT-CHILDREN',
    covers: ['C-TEMPLATE-0001-A', 'C-TEMPLATE-0001-B', 'C-TEMPLATE-0001-C'],
    expectation: 'template-output-materializes-as-root-children',
  },
  {
    id: 'template-node-structural-shape',
    title: 'template node is structural and may carry children and style',
    specCase: 'T-TEMPLATE-0001-CASE-NODE-STRUCTURE',
    covers: ['C-TEMPLATE-0002-A', 'C-TEMPLATE-0002-B', 'C-TEMPLATE-0002-C', 'C-TEMPLATE-0002-D'],
    expectation: 'template-node-structural-shape',
  },
  {
    id: 'renderer-el-dispatch',
    title: 'el dispatches children and style-only TemplateProps',
    specCase: 'T-TEMPLATE-0001-CASE-EL-DISPATCH',
    covers: [
      'C-TEMPLATE-0003-A',
      'C-TEMPLATE-0003-B',
      'C-TEMPLATE-0003-C',
      'C-TEMPLATE-0003-D',
      'C-TEMPLATE-0003-E',
    ],
    expectation: 'renderer-el-dispatch-and-props-validation',
  },
  {
    id: 'template-children-normalize',
    title: 'TemplateChildren normalization enforces v0 portability',
    specCase: 'T-TEMPLATE-0001-CASE-NORMALIZE',
    covers: [
      'C-TEMPLATE-0004-A',
      'C-TEMPLATE-0004-B',
      'C-TEMPLATE-0004-C',
      'C-TEMPLATE-0004-D',
      'C-TEMPLATE-0004-E',
      'C-TEMPLATE-0004-F',
      'C-TEMPLATE-0004-G',
    ],
    expectation: 'template-children-normalize-v0',
  },
  {
    id: 'slot-protocol',
    title: 'slot is anonymous, singular, and parameterless',
    specCase: 'T-TEMPLATE-0001-CASE-SLOT',
    covers: [
      'C-TEMPLATE-0005-A',
      'C-TEMPLATE-0005-B',
      'C-TEMPLATE-0005-C',
      'C-TEMPLATE-0005-D',
      'C-TEMPLATE-0005-E',
    ],
    expectation: 'template-slot-protocol-v0',
  },
  {
    id: 'prototype-ref-rejection',
    title: 'PrototypeRef template type is rejected by adapters',
    specCase: 'T-TEMPLATE-0001-CASE-PROTOTYPE-REF',
    covers: ['C-TEMPLATE-0006-A', 'C-TEMPLATE-0006-B', 'C-TEMPLATE-0006-C', 'C-TEMPLATE-0006-D'],
    expectation: 'prototype-ref-template-type-rejected',
    notes: ['This is a negative conformance signal, not a normal authoring path.'],
  },
] as const satisfies readonly TemplateAuthoringCase[];

export const TEMPLATE_AUTHORING_SPEC_CASES = [
  ...new Set(TEMPLATE_AUTHORING_CASES.map((testCase) => testCase.specCase)),
] as const;
