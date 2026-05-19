# Props declaration merge conflicts are blocking errors

## Decision

Props declaration merge conflicts must fail the current `define()` call as blocking errors. The failed incoming declaration must not partially apply or leave diagnostics from the failed transaction.

Decision makers: guangliang2019, baiyucore.

## Rationale

Props declaration merging usually happens while authoring prototypes. Changing a prototype belongs to the prototype author's responsibility, and Proto UI expects authors to understand the prototype's interaction semantics. A console error plus a silently ignored incoming merge is not visible enough.

When two contributors, such as `asHook`s, conflict on the same prop key, merely ignoring the later declaration can let incompatible props flow into logic that did not declare support for them. For example, if `asHook A` and `asHook B` disagree about a prop key, preserving only the earlier declaration may still make one hook observe unexpected prop values in some scenarios, leading to less predictable failures.

A blocking error forces the author to resolve the semantic conflict directly before the prototype can continue.

## Rejected Alternatives

Report a console error and keep the previous props declaration result. This was rejected because the failure can be too easy to miss and can preserve a partially incompatible prototype composition.
