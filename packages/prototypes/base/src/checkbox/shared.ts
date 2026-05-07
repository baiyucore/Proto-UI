import { createAnatomyFamily } from '@proto.ui/core';

export const CHECKBOX_FAMILY = createAnatomyFamily('base-checkbox', {
  roles: {
    root: { cardinality: { min: 1, max: 1 } },
    indicator: { cardinality: { min: 1, max: 100 } },
  },
  relations: [{ kind: 'contains', parent: 'root', child: 'indicator' }],
});
