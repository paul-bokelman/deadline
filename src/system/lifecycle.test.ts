import { describe, expect, it, vi } from 'vitest';

import { gameEventBus } from '@/game/events';
import { __runRegisteredResets, registerOnReboot } from './lifecycle';

describe('lifecycle reset registry', () => {
  it('runs all registered callbacks on game:rebooted', () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = registerOnReboot(a);
    const offB = registerOnReboot(b);
    gameEventBus.emit('game:rebooted', { at: Date.now() });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    offA();
    offB();
  });

  it('unregister removes the callback', () => {
    const cb = vi.fn();
    const off = registerOnReboot(cb);
    off();
    gameEventBus.emit('game:rebooted', { at: Date.now() });
    expect(cb).not.toHaveBeenCalled();
  });

  it('isolates failing callbacks from siblings', () => {
    const failer = vi.fn(() => {
      throw new Error('boom');
    });
    const sibling = vi.fn();
    const offA = registerOnReboot(failer);
    const offB = registerOnReboot(sibling);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    gameEventBus.emit('game:rebooted', { at: Date.now() });
    expect(sibling).toHaveBeenCalled();
    consoleError.mockRestore();
    offA();
    offB();
  });

  it('__runRegisteredResets fires callbacks without dispatching events', () => {
    const cb = vi.fn();
    const off = registerOnReboot(cb);
    __runRegisteredResets();
    expect(cb).toHaveBeenCalledTimes(1);
    off();
  });
});
