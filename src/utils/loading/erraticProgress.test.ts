import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ErraticProgressOptions,
  getErraticProgressStep,
} from './erraticProgress';

const baseOptions: ErraticProgressOptions = {
  maxDelayMs: 100,
  maxIncrement: 5,
  maxPauseMs: 200,
  minDelayMs: 50,
  minIncrement: 1,
  minPauseMs: 50,
  pauseChance: 0,
};

describe('getErraticProgressStep', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('snaps to the target and stops once reached', () => {
    const step = getErraticProgressStep(100, 100, baseOptions);
    expect(step.nextProgress).toBe(100);
    expect(step.paused).toBe(false);
  });

  it('produces a paused step when pauseChance is 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const step = getErraticProgressStep(50, 100, {
      ...baseOptions,
      pauseChance: 1,
    });
    expect(step.paused).toBe(true);
    expect(step.nextProgress).toBe(50);
  });

  it('never overshoots the target', () => {
    for (let i = 0; i < 30; i += 1) {
      const step = getErraticProgressStep(98, 100, {
        ...baseOptions,
        minIncrement: 5,
        maxIncrement: 50,
      });
      expect(step.nextProgress).toBeLessThanOrEqual(100);
    }
  });

  it('quantizes to the configured step size', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const step = getErraticProgressStep(0, 100, {
      ...baseOptions,
      stepSize: 10,
      minIncrement: 1,
      maxIncrement: 1,
    });
    expect(step.nextProgress % 10).toBe(0);
  });
});
