import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createPublishManifest } from '../lib.mjs';

test('workspace dependencies use their own package versions when publishing a single package', () => {
  const manifest = createPublishManifest(
    {
      name: '@proto.ui/adapter-react',
      version: '0.1.1',
      manifest: {
        name: '@proto.ui/adapter-react',
        version: '0.1.1',
        type: 'module',
        dependencies: {
          '@proto.ui/core': 'workspace:*',
          '@proto.ui/runtime': 'workspace:*',
        },
        peerDependencies: {
          '@proto.ui/types': 'workspace:*',
        },
        exports: {
          '.': {
            types: './src/index.ts',
            default: './src/index.ts',
          },
        },
      },
    },
    {
      access: 'public',
      packageVersions: new Map([
        ['@proto.ui/adapter-react', '0.1.1'],
        ['@proto.ui/core', '0.1.0'],
        ['@proto.ui/runtime', '0.1.0'],
        ['@proto.ui/types', '0.1.0'],
      ]),
    }
  );

  assert.equal(manifest.version, '0.1.1');
  assert.equal(manifest.dependencies['@proto.ui/core'], '^0.1.0');
  assert.equal(manifest.dependencies['@proto.ui/runtime'], '^0.1.0');
  assert.equal(manifest.peerDependencies['@proto.ui/types'], '^0.1.0');
});
