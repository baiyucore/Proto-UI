# D-EXPOSE-VALUE-PORTABILITY-0001: Expose value portability remains open

Props already has a strict JSON value boundary because it is a portable App Maker -> Component configuration channel.

Expose value is different. The channel direction is Component -> App Maker, and the broader Expose surface already includes non-JSON capabilities such as state handles, methods, and outward signals. It is not yet clear whether `def.expose.value(...)` itself should be limited to JSON-compatible data, or whether Proto UI should explicitly split portable values from host-local escape hatches.

For v0, expose values are not treated as JSON-only. Contracts should not infer automatic reactivity, subscription, or cross-host portability from arbitrary exposed values.
