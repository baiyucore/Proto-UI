# Interaction semantic state remains borrowed in v0

## Decision

`def.state.fromInteraction(...)` and `def.state.fromAccessibility(...)` return `borrowed` state views in v0.

## Rationale

Observed projection is philosophically cleaner for system-level interaction and accessibility facts: the system would own the fact, and the prototype author would only read or observe it.

v0 does not yet have enough confidence that adapters and modules can always maintain those facts correctly for every host and every component shape. Prototype authors still need the ability to assert official semantic states such as `hovered`, `pressed`, `focused`, `disabled`, `checked`, or `selected` when they have stronger local knowledge.

Keeping these official semantic states borrowed lets authors use the shared official state surface instead of falling back to private ad hoc state. That keeps rule, expose, and adapter optimization aligned with the official semantics.

## Debt

Long term, official interaction and accessibility state should move toward system-owned `observed` projection if Proto UI can guarantee that the adapter/module layer reflects real interaction state with enough fidelity.

The migration should not happen until it avoids pushing authors away from official semantic state.
