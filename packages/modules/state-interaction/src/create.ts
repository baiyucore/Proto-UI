import { createModule, defineModule } from '@proto.ui/module-base';
import type { ModuleFactoryArgs } from '@proto.ui/module-base';
import type { InteractionStateName } from '@proto.ui/core';
import type { EventPort } from '@proto.ui/module-event';
import type { StateFacade, StatePort } from '@proto.ui/module-state';
import type { StateInteractionFacade, StateInteractionModule } from './types';

class StateInteractionModuleImpl {
  private readonly handles = new Map<InteractionStateName, any>();
  private keyboardModality = false;

  constructor(
    private readonly stateFacade: StateFacade,
    private readonly statePort: StatePort,
    private readonly eventPort: EventPort
  ) {}

  get(name: InteractionStateName) {
    const existing = this.handles.get(name);
    if (existing) return existing;

    const owned = this.stateFacade.bool(`@interaction/${name}`, false);
    const borrowed = this.statePort.createBorrowedHandle<boolean>(owned);
    (borrowed as any).__stateId = (owned as any).__stateId;
    (borrowed as any).__stateSemantic = (owned as any).__stateSemantic;
    (borrowed as any).__stateKind = (owned as any).__stateKind;
    (borrowed as any).__stateSpec = (owned as any).__stateSpec;

    this.handles.set(name, borrowed);
    this.wireInteractionState(name, borrowed);
    return borrowed;
  }

  private wireInteractionState(
    name: InteractionStateName,
    state: {
      get(): boolean;
      set(v: boolean, reason?: unknown): void;
      watch(cb: (ctx: unknown, event: unknown) => void): unknown;
    }
  ) {
    switch (name) {
      case 'hovered': {
        this.eventPort.on('pointer.enter', () => {
          if (this.isDisabled()) return;
          state.set(true, 'reason: state-interaction.pointer.enter => hovered');
        });
        this.eventPort.on('pointer.leave', () => {
          state.set(false, 'reason: state-interaction.pointer.leave => hovered');
        });
        this.eventPort.on('pointer.cancel', () => {
          state.set(false, 'reason: state-interaction.pointer.cancel => hovered');
        });
        return;
      }

      case 'pressed': {
        this.eventPort.on('pointer.down', () => {
          if (this.isDisabled()) return;
          state.set(true, 'reason: state-interaction.pointer.down => pressed');
        });
        this.eventPort.on('pointer.up', () => {
          state.set(false, 'reason: state-interaction.pointer.up => pressed');
        });
        this.eventPort.on('pointer.cancel', () => {
          state.set(false, 'reason: state-interaction.pointer.cancel => pressed');
        });
        this.eventPort.on('pointer.leave', () => {
          state.set(false, 'reason: state-interaction.pointer.leave => pressed');
        });
        this.eventPort.on('press.commit', () => {
          state.set(false, 'reason: state-interaction.press.commit => pressed');
        });
        return;
      }

      case 'focused': {
        this.eventPort.on('host:focus', () => {
          if (this.isDisabled()) return;
          state.set(true, 'reason: state-interaction.host:focus => focused');
        });
        this.eventPort.on('host:blur', () => {
          state.set(false, 'reason: state-interaction.host:blur => focused');
        });
        return;
      }

      case 'focusVisible': {
        this.eventPort.onGlobal('key.down', () => {
          this.keyboardModality = true;
        });
        this.eventPort.on('pointer.down', () => {
          this.keyboardModality = false;
        });
        this.eventPort.on('host:focus', () => {
          if (this.isDisabled()) return;
          state.set(this.keyboardModality, 'reason: state-interaction.host:focus => focusVisible');
        });
        this.eventPort.on('host:blur', () => {
          state.set(false, 'reason: state-interaction.host:blur => focusVisible');
        });
        return;
      }

      case 'disabled':
        state.watch((_ctx: unknown, event: any) => {
          if (event?.type !== 'next' || event.next !== true) return;
          this.clearTransientInteractionStates('reason: state-interaction.disabled => reset');
        });
        return;
    }
  }

  private isDisabled() {
    return this.handles.get('disabled')?.get?.() === true;
  }

  private clearTransientInteractionStates(reason: string) {
    for (const name of ['hovered', 'pressed', 'focused', 'focusVisible'] as const) {
      this.handles.get(name)?.set?.(false, reason);
    }
  }
}

export function createStateInteractionModule(ctx: ModuleFactoryArgs): StateInteractionModule {
  const { init, caps, deps } = ctx;

  return createModule<'state-interaction', 'instance', StateInteractionFacade>({
    name: 'state-interaction',
    scope: 'instance',
    init,
    caps,
    deps,
    build: ({ deps }) => {
      const stateFacade = deps.requireFacade<StateFacade>('state');
      const statePort = deps.requirePort<StatePort>('state');
      const eventPort = deps.requirePort<EventPort>('event');
      const impl = new StateInteractionModuleImpl(stateFacade, statePort, eventPort);

      return {
        facade: {
          get: (name) => impl.get(name),
        },
      };
    },
  });
}

export const StateInteractionModuleDef = defineModule({
  name: 'state-interaction',
  deps: ['state', 'event'],
  create: createStateInteractionModule,
});
