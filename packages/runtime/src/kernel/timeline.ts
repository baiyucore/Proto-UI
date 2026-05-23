// packages/runtime/src/kernel/timeline.ts

export const CANONICAL_RUNTIME_CHECKPOINTS = [
  'CP0_SETUP_EXIT',
  'CP1_CREATED_CALLBACKS',
  'CP2_LOGICAL_TREE_READY',
  'CP3_COMMIT_START',
  'CP4_COMMIT_DONE',
  'CP5_MOUNTED_CALLBACKS',
  'CP6_UPDATE_RENDER',
  'CP7_UPDATE_COMMIT_DONE',
  'CP8_UPDATED_CALLBACKS',
  'CP9_UNMOUNT_BEGIN',
  'CP10_DISPOSE_COMPLETE',
] as const;

export type RuntimeCheckpoint = (typeof CANONICAL_RUNTIME_CHECKPOINTS)[number];

export type RuntimeTimelineOptions = {
  onMark?: (cp: RuntimeCheckpoint) => void;
};

export type RuntimeTimeline = {
  mark(cp: RuntimeCheckpoint): void;
};

export function createTimeline(options: RuntimeTimelineOptions = {}): RuntimeTimeline {
  const instanceOrder: RuntimeCheckpoint[] = [
    'CP0_SETUP_EXIT',
    'CP1_CREATED_CALLBACKS',
    'CP5_MOUNTED_CALLBACKS',
    'CP9_UNMOUNT_BEGIN',
    'CP10_DISPOSE_COMPLETE',
  ];
  const initialCycleOrder: RuntimeCheckpoint[] = [
    'CP2_LOGICAL_TREE_READY',
    'CP3_COMMIT_START',
    'CP4_COMMIT_DONE',
  ];
  const updateCycleOrder: RuntimeCheckpoint[] = [
    'CP6_UPDATE_RENDER',
    'CP7_UPDATE_COMMIT_DONE',
    'CP8_UPDATED_CALLBACKS',
  ];

  const instanceIndex = new Map(instanceOrder.map((k, i) => [k, i]));
  const initialCycleIndex = new Map(initialCycleOrder.map((k, i) => [k, i]));
  const updateCycleIndex = new Map(updateCycleOrder.map((k, i) => [k, i]));

  let instanceLast = -1;
  let initialCycleLast = -1;
  let updateCycleLast = -1;

  const unmountBeginIndex = instanceIndex.get('CP9_UNMOUNT_BEGIN')!;

  return {
    mark(cp: RuntimeCheckpoint) {
      if (!isRuntimeCheckpoint(cp)) {
        throw new Error(`[Lifecycle] unknown checkpoint: ${cp}`);
      }

      if (initialCycleIndex.has(cp)) {
        if (instanceLast >= unmountBeginIndex) {
          throw new Error(`[Lifecycle] initial checkpoint after unmount: ${cp}`);
        }

        const i = initialCycleIndex.get(cp)!;
        if (i <= initialCycleLast) {
          throw new Error(
            `[Lifecycle] checkpoint out of order (initial cycle): ${cp} after ${initialCycleOrder[initialCycleLast]}`
          );
        }
        initialCycleLast = i;
        options.onMark?.(cp);
        return;
      }

      if (updateCycleIndex.has(cp)) {
        if (instanceLast >= unmountBeginIndex) {
          throw new Error(`[Lifecycle] update checkpoint after unmount: ${cp}`);
        }
        if (initialCycleLast !== initialCycleOrder.length - 1) {
          throw new Error(`[Lifecycle] update checkpoint before initial commit completion: ${cp}`);
        }

        const i = updateCycleIndex.get(cp)!;
        if (cp === 'CP6_UPDATE_RENDER') {
          if (!(updateCycleLast === -1 || updateCycleLast === updateCycleOrder.length - 1)) {
            throw new Error(
              `[Lifecycle] new update cycle started before previous cycle finished: ${cp} after ${updateCycleOrder[updateCycleLast]}`
            );
          }
          updateCycleLast = -1;
        }

        if (i <= updateCycleLast) {
          throw new Error(
            `[Lifecycle] checkpoint out of order (update cycle): ${cp} after ${updateCycleOrder[updateCycleLast]}`
          );
        }

        updateCycleLast = i;
        options.onMark?.(cp);
        return;
      }

      if (instanceIndex.has(cp)) {
        const i = instanceIndex.get(cp)!;

        if (i <= instanceLast) {
          throw new Error(
            `[Lifecycle] checkpoint out of order (instance): ${cp} after ${instanceOrder[instanceLast]}`
          );
        }

        instanceLast = i;
        options.onMark?.(cp);
        return;
      }
    },
  };
}

function isRuntimeCheckpoint(value: string): value is RuntimeCheckpoint {
  return (CANONICAL_RUNTIME_CHECKPOINTS as readonly string[]).includes(value);
}
