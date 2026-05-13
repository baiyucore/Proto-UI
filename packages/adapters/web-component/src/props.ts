// packages/adapters/web-component/src/props.ts
import type { RuntimeController } from '@proto.ui/runtime';

const rawMap = new WeakMap<HTMLElement, Record<string, any>>();
const ctrlMap = new WeakMap<HTMLElement, RuntimeController>();
const classTokenMap = new WeakMap<HTMLElement, Set<string>>();

export function setElementProps(el: HTMLElement, nextRaw: Record<string, any>) {
  const raw = { ...(nextRaw ?? {}) };
  syncClassProps(el, raw.className ?? raw.class);
  delete raw.className;
  delete raw.class;

  rawMap.set(el, raw);
  const ctrl = ctrlMap.get(el);
  if (ctrl) {
    ctrl.applyRawProps(raw);
  }
}

export function getElementProps(el: HTMLElement) {
  return rawMap.get(el);
}

export function bindController(el: HTMLElement, ctrl: RuntimeController) {
  ctrlMap.set(el, ctrl);

  // if props already set before connected, apply once now
  const raw = rawMap.get(el);
  if (raw) ctrl.applyRawProps(raw);
}

export function unbindController(el: HTMLElement) {
  ctrlMap.delete(el);
}

function syncClassProps(el: HTMLElement, value: unknown) {
  const prev = classTokenMap.get(el) ?? new Set<string>();
  const next = normalizeClassTokens(value);

  for (const token of prev) {
    if (!next.has(token)) el.classList.remove(token);
  }

  const owned = new Set<string>();
  for (const token of next) {
    if (!el.classList.contains(token)) {
      el.classList.add(token);
      owned.add(token);
    } else if (prev.has(token)) {
      owned.add(token);
    }
  }

  if (owned.size > 0) {
    classTokenMap.set(el, owned);
  } else {
    classTokenMap.delete(el);
  }
}

function normalizeClassTokens(value: unknown): Set<string> {
  const out = new Set<string>();
  collectClassTokens(value, out);
  return out;
}

function collectClassTokens(value: unknown, out: Set<string>) {
  if (!value) return;

  if (typeof value === 'string') {
    for (const token of value.split(/\s+/)) {
      const normalized = token.trim();
      if (normalized) out.add(normalized);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectClassTokens(item, out);
    return;
  }

  if (typeof value === 'object') {
    for (const [token, enabled] of Object.entries(value as Record<string, unknown>)) {
      if (enabled) collectClassTokens(token, out);
    }
  }
}
