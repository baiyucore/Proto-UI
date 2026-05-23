import { definePrototype, tw } from '@proto.ui/core';
import { asToggle } from '@proto.ui/prototypes-base';
import type { ShadcnToggleExposes, ShadcnToggleProps } from './types';

const TOGGLE_BASE_TOKENS = [
  'group/toggle',
  'inline-flex',
  'items-center',
  'justify-center',
  'gap-1',
  'rounded-lg',
  'text-sm',
  'font-medium',
  'transition-all',
  'outline-none',
  'border',
  'whitespace-nowrap',
].join(' ');

const VARIANT_TOKENS: Record<NonNullable<ShadcnToggleProps['variant']>, string> = {
  default: 'border-transparent bg-transparent text-foreground',
  outline: 'border-input bg-transparent text-foreground',
};

const SIZE_TOKENS: Record<NonNullable<ShadcnToggleProps['size']>, string> = {
  default: 'h-8 min-w-8 px-2.5',
  sm: 'h-7 min-w-7 px-2',
  lg: 'h-9 min-w-9 px-3',
};

const toggle = definePrototype<ShadcnToggleProps, ShadcnToggleExposes>({
  name: 'shadcn-toggle',
  setup(def) {
    def.props.define({
      variant: { type: 'enum', empty: 'fallback', options: ['default', 'outline'] },
      size: { type: 'enum', empty: 'fallback', options: ['default', 'sm', 'lg'] },
      checked: { type: 'boolean', empty: 'fallback' },
      defaultChecked: { type: 'boolean', empty: 'fallback' },
      disabled: { type: 'boolean', empty: 'fallback' },
    });
    def.props.setDefaults({
      variant: 'default',
      size: 'default',
      defaultChecked: false,
      disabled: false,
    });

    asToggle();

    const checked = def.state.fromAccessibility('checked');
    const disabled = def.state.fromInteraction('disabled');
    const hovered = def.state.fromInteraction('hovered');
    const focusVisible = def.state.fromInteraction('focusVisible');

    def.feedback.style.use(tw(TOGGLE_BASE_TOKENS));

    (Object.keys(VARIANT_TOKENS) as Array<NonNullable<ShadcnToggleProps['variant']>>).forEach(
      (variant) => {
        def.rule({
          when: (w: any) => w.prop('variant').eq(variant),
          intent: (i: any) => i.feedback.style.use(tw(VARIANT_TOKENS[variant])),
        });
      }
    );

    (Object.keys(SIZE_TOKENS) as Array<NonNullable<ShadcnToggleProps['size']>>).forEach((size) => {
      def.rule({
        when: (w: any) => w.prop('size').eq(size),
        intent: (i: any) => i.feedback.style.use(tw(SIZE_TOKENS[size])),
      });
    });

    def.rule({
      when: (w: any) => w.state(checked).eq(true),
      intent: (i: any) => i.feedback.style.use(tw('bg-muted')),
    });

    def.rule({
      when: (w: any) => w.all(w.state(hovered).eq(true), w.state(checked).eq(false)),
      intent: (i: any) => i.feedback.style.use(tw('bg-muted text-foreground')),
    });

    def.rule({
      when: (w: any) => w.state(focusVisible).eq(true),
      intent: (i: any) => i.feedback.style.use(tw('border-ring ring-3 ring-ring/50')),
    });

    def.rule({
      when: (w: any) => w.state(disabled).eq(true),
      intent: (i: any) => i.feedback.style.use(tw('pointer-events-none opacity-50')),
    });
  },
});

export type {
  ShadcnToggleProps,
  ShadcnToggleExposes,
  ShadcnToggleStateHandles,
  ShadcnToggleAsHookContract,
} from './types';
export default toggle;
