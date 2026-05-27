# State value validation remains implementation debt

## Decision

State spec metadata defines the intended host-neutral value domain, but v0 does not yet treat full runtime value-domain validation as an implemented guarantee.

## Rationale

State definitions should stay within a finite, JSON-compatible value space. That makes state portable and keeps it usable by rule, expose, adapter optimization, and documentation tooling.

The repository already contains validator helpers for semantic names and state values, but those helpers are not fully wired into the state module. Treating validation as already guaranteed would overstate the current implementation.

## Debt

Wire validation into state definition, `setDefault`, and `set` paths, then promote the relevant criteria in `C-STATE-0006` from value-domain description to enforced runtime behavior.
