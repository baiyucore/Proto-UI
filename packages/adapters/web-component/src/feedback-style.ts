import { mergeTwTokensV0 } from '@proto.ui/core';

const KEY = '__proto_ui_applied_style_tokens_v0__';
export const PUI_STYLE_ATTR = 'data-pui-style';

/**
 * v0 compatibility helper: map style tokens onto the Proto UI style attribute.
 */
export function applyStyleTokensToHost(el: HTMLElement, tokens: string[]) {
  const merged = mergeTwTokensV0(tokens).tokens;
  (el as any)[KEY] = merged;
  setStyleAttribute(el, merged);
}

export function applyFeedbackStyleTokensToHost(el: HTMLElement, tokens: string[]): () => void {
  const previous = el.getAttribute(PUI_STYLE_ATTR);
  setStyleAttribute(el, normalizeTokens(tokens));

  return () => {
    if (previous == null) el.removeAttribute(PUI_STYLE_ATTR);
    else el.setAttribute(PUI_STYLE_ATTR, previous);
  };
}

export type OwnedTokenApplier = {
  /**
   * Replace adapter-owned tokens on host element.
   * - does not touch non-owned classes
   * - stable, idempotent
   */
  apply(nextTokens: string[]): void;

  /** Remove all owned tokens from host */
  clear(): void;

  /** For tests / debugging */
  getOwned(): ReadonlySet<string>;
};

/**
 * Create an applier that manages adapter-owned Proto UI style tokens on host element.
 *
 * Contract:
 * - Only operates on owned tokens it previously applied
 * - Never removes user classes
 * - `apply([])` removes all previously owned tokens
 */
export function createOwnedTwTokenApplier(
  host: HTMLElement,
  hooks: { onChange?: () => void } = {}
): OwnedTokenApplier {
  let owned = new Set<string>();

  const apply = (nextTokens: string[]) => {
    const nextList = normalizeTokens(nextTokens);
    const nextSet = new Set<string>(nextList);

    setStyleAttribute(host, nextList);
    owned = nextSet;
    hooks.onChange?.();
  };

  const clear = () => {
    host.removeAttribute(PUI_STYLE_ATTR);
    owned = new Set<string>();
    hooks.onChange?.();
  };

  const getOwned = () => owned;

  return { apply, clear, getOwned };
}

function normalizeTokens(tokens: readonly string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    const normalized = (token ?? '').trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function setStyleAttribute(el: HTMLElement, tokens: readonly string[]) {
  if (tokens.length > 0) {
    el.setAttribute(PUI_STYLE_ATTR, tokens.join(' '));
  } else {
    el.removeAttribute(PUI_STYLE_ATTR);
  }
}
