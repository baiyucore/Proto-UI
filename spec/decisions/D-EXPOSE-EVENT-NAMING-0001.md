# D-EXPOSE-EVENT-NAMING-0001: Expose event naming remains outward-signal debt

`def.expose.event(...)` is semantically a Component -> App Maker outward signal. This differs from the Event channel, which is User -> Component input.

The word `event` is intuitive for React, Vue, and Web Component developers, but it can also imply the wrong information-flow direction. The word `signal` is semantically clearer, but less familiar as a frontend API category.

For v0, the API name remains `expose.event`, and contracts describe it as an outward signal. Future work may decide whether the public API should migrate to `expose.signal`.
