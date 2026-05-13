import { describe, expect, it } from 'vitest';
import { styleContains } from '../../test-utils/style';
import { AdaptToWebComponent } from '@proto.ui/adapter-web-component';
import { hoverCardContent, hoverCardRoot, hoverCardTrigger } from '../src/hover-card';

AdaptToWebComponent(hoverCardRoot as any);
AdaptToWebComponent(hoverCardTrigger as any);
AdaptToWebComponent(hoverCardContent as any);

describe('prototypes/shadcn: hover-card', () => {
  it('styles and opens a hover-card compound prototype', async () => {
    const root = document.createElement('shadcn-hover-card-root') as any;
    const trigger = document.createElement('shadcn-hover-card-trigger') as any;
    const content = document.createElement('shadcn-hover-card-content') as any;

    root.appendChild(trigger);
    root.appendChild(content);
    document.body.appendChild(root);

    await Promise.resolve();
    await Promise.resolve();

    expect(styleContains(trigger, 'rounded-md')).toBe(true);
    expect(styleContains(content, 'hidden')).toBe(true);

    trigger.dispatchEvent(new Event('pointerenter'));
    await Promise.resolve();

    expect(root.getExposes().open.get()).toBe(true);
    expect(styleContains(content, 'rounded-xl')).toBe(true);
    expect(styleContains(content, 'shadow-lg')).toBe(true);
    expect(styleContains(content, 'hidden')).toBe(false);

    content.dispatchEvent(new Event('pointerleave'));
    trigger.dispatchEvent(new Event('pointerleave'));
    await Promise.resolve();

    expect(root.getExposes().open.get()).toBe(false);

    root.remove();
    await Promise.resolve();
  });
});
