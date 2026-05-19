import { describeAdapterResolvedSnapshotShapeConformance } from '../../../base/test-utils/resolved-snapshot-shape';
import { createVueAdapter } from '../../src/adapt';
import { flushVue, VueAny } from '../utils/vue';

describeAdapterResolvedSnapshotShapeConformance({
  adapterName: 'adapter-vue',
  async mount(proto, props) {
    const adapter = createVueAdapter(VueAny);
    const Component = adapter(proto);
    const host = document.createElement('div');
    const state = VueAny.reactive({ ...props });

    document.body.appendChild(host);

    const Root = VueAny.defineComponent({
      setup() {
        return () => VueAny.h(Component, { ...state });
      },
    });

    const app = VueAny.createApp(Root);
    app.mount(host);
    await flushVue();

    return {
      async updateProps(nextProps) {
        for (const key of Object.keys(state)) {
          if (!(key in nextProps)) delete state[key];
        }
        Object.assign(state, nextProps);
        await flushVue();
      },
      async unmount() {
        app.unmount();
        await flushVue();
        host.remove();
      },
    };
  },
});
