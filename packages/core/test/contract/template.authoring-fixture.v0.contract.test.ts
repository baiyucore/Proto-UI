import { TEMPLATE_AUTHORING_CASES } from '@proto.ui/spec-fixtures/template/authoring';
import {
  createRendererPrimitives,
  normalizeChildren,
  tw,
  type TemplateStyleHandle,
} from '../../src';
import { describe, expect, it } from 'vitest';

function caseTitle(specCase: string, fallback: string): string {
  return (
    TEMPLATE_AUTHORING_CASES.find((testCase) => testCase.specCase === specCase)?.title ?? fallback
  );
}

describe('contract: core / template authoring fixture (v0)', () => {
  it(
    caseTitle(
      'T-TEMPLATE-0001-CASE-NODE-STRUCTURE',
      'template node is structural and may carry children and style'
    ),
    () => {
      const { el } = createRendererPrimitives();
      const style = tw('inline-flex items-center') as TemplateStyleHandle;
      const node = el('div', { style }, [el('span', 'child')]);

      expect(node).toEqual({
        type: 'div',
        style,
        children: { type: 'span', style: undefined, children: 'child' },
      });
      expect((node as any).props).toBeUndefined();
      expect((node as any).event).toBeUndefined();
      expect((node as any).state).toBeUndefined();
    }
  );

  it(
    caseTitle(
      'T-TEMPLATE-0001-CASE-EL-DISPATCH',
      'el dispatches children and style-only TemplateProps'
    ),
    () => {
      const { el } = createRendererPrimitives();
      const style = tw('text-sm') as TemplateStyleHandle;

      expect(el('div')).toEqual({ type: 'div', style: undefined, children: null });
      expect(el('div', {})).toEqual({ type: 'div', style: undefined, children: null });
      expect(el('div', 'child')).toEqual({ type: 'div', style: undefined, children: 'child' });
      expect(el('div', { style }, 'child')).toEqual({ type: 'div', style, children: 'child' });

      expect(() => el('div', { id: 'x' } as any, 'child')).toThrow(/illegal template-props/);
      expect(() => el('div', { style: { kind: 'not-style' } } as any, 'child')).toThrow(
        /style must be a TemplateStyleHandle/
      );
    }
  );

  it(
    caseTitle(
      'T-TEMPLATE-0001-CASE-NORMALIZE',
      'TemplateChildren normalization enforces v0 portability'
    ),
    () => {
      const objectChild = { arbitrary: 'object' };

      expect(normalizeChildren(undefined)).toBeNull();
      expect(normalizeChildren(['a', null, ['b', ['c']]])).toEqual(['a', 'b', 'c']);
      expect(normalizeChildren([null, null])).toBeNull();
      expect(normalizeChildren(['single'])).toBe('single');
      expect(normalizeChildren([objectChild])).toBe(objectChild);
      expect(normalizeChildren(['a', null, 'b'], { keepNull: true })).toEqual(['a', null, 'b']);

      expect(() => normalizeChildren([true as any])).toThrow(/boolean child is illegal/);
      expect(() => normalizeChildren(['a', undefined as any])).toThrow(
        /undefined child is illegal/
      );
      expect(() => normalizeChildren(['a'] as any, { flatten: 'none' })).toThrow(
        /array children is not allowed/
      );
      expect(() => normalizeChildren(['a', ['b', ['c']]] as any, { flatten: 'shallow' })).toThrow(
        /nested array children is not allowed/
      );
    }
  );

  it(
    caseTitle('T-TEMPLATE-0001-CASE-SLOT', 'slot is anonymous, singular, and parameterless'),
    () => {
      const { r, slot } = createRendererPrimitives();

      expect(slot()).toEqual({ type: { kind: 'slot' }, style: undefined, children: null });
      expect(r.slot()).toEqual({ type: { kind: 'slot' }, style: undefined, children: null });
      expect(() => (r as any).slot('name')).toThrow(/slot\(\) takes no arguments/);
    }
  );
});
