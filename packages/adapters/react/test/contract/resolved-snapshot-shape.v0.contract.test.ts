import { describeAdapterResolvedSnapshotShapeConformance } from '../../../base/test-utils/resolved-snapshot-shape';
import { createMountedReactAdapter } from '../utils/fake-react';

describeAdapterResolvedSnapshotShapeConformance({
  adapterName: 'adapter-react',
  mount(proto, props) {
    const mounted = createMountedReactAdapter(proto, props);

    return {
      updateProps(nextProps) {
        mounted.update(nextProps);
      },
      unmount() {
        mounted.unmount();
      },
    };
  },
});
