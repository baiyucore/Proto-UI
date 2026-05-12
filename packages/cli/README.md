# @proto.ui/cli

Proto UI command line tooling for initializing a local `proto-ui/` workspace, generating adapter-specific component facades, and writing Proto UI style preset files.

## Usage

Initialize the local workspace:

```bash
npx @proto.ui/cli init
```

Add a component for a host adapter:

```bash
npx @proto.ui/cli add react shadcn-button
```

The generated component facade is written under:

```txt
proto-ui/components/<host>/index.ts
```

For example, React users can import from the generated host entry:

```tsx
import { Button } from '../proto-ui/components/react';
```

## Commands

```bash
proto-ui init [--root-dir <dir>] [--styles-dir <dir>] [--no-styles] [--no-interactive]
proto-ui add <host> <component> [--root-dir <dir>] [--no-install] [--no-interactive]
```

Supported hosts:

- `react`
- `vue`
- `wc`

The CLI also writes concrete Proto UI CSS for prototype style tokens:

```bash
proto-ui shadcn --styles-dir ./src/styles
proto-ui tokens --input ./packages/prototypes --out ./src/styles/proto-ui-tokens.generated.css
proto-ui style --out ./src/styles/proto-ui-style.css
proto-ui theme shadcn --out ./src/styles/shadcn-theme.css
```

## Current Scope

The v0 CLI installs Proto UI adapter/prototype packages through the project package manager and generates local component facade files.

It does not yet vendor styled prototype source into the user project. That remains a planned follow-up path for editable styled libraries such as shadcn.
