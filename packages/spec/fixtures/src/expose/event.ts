export type ExposeEventExpectation =
  | 'outward-signal-declared-and-emitted'
  | 'unregistered-signal-rejected'
  | 'payload-spec-carried';

export type ExposeEventCase = {
  id: string;
  title: string;
  specCase: string;
  covers: readonly string[];
  expectation: ExposeEventExpectation;
};

export const EXPOSE_EVENT_CASES = [
  {
    id: 'outward-signal-declared-and-emitted',
    title: 'expose.event declares a Component to App Maker outward signal',
    specCase: 'T-EXPOSE-EVENT-0001-CASE-DECLARE-EMIT',
    covers: [
      'C-EXPOSE-EVENT-0001-A',
      'C-EXPOSE-EVENT-0001-B',
      'C-EXPOSE-EVENT-0001-D',
      'C-EXPOSE-EVENT-0001-E',
      'C-EXPOSE-EVENT-0001-F',
    ],
    expectation: 'outward-signal-declared-and-emitted',
  },
  {
    id: 'unregistered-signal-rejected',
    title: 'runtime emit rejects unregistered expose event keys',
    specCase: 'T-EXPOSE-EVENT-0001-CASE-UNREGISTERED',
    covers: ['C-EXPOSE-EVENT-0001-C'],
    expectation: 'unregistered-signal-rejected',
  },
  {
    id: 'payload-spec-carried',
    title: 'expose.event payload metadata is declaration metadata, not payload validation',
    specCase: 'T-EXPOSE-EVENT-0001-CASE-PAYLOAD-SPEC',
    covers: [
      'C-EXPOSE-EVENT-0002-A',
      'C-EXPOSE-EVENT-0002-B',
      'C-EXPOSE-EVENT-0002-C',
      'C-EXPOSE-EVENT-0002-D',
      'C-EXPOSE-EVENT-0002-E',
    ],
    expectation: 'payload-spec-carried',
  },
] as const satisfies readonly ExposeEventCase[];

export const EXPOSE_EVENT_SPEC_CASES = [
  ...new Set(EXPOSE_EVENT_CASES.map((testCase) => testCase.specCase)),
] as const;
