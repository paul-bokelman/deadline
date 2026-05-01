import { afterEach, describe, expect, it, vi } from 'vitest';

import { pickRandom, randomIntBetween } from './random';

describe('pickRandom', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null for an empty array', () => {
    expect(pickRandom([])).toBeNull();
  });

  it('returns the only element for a single-item array', () => {
    expect(pickRandom(['only'])).toBe('only');
  });

  it('selects an element from the input array', () => {
    const items = ['a', 'b', 'c'] as const;
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(items).toContain(pickRandom(items));
  });
});

describe('randomIntBetween', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns values inside the inclusive range', () => {
    for (let i = 0; i < 50; i += 1) {
      const value = randomIntBetween(3, 7);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
    }
  });

  it('returns the lower bound when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(randomIntBetween(10, 20)).toBe(10);
  });

  it('returns the upper bound when Math.random approaches 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999_999);
    expect(randomIntBetween(10, 20)).toBe(20);
  });
});
