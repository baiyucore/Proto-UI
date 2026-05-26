## CONTRACT_DEBT(v0): event.payload-shape

### Problem

Event callback payload shape is not yet specified.

The current Web event router usually forwards host-native events through a `CustomEvent` detail or similar host-local payload, but this is not a portable Proto UI payload contract.

### Current behavior

Prototype callbacks receive an `ev` value, but the minimum portable fields for event families such as `key.*`, `pointer.*`, or `press.*` are not defined.

### Desired direction

Define the minimum portable payload shape per event family.

Likely examples:

- `key.*` should expose at least a stable key value or equivalent input-channel identifier.
- `host:*` payload should remain adapter-defined.
- Host-native event objects, DOM targets, composed paths, coordinates, or platform-specific fields should not accidentally become portable guarantees.

### Acceptance criteria (for closing this debt)

1. A contract defines portable payload shape for core event families.
2. Optional medium event payloads either have minimum portable fields or are explicitly left adapter-defined.
3. Tests distinguish portable payload fields from host-local native event passthrough.
4. Web adapter native-event forwarding is documented as an implementation practice, not the cross-host payload contract.
