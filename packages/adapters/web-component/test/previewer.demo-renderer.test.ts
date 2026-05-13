import { describe, expect, it } from 'vitest';
import { loadPrototypes } from '../../../../apps/www/src/components/PrototypePreviewer/prototype-modules';
import { renderDemo } from '../../../../apps/www/src/components/PrototypePreviewer/demo-renderer';
import demo from '../../../../apps/www/src/content/docs/demo_components/tabs/demo-shadcn-tabs.demo';

function styleContains(el: Element | null, token: string): boolean {
  return (el?.getAttribute('data-pui-style') ?? '').split(/\s+/).includes(token);
}

describe('PrototypePreviewer demo-renderer / wc', () => {
  it('renders shadcn tabs parts with host styles in demo wc mode', async () => {
    await loadPrototypes([
      'shadcn-button',
      'shadcn-tabs-root',
      'shadcn-tabs-list',
      'shadcn-tabs-trigger',
      'shadcn-tabs-content',
    ]);

    const host = document.createElement('div');
    document.body.appendChild(host);

    const session = await renderDemo({
      runtime: 'wc',
      demo: demo as any,
      host,
    });

    await Promise.resolve();
    await Promise.resolve();

    const root = host.querySelector('wc-shadcn-tabs-root') as HTMLElement | null;
    const list = host.querySelector('wc-shadcn-tabs-list') as HTMLElement | null;
    const trigger = host.querySelector('wc-shadcn-tabs-trigger') as HTMLElement | null;
    const content = host.querySelector('wc-shadcn-tabs-content') as HTMLElement | null;

    expect(root).not.toBeNull();
    expect(list).not.toBeNull();
    expect(trigger).not.toBeNull();
    expect(content).not.toBeNull();
    expect(styleContains(root, 'flex')).toBe(true);
    expect(root?.className).toContain('w-[420px]');
    expect(styleContains(list, 'inline-flex')).toBe(true);
    expect(styleContains(trigger, 'rounded-lg')).toBe(true);
    expect(styleContains(content, 'min-h-28')).toBe(true);

    await session.destroy();
    host.remove();
  });
});
