# Resolved props watchers preserve registration order

## Decision

Resolved props watcher dispatch must preserve setup-time registration order across `watchAll(cb)` and keyed `watch(keys, cb)` callbacks.

Decision makers: guangliang2019, baiyucore.

## Rationale

`watchAll` and `watch(keys)` observe the same `resolved snapshot` diff in the same dispatch window. `watchAll` does not establish prerequisite semantics that keyed watchers need in order to run correctly, so giving it dispatch priority is not semantically necessary.

Preserving shared registration order matches the prototype author's expectation that callbacks registered earlier in setup run earlier when they match the same dispatch window.

## Rejected Alternatives

Run every `watchAll` callback before keyed `watch(keys)` callbacks. This was rejected because it can make callback order differ from the setup code order without a stronger semantic reason.
