export type FeedbackStyleRuntimePatchExpectation =
  | 'runtime-patch-applied'
  | 'runtime-suppress-applied'
  | 'runtime-patch-layer-cleared'
  | 'runtime-patch-token-rejected'
  | 'style-flush-without-render';

export type FeedbackStyleRuntimePatchCase = {
  id: string;
  title: string;
  specCase: string;
  covers: readonly string[];
  baseTokens: readonly string[];
  patchTokens?: readonly string[];
  suppressTokens?: readonly string[];
  expectation: FeedbackStyleRuntimePatchExpectation;
};

export const FEEDBACK_STYLE_RUNTIME_PATCH_CASES = [
  {
    id: 'patch-overrides-base-semantic-group',
    title: 'patch writes a positive runtime patch over the base semantic result',
    specCase: 'T-FEEDBACK-STYLE-0002-CASE-PATCH',
    covers: ['C-FEEDBACK-STYLE-0005-A', 'C-FEEDBACK-STYLE-0005-D', 'C-FEEDBACK-STYLE-0005-E'],
    baseTokens: ['opacity-50', 'bg-blue-500'],
    patchTokens: ['opacity-100'],
    expectation: 'runtime-patch-applied',
  },
  {
    id: 'suppress-removes-base-semantic-group',
    title: 'suppress writes a negative runtime patch for a semantic group',
    specCase: 'T-FEEDBACK-STYLE-0002-CASE-SUPPRESS',
    covers: ['C-FEEDBACK-STYLE-0005-D', 'C-FEEDBACK-STYLE-0005-E'],
    baseTokens: ['opacity-50', 'bg-blue-500'],
    suppressTokens: ['opacity-50'],
    expectation: 'runtime-suppress-applied',
  },
  {
    id: 'clear-patch-restores-base',
    title: 'clearPatch removes the runtime patch layer and restores the base semantic result',
    specCase: 'T-FEEDBACK-STYLE-0002-CASE-CLEAR-PATCH',
    covers: ['C-FEEDBACK-STYLE-0005-F'],
    baseTokens: ['opacity-50', 'bg-blue-500'],
    patchTokens: ['opacity-100'],
    expectation: 'runtime-patch-layer-cleared',
  },
  {
    id: 'patch-rejects-host-or-stateful-token',
    title: 'patch and suppress reject stateful or host-realization tokens',
    specCase: 'T-FEEDBACK-STYLE-0002-CASE-PATCH-TOKEN-PURITY',
    covers: ['C-FEEDBACK-STYLE-0005-C', 'C-FEEDBACK-STYLE-0004-A'],
    baseTokens: ['opacity-50'],
    patchTokens: ['data-pui-style', 'hover:opacity-100'],
    expectation: 'runtime-patch-token-rejected',
  },
  {
    id: 'patch-flushes-style-without-render',
    title: 'runtime style patch triggers style flush without render',
    specCase: 'T-FEEDBACK-STYLE-0002-CASE-NO-RENDER',
    covers: [
      'C-FEEDBACK-STYLE-0001-E',
      'C-FEEDBACK-STYLE-0005-G',
      'C-FEEDBACK-STYLE-0005-H',
      'C-FEEDBACK-0002-E',
    ],
    baseTokens: ['opacity-50'],
    patchTokens: ['opacity-100'],
    expectation: 'style-flush-without-render',
  },
] as const satisfies readonly FeedbackStyleRuntimePatchCase[];

export const FEEDBACK_STYLE_RUNTIME_PATCH_SPEC_CASES = [
  ...new Set(FEEDBACK_STYLE_RUNTIME_PATCH_CASES.map((testCase) => testCase.specCase)),
] as const;
