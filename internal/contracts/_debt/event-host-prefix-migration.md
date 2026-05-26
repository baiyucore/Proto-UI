## CONTRACT_DEBT(v0): event.host-prefix-migration

### Problem

The old Event type model distinguishes:

- `native:*`
- `host.*`

The current contract direction converges host-bound event escape hatches on a single `host:*` prefix.

### Current behavior

The implementation and existing tests still support both `native:*` and `host.*`. Prototype code also uses `native:focus`, `native:blur`, and `native:pointerdown` in several places.

### Desired direction

Use `host:*` as the single author-facing host-bound event escape hatch.

`native:*` and `host.*` should either:

- be migrated to `host:*`, or
- remain as explicitly deprecated compatibility aliases for a bounded period.

### Acceptance criteria (for closing this debt)

1. `EventTypeV0` and runtime validation use `host:*` as the normative host escape hatch.
2. Existing `native:*` and `host.*` usages are migrated or covered by an explicit deprecation/compatibility policy.
3. Adapter event-router tests cover `host:*`.
4. Documentation marks host-bound events as portability-reducing escape hatches.
