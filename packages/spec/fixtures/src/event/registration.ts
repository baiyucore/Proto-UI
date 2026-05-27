export type EventRegistrationExpectation =
  | 'setup-registration-only'
  | 'runtime-callback-dispatch'
  | 'target-binding'
  | 'empty-registration-noop'
  | 'no-registration-dedup'
  | 'token-precise-removal'
  | 'cleanup-and-rebind';

export type EventRegistrationCase = {
  id: string;
  title: string;
  specCase: string;
  covers: readonly string[];
  eventType: string;
  scope: 'root' | 'global' | 'none';
  expectation: EventRegistrationExpectation;
};

export const EVENT_REGISTRATION_CASES = [
  {
    id: 'event-setup-registration-root',
    title: 'root event listener registration is setup-only',
    specCase: 'T-EVENT-0001-CASE-SETUP-ROOT',
    covers: ['C-EVENT-0002-A', 'C-EVENT-0002-C', 'C-EVENT-0003-A'],
    eventType: 'press.commit',
    scope: 'root',
    expectation: 'setup-registration-only',
  },
  {
    id: 'event-runtime-callback-dispatch',
    title: 'registered callbacks dispatch during runtime with run handle and payload',
    specCase: 'T-EVENT-0001-CASE-RUNTIME-CALLBACK',
    covers: ['C-EVENT-0001-C', 'C-EVENT-0002-D', 'C-EVENT-0002-E', 'C-EVENT-0002-F'],
    eventType: 'press.commit',
    scope: 'root',
    expectation: 'runtime-callback-dispatch',
  },
  {
    id: 'event-global-target-binding',
    title: 'global event listener registration binds to adapter-defined global target',
    specCase: 'T-EVENT-0001-CASE-GLOBAL-TARGET',
    covers: ['C-EVENT-0003-B', 'C-EVENT-0003-C', 'C-EVENT-0003-D'],
    eventType: 'key.down',
    scope: 'global',
    expectation: 'target-binding',
  },
  {
    id: 'event-empty-registration-noop',
    title: 'empty event registration set is a binding no-op',
    specCase: 'T-EVENT-0001-CASE-EMPTY-NOOP',
    covers: ['C-EVENT-0004-A', 'C-EVENT-0004-B', 'C-EVENT-0004-C'],
    eventType: '',
    scope: 'none',
    expectation: 'empty-registration-noop',
  },
  {
    id: 'event-no-dedup',
    title: 'identical listener registrations are not deduplicated',
    specCase: 'T-EVENT-0001-CASE-NO-DEDUP',
    covers: ['C-EVENT-0005-A', 'C-EVENT-0005-C', 'C-EVENT-0005-D'],
    eventType: 'host:click',
    scope: 'root',
    expectation: 'no-registration-dedup',
  },
  {
    id: 'event-token-removal',
    title: 'EventListenerToken removes exactly one registration',
    specCase: 'T-EVENT-0001-CASE-TOKEN-REMOVAL',
    covers: [
      'C-EVENT-0006-A',
      'C-EVENT-0006-B',
      'C-EVENT-0006-C',
      'C-EVENT-0006-D',
      'C-EVENT-TOKEN-0001-A',
      'C-EVENT-TOKEN-0001-B',
    ],
    eventType: 'host:click',
    scope: 'root',
    expectation: 'token-precise-removal',
  },
  {
    id: 'event-cleanup-and-rebind',
    title: 'event bindings clean up on unmount and rebind after target replacement',
    specCase: 'T-EVENT-0001-CASE-CLEANUP-REBIND',
    covers: ['C-EVENT-0007-A', 'C-EVENT-0007-B', 'C-EVENT-0007-C', 'C-EVENT-0007-D'],
    eventType: 'host:click',
    scope: 'root',
    expectation: 'cleanup-and-rebind',
  },
] as const satisfies readonly EventRegistrationCase[];

export const EVENT_REGISTRATION_SPEC_CASES = [
  ...new Set(EVENT_REGISTRATION_CASES.map((testCase) => testCase.specCase)),
] as const;
