export const STYLE_COMMANDS = new Set(['tokens', 'tailwindcss', 'theme']);
export const STYLE_PRESET_NAMES = new Set(['shadcn']);

export async function runLegacyStyleCommand(argv: string[]): Promise<void> {
  const legacy = await import('../legacy/cli.js');
  await (legacy as { run: (argv: string[]) => Promise<void> }).run(argv);
}
