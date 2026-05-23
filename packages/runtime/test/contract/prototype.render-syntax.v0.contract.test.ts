import { PROTOTYPE_RENDER_SYNTAX_CASES } from '@proto.ui/spec-fixtures/core/prototype-render-syntax';
import type { Prototype } from '@proto.ui/core';
import { describe, expect, it } from 'vitest';
import { createRuntimeInstance, executeWithHost, type RuntimeHost } from '../../src';

function caseTitle(specCase: string, fallback: string): string {
  return (
    PROTOTYPE_RENDER_SYNTAX_CASES.find((testCase) => testCase.specCase === specCase)?.title ??
    fallback
  );
}

describe('contract: runtime / prototype render syntax (v0)', () => {
  it(caseTitle('T-CORE-SYNTAX-0001-CASE-SETUP-DEF', 'setup receives the definition handle'), () => {
    let seenDef: any;

    const proto: Prototype = {
      name: 'x-runtime-setup-def',
      setup(def) {
        seenDef = def;
        return () => null;
      },
    };

    createRuntimeInstance(proto);

    expect(typeof seenDef.lifecycle?.onCreated).toBe('function');
    expect(typeof seenDef.props?.define).toBe('function');
    expect(typeof seenDef.update).toBe('undefined');
  });

  it(
    caseTitle(
      'T-CORE-SYNTAX-0001-CASE-SETUP-RETURN-RENDER',
      'setup-returned function becomes render'
    ),
    () => {
      const proto: Prototype = {
        name: 'x-runtime-return-render',
        setup() {
          return (renderer) => renderer.el('div', 'from-render');
        },
      };

      const instance = createRuntimeInstance(proto);

      expect(instance.renderOnce()).toEqual({
        type: 'div',
        style: undefined,
        children: 'from-render',
      });
    }
  );

  it(
    caseTitle(
      'T-CORE-SYNTAX-0001-CASE-SETUP-VOID-DEFAULT',
      'void setup return uses default slot render'
    ),
    () => {
      const proto: Prototype = {
        name: 'x-runtime-default-slot',
        setup() {},
      };

      const instance = createRuntimeInstance(proto);

      expect(instance.renderOnce()).toEqual([
        { type: { kind: 'slot' }, style: undefined, children: null },
      ]);
    }
  );

  it(
    caseTitle(
      'T-CORE-SYNTAX-0001-CASE-RENDER-HANDLE',
      'render receives renderer handle and returns TemplateChildren'
    ),
    () => {
      let seenRenderer: any;

      const proto: Prototype = {
        name: 'x-runtime-renderer-handle',
        setup() {
          return (renderer) => {
            seenRenderer = renderer;
            return [renderer.el('span', 'a'), renderer.el('span', 'b')];
          };
        },
      };

      const instance = createRuntimeInstance(proto);

      expect(instance.renderOnce()).toEqual([
        { type: 'span', style: undefined, children: 'a' },
        { type: 'span', style: undefined, children: 'b' },
      ]);
      expect(typeof seenRenderer.el).toBe('function');
      expect(typeof seenRenderer.slot).toBe('function');
      expect(typeof seenRenderer.r.slot).toBe('function');
      expect(typeof seenRenderer.svg.root).toBe('function');
    }
  );

  it(
    caseTitle(
      'T-CORE-SYNTAX-0001-CASE-RENDER-READ',
      'renderer read exposes current props without update entry'
    ),
    () => {
      const commits: unknown[] = [];
      const host: RuntimeHost<{ label: string }> = {
        prototypeName: 'x-runtime-render-read',
        getRawProps() {
          return { label: 'from-host' };
        },
        commit(children, signal) {
          commits.push(children);
          signal?.done();
        },
        schedule(task) {
          task();
        },
      };

      const proto: Prototype<{ label: string }> = {
        name: 'x-runtime-render-read',
        setup(def) {
          def.props.define({ label: { type: 'string', default: 'fallback' } });

          return (renderer: any) => {
            expect(typeof renderer.read.props.get).toBe('function');
            expect(typeof renderer.read.props.getRaw).toBe('function');
            expect(typeof renderer.read.props.isProvided).toBe('function');
            expect(typeof renderer.update).toBe('undefined');
            expect(renderer.read.props.get()).toEqual({ label: 'from-host' });
            expect(renderer.read.props.isProvided('label')).toBe(true);
            return renderer.el('div', renderer.read.props.get().label);
          };
        },
      };

      executeWithHost(proto, host);

      expect(commits).toEqual([{ type: 'div', style: undefined, children: 'from-host' }]);
    }
  );
});
