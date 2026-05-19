import { describeAdapterResolvedSnapshotShapeConformance } from '../../../base/test-utils/resolved-snapshot-shape';
import { AdaptToWebComponent } from '../../src/adapt';
import { setElementProps } from '../../src/props';

async function flushWebComponentAdapter() {
  await Promise.resolve();
  await Promise.resolve();
}

describeAdapterResolvedSnapshotShapeConformance({
  adapterName: 'adapter-web-component',
  async mount(proto, props) {
    const tagName = proto.name;
    const Ctor = AdaptToWebComponent(proto, {
      register: false,
      registerAs: tagName,
    });

    if (!customElements.get(tagName)) {
      customElements.define(tagName, Ctor);
    }

    const el = document.createElement(tagName) as HTMLElement & {
      update?: () => void;
    };

    setElementProps(el, props);
    document.body.appendChild(el);
    await flushWebComponentAdapter();

    return {
      async updateProps(nextProps) {
        setElementProps(el, nextProps);
        el.update?.();
        await flushWebComponentAdapter();
      },
      async unmount() {
        el.remove();
        await flushWebComponentAdapter();
      },
    };
  },
});
