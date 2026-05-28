# D-EXPOSE-METHOD-CALL-0001: Expose method invocation shape remains open

`def.expose.method(key, fn)` currently models an App-Maker-callable component capability. In JavaScript/Web hosts, exposing a direct function is natural and useful, but direct function references may not be the best portable model for every host.

The open design question is whether Proto UI should eventually abstract expose method calls as message invocation, and if so, where that abstraction belongs:

- in the prototype-author API shape;
- in the translation layer;
- or in adapter-specific mapping only.

For v0, expose method remains a callable capability. Contracts should not require every host to implement it as a direct JavaScript function reference.
