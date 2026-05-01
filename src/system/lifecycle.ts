// Central lifecycle hub. Module-level singletons register a `reset` callback
// here; everything is fired once on `game:rebooted` so reset semantics live
// in one obvious place.
//
// Convention:
// - Singletons that hold mutable state across reboots register exactly one
//   reset callback at module top-level via `registerOnReboot(...)`.
// - Reset callbacks must be idempotent and side-effect-light.

import { gameEventBus } from '@/game/events';

type ResetCallback = () => void;

const resetCallbacks = new Set<ResetCallback>();
let isWired = false;

const ensureWired = (): void => {
  if (isWired) return;
  isWired = true;
  gameEventBus.on('game:rebooted', () => {
    resetCallbacks.forEach((cb) => {
      try {
        cb();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[lifecycle] reset callback failed:', error);
      }
    });
  });
};

export const registerOnReboot = (callback: ResetCallback): (() => void) => {
  ensureWired();
  resetCallbacks.add(callback);
  return () => {
    resetCallbacks.delete(callback);
  };
};

// Test/dev utility: triggers all registered callbacks without dispatching a
// game event.
export const __runRegisteredResets = (): void => {
  resetCallbacks.forEach((cb) => cb());
};
