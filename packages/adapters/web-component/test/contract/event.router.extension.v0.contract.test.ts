// packages/adapters/web-component/test/contract/event.router.extension.v0.contract.test.ts
import { describe, it, expect } from 'vitest';
import { createWebProtoEventRouter } from '@proto.ui/adapter-base';

describe('contract: adapter-web-component / event router extension events (v0)', () => {
  it('host:* MUST be supported: click -> host:click', () => {
    const el = document.createElement('div');
    const global = new EventTarget();

    const r = createWebProtoEventRouter({
      rootEl: el,
      globalEl: global,
      isEnabled: () => true,
    });

    let got: any = null;
    r.rootTarget.addEventListener('host:click', (e: any) => (got = e));

    const click = new MouseEvent('click', { bubbles: true });
    el.dispatchEvent(click);

    expect(got).not.toBeNull();
    expect(got).toBe(click);

    r.dispose();
  });
});
