import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { fileExists, readJsonFile } from '../utils/fs.js';

export type PackageManager = 'npm' | 'pnpm' | 'yarn';

export async function detectPackageManager(cwd: string): Promise<PackageManager> {
  if (await fileExists(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (await fileExists(path.join(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

export function formatInstallCommand(
  pm: PackageManager,
  packages: string[],
  { dev = false }: { dev?: boolean } = {}
): string {
  const list = packages.join(' ');
  if (pm === 'pnpm') return dev ? `pnpm add -D ${list}` : `pnpm add ${list}`;
  if (pm === 'yarn') return dev ? `yarn add -D ${list}` : `yarn add ${list}`;
  return dev ? `npm install --save-dev ${list}` : `npm install --save ${list}`;
}

export function installPackages(
  pm: PackageManager,
  cwd: string,
  packages: string[],
  { dev = false }: { dev?: boolean } = {}
): void {
  if (packages.length === 0) return;

  let cmd = 'npm';
  let args: string[];
  if (pm === 'pnpm') {
    cmd = 'pnpm';
    args = dev ? ['add', '-D', ...packages] : ['add', ...packages];
  } else if (pm === 'yarn') {
    cmd = 'yarn';
    args = dev ? ['add', '-D', ...packages] : ['add', ...packages];
  } else if (dev) {
    args = ['install', '--save-dev', ...packages];
  } else {
    args = ['install', '--save', ...packages];
  }

  // Windows: spawnSync needs shell:true to resolve npm/yarn/pnpm via .cmd shims.
  // Node 18.20+ blocks .cmd/.bat under shell:false (CVE-2024-27980 mitigation).
  const isWindows = process.platform === 'win32';
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: isWindows,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited with code ${result.status ?? 'unknown'}`);
  }
}

export async function readProjectPackageJson(cwd: string): Promise<Record<string, unknown> | null> {
  const packageJsonPath = path.join(cwd, 'package.json');
  if (!(await fileExists(packageJsonPath))) return null;
  return readJsonFile(packageJsonPath) as Promise<Record<string, unknown>>;
}

export function hasPackage(
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
