import { describe, expect, it } from 'vitest';

import {
  COUNTDOWN_MS,
  computeRemainingMsTo5pm,
  formatCountdown,
} from './timerMath';

describe('formatCountdown', () => {
  it('formats whole minutes and seconds with leading zeros', () => {
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(1_000)).toBe('00:01');
    expect(formatCountdown(60_000)).toBe('01:00');
    expect(formatCountdown(10 * 60_000)).toBe('10:00');
  });

  it('rounds remaining ms up to the next whole second', () => {
    // 1.5s remaining should still show 02 seconds (Math.ceil), not 01.
    expect(formatCountdown(1_500)).toBe('00:02');
  });

  it('clamps negative values to 00:00', () => {
    expect(formatCountdown(-9_999)).toBe('00:00');
  });

  it('matches the documented countdown duration constant', () => {
    expect(COUNTDOWN_MS).toBe(10 * 60 * 1000);
  });
});

describe('computeRemainingMsTo5pm', () => {
  const at = (h: number, m: number, s = 0): Date => {
    const d = new Date();
    d.setHours(h, m, s, 0);
    return d;
  };

  it('returns 10 minutes when called at 4:50 PM', () => {
    expect(computeRemainingMsTo5pm(at(16, 50))).toBe(10 * 60_000);
  });

  it('returns 2 minutes when called at 4:58 PM', () => {
    expect(computeRemainingMsTo5pm(at(16, 58))).toBe(2 * 60_000);
  });

  it('returns 0 at 5:00 PM exactly', () => {
    expect(computeRemainingMsTo5pm(at(17, 0))).toBe(0);
  });

  it('clamps to 0 after the deadline', () => {
    expect(computeRemainingMsTo5pm(at(17, 5))).toBe(0);
  });

  it('treats 5:00 remaining as half of the standard countdown', () => {
    const remaining = computeRemainingMsTo5pm(at(16, 55));
    expect(remaining).toBe(COUNTDOWN_MS / 2);
  });
});
