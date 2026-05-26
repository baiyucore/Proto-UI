## CONTRACT_DEBT(v0): event.type-validation

### Problem

The current Event runtime accepts arbitrary lowercase dot-separated event names:

```ts
/^[a-z]+(\.[a-z]+)*$/;
```

This is broader than the current `EventTypeV0` contract direction, which only admits:

- protocol core events
- optional medium events
- the host-bound escape hatch

### Current behavior

`packages/modules/event/src/impl.ts` accepts event names such as `foo.bar` as valid even when they are not part of the explicit `EventTypeV0` union and are not host escape hatches.

### Desired direction

Runtime validation should be narrowed to the explicit event type model:

- core event types
- optional medium event types
- `host:*`
- compatibility forms that remain temporarily allowed during migration, if any

### Acceptance criteria (for closing this debt)

1. Runtime event type validation rejects arbitrary dot-separated semantic event names not defined by the contract.
2. Contract tests cover accepted core/optional event names and rejected unknown semantic event names.
3. Any temporary compatibility for legacy prefixes is explicitly documented and tested.
