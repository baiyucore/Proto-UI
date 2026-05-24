## CONTRACT_DEBT(v0): feedback.web-style-ownership

### Problem

Official Web-family adapters currently realize Proto UI style tokens through a host-visible style channel such as `data-pui-style`. That channel can receive tokens from multiple sources:

- setup-time `feedback.style`
- rule-driven or future runtime feedback effects
- adapter-owned baseline styles
- App Maker or host-authored style tokens that coexist with Proto UI output

The implementation needs an ownership model so clearing or replacing one source does not accidentally remove tokens owned by another source.

### Current behavior

The Web Component adapter has an owned-token implementation that tracks internal sources and rewrites `data-pui-style` without touching host `classList`.

This is currently an implementation practice, not a fully cataloged contract.

### Risk / tradeoff

- Without an ownership contract, a future adapter or runtime style path could clear too much and break App Maker-authored styling.
- Over-specifying this too early could leak Web-specific realization details into the feedback philosophy layer.

### Desired direction

Define this under an official Web adapter / CLI-governed style realization contract, not under the base feedback channel contract.

The eventual contract should capture:

- App Maker-authored host styling should remain usable and higher priority where the host allows it.
- Adapter-produced style artifacts should not be written into the same ownership surface as user classes when a separate style channel is available.
- Multiple internal style sources should be replaceable and clearable without deleting unrelated sources.
- Hosts that cannot provide this separation should degrade gracefully and state the limitation in their adapter capability matrix.
