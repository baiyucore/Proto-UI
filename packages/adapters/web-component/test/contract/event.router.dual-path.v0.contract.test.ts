// packages/adapters/web-component/test/contract/event.router.dual-path.v0.contract.test.ts
import { describe, it, expect } from 'vitest';
import { createWebProtoEventRouter } from '@proto.ui/adapter-base';

describe('contract: adapter-web-component / event router dual-path (v0)', () => {
  it('host:* and proto semantic can coexist for same native trigger', () => {
    const el = document.createElement('div');
    const router = createWebProtoEventRouter({
      rootEl: el,
      globalEl: window,
      isEnabled: () => true,
    });

    const seen: string[] = [];

    router.rootTarget.addEventListener('host:click' as any, () => seen.push('host'));
    router.rootTarget.addEventListener('press.commit' as any, () => seen.push('proto'));

    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // 不强制顺序（实现细节），只要都发生
    expect(seen.sort()).toEqual(['host', 'proto']);

    router.dispose();
  });
});
