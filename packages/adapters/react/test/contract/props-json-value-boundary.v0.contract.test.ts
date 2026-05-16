import { describeAdapterPropsJsonValueBoundaryConformance } from '../../../base/test-utils/props-json-value-boundary';
import { createMountedReactAdapter } from '../utils/fake-react';

describeAdapterPropsJsonValueBoundaryConformance({
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
