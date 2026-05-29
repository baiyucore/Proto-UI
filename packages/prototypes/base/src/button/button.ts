import type { DefHandle } from '@proto.ui/core';
import { defineAsHook, definePrototype } from '@proto.ui/core';
import { asFocusable, asTrigger } from '@proto.ui/hooks';
import type { ButtonAsHookContract, ButtonExposes, ButtonProps, ButtonStateHandles } from './types';

export type { ButtonProps, ButtonExposes, ButtonStateHandles, ButtonAsHookContract } from './types';

function setupButton(def: DefHandle<ButtonProps, ButtonExposes>): void {
  asTrigger();

  def.props.define({
    disabled: { type: 'boolean', empty: 'fallback' },
  });
  def.props.setDefaults({
    disabled: false,
  });

  const disabled = def.state.fromInteraction('disabled');
  def.expose.state('disabled', disabled);
  const focusable = asFocusable({ disabled: false });
  const hovered = def.state.fromInteraction('hovered');
  const focused = def.state.fromInteraction('focused');
  const focusVisible = def.state.fromInteraction('focusVisible');
  const pressed = def.state.fromInteraction('pressed');

  const syncDisabled = (nextDisabled: boolean) => {
    disabled.set(nextDisabled, 'reason: sync disabled');
    focusable.setDisabled(nextDisabled);
  };

  def.lifecycle.onCreated((run) => {
    syncDisabled(!!run.props.get().disabled);
  });

  def.props.watch(['disabled'], (_run, next) => {
    syncDisabled(!!next.disabled);
  });

  def.expose.state('hovered', hovered);

  focused.watch((_run, event) => {
    if (event.type === 'disconnect') {
      focusable.blur();
      return;
    }
    if (event.next) {
      focusable.focus({ reason: focusVisible.get() ? 'keyboard' : 'programmatic' });
      return;
    }
    focusable.blur();
  });
  focusVisible.watch((_run, event) => {
    if (event.type === 'disconnect') {
      focusable.blur();
      return;
    }
    if (!focused.get()) return;
    focusable.focus({ reason: event.next ? 'keyboard' : 'programmatic' });
  });
  def.expose.state('focused', focused);
  def.expose.state('focusVisible', focusVisible);
  def.expose.method('focusSelf', (options) => {
    if (disabled.get()) return;
    focusable.focusSelf(options);
  });

  def.expose.state('pressed', pressed);

  def.expose.event('click', { payload: 'void' });
  def.event.on('press.commit', (run) => {
    if (disabled.get()) return;
    run.expose.emit('click');
  });
}

export const asButton = defineAsHook<ButtonProps, ButtonExposes, ButtonAsHookContract, void>({
  name: 'as-button',
  mode: 'once',
  setup: setupButton,
});

const button = definePrototype({
  name: 'base-button',
  setup: setupButton,
});

export default button;
