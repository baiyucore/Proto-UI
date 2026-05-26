## CONTRACT_DEBT(v0): expose-event.emit-location

### Problem

`run.event.emit` currently emits events declared by `def.expose.event`, but its information-flow direction is Component -> App Maker.

That direction is closer to the expose channel than to the Event channel, whose core identity is User -> Component.

### Current behavior

The implementation routes `run.event.emit` through the Event module facade and `EVENT_EMIT_CAP`.

Current adapters map that sink as follows:

- React: call an `onXxx` prop callback.
- Vue: call `ctx.emit`.
- Web Component: dispatch a `CustomEvent` from the host element.

This path does not currently depend on Event root/global targets or event-router target migration.

### Desired direction

Decide whether expose-event emission should move to `run.expose.emit`.

If future analysis proves that expose-event emission must participate in Event target merging or event-router sender migration, it may remain as an Event/Expose cross-surface. Otherwise, expose-event should be owned by the Expose scope and only implemented with Event plumbing where convenient.

The current Event contract drafts do not treat `run.event.emit` as an Event-channel runtime API. Its naming and ownership must be resolved before the expose-event surface is stabilized.

### Acceptance criteria (for closing this debt)

1. A contract decides whether expose-event emission belongs to `run.expose.emit` or remains `run.event.emit`.
2. If renamed, runtime handles, adapter tests, and prototype usages are migrated.
3. If retained under Event, the contract states the exact Event-target or Event-router dependency that justifies the cross-surface.
4. Event channel identity remains User -> Component regardless of expose-event implementation plumbing.
