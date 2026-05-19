import type { PropsSpecMap } from '@proto.ui/types';

type P = { disabled: boolean | null; count: number };

// ✅ should compile
({
  disabled: { type: 'boolean', empty: 'accept' },
  count: { type: 'number' },
}) satisfies PropsSpecMap<P>;

type PEnum = { mode: 'primary' | 'secondary' };

// ✅ enum props use state-style string options
({
  mode: { type: 'enum', options: ['primary', 'secondary'] as const },
}) satisfies PropsSpecMap<PEnum>;

// ❌ enum options are required
({
  // @ts-expect-error type:"enum" requires options
  mode: { type: 'enum' },
}) satisfies PropsSpecMap<PEnum>;

// ❌ legacy enum descriptor field is no longer part of PropsSpecMap
({
  // @ts-expect-error use type:"enum" with options instead
  mode: { type: 'string', enum: ['primary', 'secondary'] as const },
}) satisfies PropsSpecMap<PEnum>;

// ❌ empty:"accept" requires null in declared type
type P2 = { disabled: boolean; count: number };

({
  // @ts-expect-error empty:"accept" would resolve to boolean|null, incompatible with boolean
  disabled: { type: 'boolean', empty: 'accept' },
  count: { type: 'number' },
}) satisfies PropsSpecMap<P2>;

// ❌ kind mismatch

({
  disabled: { type: 'boolean', empty: 'accept' },
  // @ts-expect-error count is number in P, but spec says string
  count: { kind: 'string' },
}) satisfies PropsSpecMap<P>;
