import { formatInstallCommand, type PackageManager } from './package-manager.js';
import type { Adapter } from '../registry/adapters.js';

export function ensureRuntimePackages({
  adapter,
  projectPkg,
  packageManager,
}: {
  adapter: Adapter;
  projectPkg: Record<string, unknown> | null;
  packageManager: PackageManager;
}): void {
  const missing = adapter.runtimePackages.filter((pkg) => !hasProjectPackage(projectPkg, pkg));

  if (missing.length === 0) return;

  const installLine = formatInstallCommand(packageManager, runtimeInstallHint(adapter.id, missing));
  throw new Error(
    [
      `[proto-ui] ${adapter.label} runtime is required for adapter "${adapter.id}".`,
      '',
      'Missing dependency:',
      ...missing.map((pkg) => `  ${pkg}`),
      '',
      'Install it first:',
      `  ${installLine}`,
    ].join('\n')
  );
}

function hasProjectPackage(
  projectPkg: Record<string, unknown> | null,
  packageName: string
): boolean {
  if (!projectPkg) return false;
  const deps = projectPkg.dependencies as Record<string, unknown> | undefined;
  const devDeps = projectPkg.devDependencies as Record<string, unknown> | undefined;
  const peerDeps = projectPkg.peerDependencies as Record<string, unknown> | undefined;
  const optDeps = projectPkg.optionalDependencies as Record<string, unknown> | undefined;
  return Boolean(
    deps?.[packageName] ||
    devDeps?.[packageName] ||
    peerDeps?.[packageName] ||
    optDeps?.[packageName]
  );
}

function runtimeInstallHint(adapterId: string, missing: string[]): string[] {
  if (adapterId === 'react' && missing.includes('react')) {
    return ['react', 'react-dom'];
  }
  return missing;
}
