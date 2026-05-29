export type ExposeSurfaceExpectation =
  | 'component-to-app-maker-channel'
  | 'setup-only-registration'
  | 'shared-key-namespace'
  | 'record-snapshot-access'
  | 'classified-value-method'
  | 'lifecycle-cleanup';

export type ExposeSurfaceCase = {
  id: string;
  title: string;
  specCase: string;
  covers: readonly string[];
  expectation: ExposeSurfaceExpectation;
};

export const EXPOSE_SURFACE_CASES = [
  {
    id: 'component-to-app-maker-channel',
    title: 'expose declares Component to App Maker capabilities',
    specCase: 'T-EXPOSE-0001-CASE-CHANNEL',
    covers: [
      'C-EXPOSE-0001-A',
      'C-EXPOSE-0001-B',
      'C-EXPOSE-0001-C',
      'C-EXPOSE-0001-D',
      'C-EXPOSE-0001-E',
      'C-EXPOSE-0002-A',
      'C-EXPOSE-0002-B',
      'C-EXPOSE-0002-C',
      'C-EXPOSE-0002-D',
    ],
    expectation: 'component-to-app-maker-channel',
  },
  {
    id: 'setup-only-registration',
    title: 'expose entries are registered during setup only',
    specCase: 'T-EXPOSE-0001-CASE-SETUP-ONLY',
    covers: [
      'C-EXPOSE-0003-A',
      'C-EXPOSE-0003-B',
      'C-EXPOSE-0003-C',
      'C-EXPOSE-0003-D',
      'C-EXPOSE-0003-E',
    ],
    expectation: 'setup-only-registration',
  },
  {
    id: 'shared-key-namespace',
    title: 'all expose classifications share one key namespace',
    specCase: 'T-EXPOSE-0001-CASE-SHARED-KEYS',
    covers: ['C-EXPOSE-0004-A', 'C-EXPOSE-0004-B', 'C-EXPOSE-0004-C', 'C-EXPOSE-0005-F'],
    expectation: 'shared-key-namespace',
  },
  {
    id: 'record-snapshot-access',
    title: 'App Maker reads exposes by key or record without mutating the live registry',
    specCase: 'T-EXPOSE-0001-CASE-RECORD',
    covers: ['C-EXPOSE-0004-D', 'C-EXPOSE-0004-E', 'C-EXPOSE-0004-F'],
    expectation: 'record-snapshot-access',
  },
  {
    id: 'classified-value-method',
    title: 'value and method expose entries keep their classified semantics',
    specCase: 'T-EXPOSE-0001-CASE-VALUE-METHOD',
    covers: [
      'C-EXPOSE-0005-A',
      'C-EXPOSE-0005-B',
      'C-EXPOSE-0005-D',
      'C-EXPOSE-0006-A',
      'C-EXPOSE-0006-B',
      'C-EXPOSE-0006-C',
      'C-EXPOSE-0006-D',
      'C-EXPOSE-0006-E',
      'C-EXPOSE-0007-A',
      'C-EXPOSE-0007-B',
      'C-EXPOSE-0007-C',
      'C-EXPOSE-0007-D',
      'C-EXPOSE-0007-E',
    ],
    expectation: 'classified-value-method',
  },
  {
    id: 'lifecycle-cleanup',
    title: 'expose entries are scoped to the component instance lifecycle',
    specCase: 'T-EXPOSE-0001-CASE-LIFECYCLE',
    covers: ['C-EXPOSE-0008-A', 'C-EXPOSE-0008-B', 'C-EXPOSE-0008-C', 'C-EXPOSE-0008-D'],
    expectation: 'lifecycle-cleanup',
  },
] as const satisfies readonly ExposeSurfaceCase[];

export const EXPOSE_SURFACE_SPEC_CASES = [
  ...new Set(EXPOSE_SURFACE_CASES.map((testCase) => testCase.specCase)),
] as const;
