# Function props are excluded from the props contract

## Decision

Props records describe stable host-facing data. Function values are excluded from the canonical props contract.

## Rationale

Function identity, closure state, and invocation semantics are host-local. Treating them as serialized contract data would make cross-host comparison and replay unreliable.

## Rejected Alternatives

Allow functions with adapter-specific encoding. This was rejected because it would make the contract depend on host behavior instead of shared semantics.
