import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { gameEventBus } from '../../game/events';
import {
  advanceGameClockByMinutes,
  advanceGameClockByMs,
  getGameDate,
  resetGameClock,
} from './gameClock';

describe('gameClock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00.000'));
    resetGameClock();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts the virtual clock at 4:45 PM local time after reset', () => {
    const date = getGameDate();
    expect(date.getHours()).toBe(16);
    expect(date.getMinutes()).toBe(45);
  });

  it('advances real-time elapsed since reset', () => {
    vi.advanceTimersByTime(2_000);
    const date = getGameDate();
    expect(date.getMinutes()).toBe(45);
    expect(date.getSeconds()).toBe(2);
  });

  it('manual advance by ms shifts the virtual base forward', () => {
    advanceGameClockByMs(60_000);
    const date = getGameDate();
    expect(date.getHours()).toBe(16);
    expect(date.getMinutes()).toBe(46);
  });

  it('manual advance by 1 minute shifts the time forward by 1 minute', () => {
    advanceGameClockByMinutes(1);
    expect(getGameDate().getMinutes()).toBe(46);
  });

  it('ignores non-positive minute advances', () => {
    advanceGameClockByMinutes(0);
    advanceGameClockByMinutes(-5);
    advanceGameClockByMinutes(Number.NaN);
    expect(getGameDate().getMinutes()).toBe(45);
  });

  it('emits clock:advanced when advanced', () => {
    const listener = vi.fn();
    const off = gameEventBus.on('clock:advanced', listener);
    advanceGameClockByMs(30_000);
    expect(listener).toHaveBeenCalledWith({ byMs: 30_000 });
    off();
  });

  it('reset returns the clock to 4:45 PM', () => {
    advanceGameClockByMinutes(10);
    resetGameClock();
    expect(getGameDate().getMinutes()).toBe(45);
  });
});
