import { describe, expect, it } from 'vitest';
import { tw, type Prototype } from '@proto.ui/core';

import { createMountedVueAdapter, flushVue } from './utils/vue';

describe('adapter-vue: feedback style', () => {
  it('applies feedback tokens onto host root and preserves user classes', async () => {
    const proto: Prototype = {
      name: 'vue-feedback-style',
      setup(def) {
        def.feedback.style.use(tw('opacity-50 bg-red-500'));
        return (r) => [r.el('div', 'ok')];
      },
    };

    const mounted = createMountedVueAdapter(proto, {
      hostClass: 'user-a',
      class: 'user-b',
    });

    await flushVue();

    expect(mounted.root?.classList.contains('user-a')).toBe(true);
    expect(mounted.root?.classList.contains('user-b')).toBe(true);
    expect(mounted.root?.classList.contains('opacity-50')).toBe(false);
    expect(mounted.root?.classList.contains('bg-red-500')).toBe(false);
    expect(mounted.root?.getAttribute('data-pui-root')).toBe('');
    expect(mounted.root?.getAttribute('data-pui-style')?.split(/\s+/)).toEqual([
      'opacity-50',
      'bg-red-500',
    ]);

    mounted.unmount();
  });
});
