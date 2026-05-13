import path from 'node:path';

import {
  CONFIG_VERSION,
  DEFAULT_ROOT_DIR,
  DEFAULT_STYLES_DIR,
  DEFAULT_STYLE_PRESET,
} from './defaults.js';
import { ensureDir, fileExists, readJsonFile, writeJsonFile } from '../utils/fs.js';

export interface CliConfig {
  version: number;
  rootDir: string;
  stylesDir: string;
  styles: {
    enabled: boolean;
    preset: string | null;
  };
  adapters: Record<string, { package: string }>;
  components: Record<string, string[]>;
}

export interface ConfigPaths {
  rootDir: string;
  rootAbs: string;
  configPath: string;
  componentsDir: string;
  adaptersDir: string;
  prototypesDir: string;
}

export function createDefaultConfig({
  rootDir = DEFAULT_ROOT_DIR,
  stylesDir = DEFAULT_STYLES_DIR,
  stylesEnabled = true,
}: {
  rootDir?: string;
  stylesDir?: string;
  stylesEnabled?: boolean;
} = {}): CliConfig {
  return {
    version: CONFIG_VERSION,
    rootDir,
    stylesDir,
    styles: {
      enabled: stylesEnabled,
      preset: stylesEnabled ? DEFAULT_STYLE_PRESET : null,
    },
    adapters: {},
    components: {},
  };
}

export function mergeConfig(baseConfig: CliConfig, nextConfig: Partial<CliConfig>): CliConfig {
  const merged: CliConfig = {
    ...baseConfig,
    ...nextConfig,
    styles: {
      ...baseConfig.styles,
      ...nextConfig.styles,
    },
    adapters: {
      ...(baseConfig.adapters ?? {}),
      ...(nextConfig.adapters ?? {}),
    },
    components: {},
  };

  const hosts = new Set([
    ...Object.keys(baseConfig.components ?? {}),
    ...Object.keys(nextConfig.components ?? {}),
  ]);

  for (const host of hosts) {
    const values = [
      ...new Set([
        ...(baseConfig.components?.[host] ?? []),
        ...(nextConfig.components?.[host] ?? []),
      ]),
    ].sort();

    if (values.length > 0) merged.components[host] = values;
  }

  return merged;
}

export function resolveConfigPaths(cwd: string, rootDir = DEFAULT_ROOT_DIR): ConfigPaths {
  const rootAbs = path.resolve(cwd, rootDir);
  return {
    rootDir,
    rootAbs,
    configPath: path.join(rootAbs, 'config.json'),
    componentsDir: path.join(rootAbs, 'components'),
    adaptersDir: path.join(rootAbs, 'adapters'),
    prototypesDir: path.join(rootAbs, 'prototypes'),
  };
}

export async function loadCliConfig(
  cwd: string,
  rootDir = DEFAULT_ROOT_DIR
): Promise<{ config: CliConfig | null; paths: ConfigPaths }> {
  const paths = resolveConfigPaths(cwd, rootDir);
  if (!(await fileExists(paths.configPath))) {
    return { config: null, paths };
  }
  const config = (await readJsonFile(paths.configPath)) as CliConfig;
  return { config, paths };
}

export async function saveCliConfig(cwd: string, config: CliConfig): Promise<ConfigPaths> {
  const paths = resolveConfigPaths(cwd, config.rootDir ?? DEFAULT_ROOT_DIR);
  await ensureDir(paths.rootAbs);
  await writeJsonFile(paths.configPath, config);
  return paths;
}

export function addComponentToConfig(
  config: CliConfig,
  host: string,
  componentId: string,
  adapterPackage: string
): CliConfig {
  const next = structuredClone(config);
  next.adapters = next.adapters ?? {};
  next.components = next.components ?? {};

  next.adapters[host] = {
    package: adapterPackage,
  };

  const values = new Set(next.components[host] ?? []);
  values.add(componentId);
  next.components[host] = Array.from(values).sort();
  return next;
}
