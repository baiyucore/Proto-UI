// packages/types/src/event.ts
export const CORE_EVENT_TYPES = [
  'press.start',
  'press.end',
  'press.cancel',
  'press.commit',
  'key.down',
  'key.up',
] as const;

export type CoreEventType = (typeof CORE_EVENT_TYPES)[number];

export const OPTIONAL_EVENT_TYPES = [
  'pointer.down',
  'pointer.move',
  'pointer.up',
  'pointer.cancel',
  'pointer.enter',
  'pointer.leave',
  'nav.focus',
  'nav.blur',
  'text.focus',
  'text.blur',
  'input',
  'change',
  'context.menu',
] as const;

export type OptionalEventType = (typeof OPTIONAL_EVENT_TYPES)[number];

export type ExtensionEventType = `host:${string}`;

export type EventTypeV0 = CoreEventType | OptionalEventType | ExtensionEventType;

export type EventListenerOptions = any;

export type ProtoEventPayload = {
  type: CoreEventType | OptionalEventType;
  key?: string;
  target?: unknown;
  nativeEvent?: unknown;
  preventDefault?: () => void;
  stopPropagation?: () => void;
};

export type ExposeEventSpec = {
  payload?: 'void' | 'any' | 'json';
  options?: Record<string, unknown>;
};

declare const __eventTokenBrand: unique symbol;

export type EventTokenMeta = {
  kind: 'root' | 'global';
  type: string;
  options?: unknown;
  label?: string; // dev-only, set by desc()
};

export type EventListenerToken = {
  readonly [__eventTokenBrand]: 'EventListenerToken';
  readonly id: string;
  readonly meta: Readonly<EventTokenMeta>;
  desc(text: string): EventListenerToken;
};
