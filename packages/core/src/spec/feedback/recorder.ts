// packages/core/src/spec/feedback/recorder.ts

import type { StyleHandle } from './style';
import { getSemanticGroupKeyV0, mergeTwTokensV0 } from './semantic-merge';
import { assertTwTokenV0 } from './tokens';

export type UnUse = () => void;

type Chunk = {
  id: number;
  tokens: string[]; // flattened tw tokens in order
  removed: boolean;
};

type PatchEntry =
  | {
      kind: 'patch';
      token: string;
    }
  | {
      kind: 'suppress';
    };

export class FeedbackStyleRecorder {
  private nextId = 1;
  private chunks: Chunk[] = [];
  private runtimePatch = new Map<string, PatchEntry>();

  /**
   * setup-only: record style intent tokens (tw handles only)
   */
  use(...handles: StyleHandle[]): UnUse {
    // flatten & validate
    const flattened: string[] = [];
    for (const h of handles) {
      if (!h || h.kind !== 'tw' || !Array.isArray(h.tokens)) {
        throw new Error(`[feedback] unsupported style handle in v0`);
      }
      for (const t of h.tokens) {
        assertTwTokenV0(t, 'feedback.style.use');
        flattened.push(t);
      }
    }

    const chunk: Chunk = {
      id: this.nextId++,
      tokens: flattened,
      removed: false,
    };

    this.chunks.push(chunk);

    const unUse: UnUse = () => {
      chunk.removed = true;
    };

    return unUse;
  }

  /**
   * internal: record style tokens without v0 tw validation.
   * Used by rule extensions that generate selector-based tokens.
   */
  useUnsafe(...handles: StyleHandle[]): UnUse {
    const flattened: string[] = [];
    for (const h of handles) {
      if (!h || h.kind !== 'tw' || !Array.isArray(h.tokens)) {
        throw new Error(`[feedback] unsupported style handle in v0`);
      }
      for (const t of h.tokens) {
        if (typeof t !== 'string' || !t) {
          throw new Error(`[feedback] invalid tw token (unsafe): empty`);
        }
        flattened.push(t);
      }
    }

    const chunk: Chunk = {
      id: this.nextId++,
      tokens: flattened,
      removed: false,
    };

    this.chunks.push(chunk);

    const unUse: UnUse = () => {
      chunk.removed = true;
    };

    return unUse;
  }

  /**
   * runtime-only: write positive style patches over the current base result.
   */
  patch(...handles: StyleHandle[]): void {
    for (const token of this.flattenRuntimePatchHandles(handles, 'run.feedback.style.patch')) {
      this.runtimePatch.set(getSemanticGroupKeyV0(token), { kind: 'patch', token });
    }
  }

  /**
   * runtime-only: suppress semantic groups from the current base result.
   */
  suppress(...handles: StyleHandle[]): void {
    for (const token of this.flattenRuntimePatchHandles(handles, 'run.feedback.style.suppress')) {
      this.runtimePatch.set(getSemanticGroupKeyV0(token), { kind: 'suppress' });
    }
  }

  /**
   * runtime-only: remove every style patch entry for the current instance.
   */
  clearPatch(): void {
    this.runtimePatch.clear();
  }

  /**
   * Export a semantic snapshot of merged tokens.
   *
   * v0 recommendation: export is allowed in any phase (pure snapshot).
   */
  export(): { tokens: string[] } {
    return this.exportWithAdditional();
  }

  /**
   * Export a semantic snapshot after appending additional base style handles,
   * then applying the runtime patch layer.
   *
   * Additional handles are used by rule/runtime internals: they are still part of
   * the pre-patch base semantic result, not host translation artifacts.
   */
  exportWithAdditional(...handles: StyleHandle[]): { tokens: string[] } {
    return this.applyPatchLayer(this.exportBaseTokens(handles));
  }

  exportBase(): { tokens: string[] } {
    return { tokens: this.exportBaseTokens() };
  }

  private exportBaseTokens(additionalHandles: StyleHandle[] = []): string[] {
    const inputs: string[] = [];
    for (const c of this.chunks) {
      if (c.removed) continue;
      inputs.push(...c.tokens);
    }
    for (const h of additionalHandles) {
      if (!h || h.kind !== 'tw' || !Array.isArray(h.tokens)) {
        throw new Error(`[feedback] unsupported style handle in v0`);
      }
      inputs.push(...h.tokens);
    }
    return mergeTwTokensV0(inputs).tokens;
  }

  private applyPatchLayer(baseTokens: string[]): { tokens: string[] } {
    if (this.runtimePatch.size === 0) return { tokens: baseTokens };

    const patchTokens: string[] = [];
    const baseAfterSuppress: string[] = [];

    for (const token of baseTokens) {
      const entry = this.runtimePatch.get(getSemanticGroupKeyV0(token));
      if (entry) continue;
      baseAfterSuppress.push(token);
    }

    for (const entry of this.runtimePatch.values()) {
      if (entry.kind === 'patch') patchTokens.push(entry.token);
    }

    return mergeTwTokensV0([...baseAfterSuppress, ...patchTokens]);
  }

  private flattenRuntimePatchHandles(handles: StyleHandle[], op: string): string[] {
    const flattened: string[] = [];
    for (const h of handles) {
      if (!h || h.kind !== 'tw' || !Array.isArray(h.tokens)) {
        throw new Error(`[feedback] unsupported style handle in v0`);
      }
      for (const t of h.tokens) {
        assertTwTokenV0(t, op);
        if (t === 'data-pui-style') {
          throw new Error(`[feedback] invalid tw token (${op}): host style artifact is forbidden`);
        }
        flattened.push(t);
      }
    }
    return flattened;
  }
}
