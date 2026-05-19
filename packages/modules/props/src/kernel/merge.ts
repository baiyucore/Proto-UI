// packages/modules/props/src/kernel/merge.ts
import type {
  EmptyBehavior,
  PropsBaseType,
  PropSpec,
  PropsSpecMap,
  PropType,
} from '@proto.ui/types';
import { isJsonPropsValue } from './json-value';

export type MergeDiagLevel = 'warning' | 'error';

export type MergeDiag = {
  level: MergeDiagLevel;
  key?: string;
  message: string;
};

export type MergeResult<P extends PropsBaseType> = {
  specs: PropsSpecMap<P>;
  diags: MergeDiag[];
};

function hasOwn(obj: any, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isNumberOrUndef(x: any) {
  return x === undefined || (typeof x === 'number' && !Number.isNaN(x));
}

function isValidEmptyBehavior(x: any): x is EmptyBehavior {
  return x === 'accept' || x === 'fallback' || x === 'error';
}

function isValidPropType(x: any): x is PropType {
  return (
    x === 'any' ||
    x === 'boolean' ||
    x === 'string' ||
    x === 'number' ||
    x === 'object' ||
    x === 'enum'
  );
}

function isValidOptions(x: any): x is readonly string[] {
  return Array.isArray(x) && x.length > 0 && x.every((option) => typeof option === 'string');
}

function isSupersetOptions(next?: readonly string[], prev?: readonly string[]) {
  if (!prev || prev.length === 0) return true;
  if (!next) return false;
  const set = new Set(next);
  return prev.every((x) => set.has(x));
}

/**
 * NOTE:
 * The current merge strategy is "incoming must not be stricter".
 * - options: incoming must be a superset of prev (or equal), else error.
 * - range: incoming must be wider/equal (or omit), else error.
 */
function rangeWider(next?: { min?: number; max?: number }, prev?: { min?: number; max?: number }) {
  if (!prev) return true;
  if (!next) return false;

  const prevMin = prev.min ?? -Infinity;
  const prevMax = prev.max ?? Infinity;
  const nextMin = next.min ?? -Infinity;
  const nextMax = next.max ?? Infinity;

  // wider/equal means allowing <= prevMin and >= prevMax
  return nextMin <= prevMin && nextMax >= prevMax;
}

function rangeNarrower(
  next?: { min?: number; max?: number },
  prev?: { min?: number; max?: number }
) {
  if (!next) return false; // omit => no stricter
  if (!prev) return false;

  const prevMin = prev.min ?? -Infinity;
  const prevMax = prev.max ?? Infinity;
  const nextMin = next.min ?? -Infinity;
  const nextMax = next.max ?? Infinity;

  return nextMin > prevMin || nextMax < prevMax;
}

export function mergeSpecs<A extends PropsBaseType, B extends PropsBaseType>(
  base: PropsSpecMap<A>,
  incoming: PropsSpecMap<B>
): MergeResult<A & B> {
  const out: PropsSpecMap<A & B> = { ...base } as PropsSpecMap<A & B>;
  const diags: MergeDiag[] = [];

  for (const key of Object.keys(incoming)) {
    const next = (incoming as any)[key] as PropSpec | undefined;
    const prev = (out as any)[key] as PropSpec | undefined;

    if (!next) continue;

    // -----------------------------
    // v0 minimal spec shape checks
    // -----------------------------
    if (!hasOwn(next as any, 'type') || !isValidPropType((next as any).type)) {
      diags.push({
        level: 'error',
        key,
        message: `type must be one of \"any\" | \"boolean\" | \"string\" | \"number\" | \"object\" | \"enum\"`,
      });
      continue;
    }

    if ((next as any).type === 'enum' && !isValidOptions((next as any).options)) {
      diags.push({
        level: 'error',
        key,
        message: `enum props require non-empty string options`,
      });
      continue;
    }

    if ((next as any).type !== 'enum' && hasOwn(next as any, 'options')) {
      diags.push({
        level: 'error',
        key,
        message: `options are only allowed for type "enum"`,
      });
      continue;
    }

    if (hasOwn(next as any, 'enum')) {
      diags.push({
        level: 'error',
        key,
        message: `enum descriptor field is deprecated; use type "enum" with options`,
      });
      continue;
    }

    if (hasOwn(next as any, 'empty')) {
      const e = (next as any).empty;
      // explicit undefined is treated as invalid shape
      if (e === undefined || !isValidEmptyBehavior(e)) {
        diags.push({
          level: 'error',
          key,
          message: `empty must be one of "fallback" | "accept" | "error"`,
        });
        continue;
      }
    }

    if ((next as any).range) {
      const r = (next as any).range;
      if (!isNumberOrUndef(r.min)) {
        diags.push({
          level: 'error',
          key,
          message: `range.min must be a number`,
        });
        continue;
      }
      if (!isNumberOrUndef(r.max)) {
        diags.push({
          level: 'error',
          key,
          message: `range.max must be a number`,
        });
        continue;
      }
    }

    if (hasOwn(next as any, 'default') && !isJsonPropsValue((next as any).default)) {
      diags.push({
        level: 'error',
        key,
        message: `default must be a JSON props value`,
      });
      continue;
    }

    // new key => just copy
    if (!prev) {
      (out as any)[key] = { ...(next as any) };
      continue;
    }

    // -----------------------------
    // type conflict
    // -----------------------------
    const prevType = (prev as any).type ?? 'any';
    const nextType = (next as any).type ?? 'any';
    if (prevType !== nextType) {
      diags.push({
        level: 'error',
        key,
        message: `type conflict: ${prevType} vs ${nextType}`,
      });
      continue;
    }

    // -----------------------------
    // empty behavior merge:
    // - stricter => error
    // - looser => warning + KEEP prev stricter
    // - omit => no-op
    // -----------------------------
    const prevEmpty: EmptyBehavior = ((prev as any).empty ?? 'fallback') as any;
    const nextEmpty: EmptyBehavior = ((next as any).empty ?? 'fallback') as any;

    const rank = (e: EmptyBehavior) => (e === 'accept' ? 0 : e === 'fallback' ? 1 : 2);

    let mergedEmpty: EmptyBehavior = prevEmpty;

    if (hasOwn(next as any, 'empty')) {
      const pr = rank(prevEmpty);
      const nr = rank(nextEmpty);

      if (nr > pr) {
        diags.push({
          level: 'error',
          key,
          message: `empty behavior becomes stricter (${prevEmpty} -> ${nextEmpty})`,
        });
        continue;
      }

      if (nr < pr) {
        diags.push({
          level: 'warning',
          key,
          message: `empty behavior becomes looser (${prevEmpty} -> ${nextEmpty})`,
        });
        mergedEmpty = prevEmpty; // keep stricter
      } else {
        mergedEmpty = nextEmpty; // equal
      }
    }

    // -----------------------------
    // enum options:
    // - require incoming to be superset/equal, else error
    // - if widened => warning
    // -----------------------------
    if ((prev as any).options || (next as any).options) {
      const prevOptions = (prev as any).options as readonly string[] | undefined;
      const nextOptions = (next as any).options as readonly string[] | undefined;

      if (!isSupersetOptions(nextOptions, prevOptions)) {
        diags.push({
          level: 'error',
          key,
          message: `enum options become stricter (subset)`,
        });
        continue;
      }

      // warn if next strictly wider than prev
      // (i.e. prev is not a superset of next)
      if (!isSupersetOptions(prevOptions, nextOptions)) {
        diags.push({
          level: 'warning',
          key,
          message: `enum options widened (superset)`,
        });
      }
    }

    // -----------------------------
    // range:
    // - narrower => error
    // - wider => warning
    // -----------------------------
    if ((prev as any).range || (next as any).range) {
      const prevRange = (prev as any).range as { min?: number; max?: number } | undefined;
      const nextRange = (next as any).range as { min?: number; max?: number } | undefined;

      if (rangeNarrower(nextRange, prevRange)) {
        diags.push({
          level: 'error',
          key,
          message: `range becomes stricter (narrower)`,
        });
        continue;
      }

      // warn if next is wider than prev (not just equal)
      if (prevRange && nextRange && !rangeWider(prevRange, nextRange)) {
        diags.push({
          level: 'warning',
          key,
          message: `range widened`,
        });
      }
      // If prevRange exists but nextRange omitted, that is not "widened".
      // If prevRange missing and nextRange provided, that's a "new constraint".
      // Current v0 policy does not warn; adjust if you want.
    }

    // -----------------------------
    // validator:
    // - allow add (prev missing, next present)
    // - replacing/removing => error
    // -----------------------------
    const prevHasValidator = !!(prev as any).validator;
    const nextHasValidator = !!(next as any).validator;

    if (!prevHasValidator && nextHasValidator) {
      // allow add
    } else if (prevHasValidator && !nextHasValidator) {
      diags.push({
        level: 'error',
        key,
        message: `validator removal is disallowed in merge`,
      });
      continue;
    } else if (
      prevHasValidator &&
      nextHasValidator &&
      (prev as any).validator !== (next as any).validator
    ) {
      diags.push({
        level: 'error',
        key,
        message: `validator replacement is disallowed in merge`,
      });
      continue;
    }

    // -----------------------------
    // default:
    // - first-time default allowed
    // - changing default => warning + KEEP prev
    // -----------------------------
    const hasPrevDefault = 'default' in (prev as any);
    const hasNextDefault = 'default' in (next as any);

    let mergedDefault = (prev as any).default;

    if (!hasPrevDefault && hasNextDefault) {
      mergedDefault = (next as any).default;
    } else if (
      hasPrevDefault &&
      hasNextDefault &&
      (prev as any).default !== (next as any).default
    ) {
      diags.push({
        level: 'warning',
        key,
        message: `default overridden in define(); prefer setDefaults()`,
      });
      mergedDefault = (prev as any).default; // keep prev
    }

    // -----------------------------
    // merge output (deterministic)
    // -----------------------------
    const merged: any = {
      ...prev,
      ...next,

      // keep type stable
      type: (prev as any).type,

      // enforced merges
      empty: mergedEmpty,
      options: (next as any).options ?? (prev as any).options,
      range: (next as any).range ?? (prev as any).range,
      validator: (prev as any).validator ?? (next as any).validator,
    };

    // override default deterministically (avoid being overridden by spread)
    if (hasPrevDefault || hasNextDefault) {
      merged.default = mergedDefault;
    }

    (out as any)[key] = merged satisfies PropSpec;
  }

  return { specs: out, diags };
}
