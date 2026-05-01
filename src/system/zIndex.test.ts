import { beforeEach, describe, expect, it } from 'vitest';

import {
  Z_INDEX_TIERS,
  allocateLeaderboardZIndex,
  allocateNormalZIndex,
  allocateVoiceCallZIndex,
  resetZIndexAllocators,
} from './zIndex';

describe('zIndex allocators', () => {
  beforeEach(() => {
    resetZIndexAllocators();
  });

  it('normal tier returns monotonically increasing values starting just above its base', () => {
    const a = allocateNormalZIndex();
    const b = allocateNormalZIndex();
    const c = allocateNormalZIndex();
    expect(a).toBeGreaterThan(Z_INDEX_TIERS.normalBase);
    expect(b).toBe(a + 1);
    expect(c).toBe(b + 1);
  });

  it('normal tier never reaches the leaderboard tier', () => {
    for (let i = 0; i < 5; i += 1) {
      const z = allocateNormalZIndex();
      expect(z).toBeLessThan(Z_INDEX_TIERS.leaderboard);
    }
  });

  it('leaderboard tier starts at the leaderboard base and increments', () => {
    const a = allocateLeaderboardZIndex();
    const b = allocateLeaderboardZIndex();
    expect(a).toBe(Z_INDEX_TIERS.leaderboard);
    expect(b).toBe(Z_INDEX_TIERS.leaderboard + 1);
  });

  it('voice call tier sits strictly above leaderboard tier', () => {
    const v = allocateVoiceCallZIndex();
    expect(v).toBe(Z_INDEX_TIERS.voiceCall);
    expect(v).toBeGreaterThan(Z_INDEX_TIERS.leaderboard);
  });

  it('reset re-anchors all tiers', () => {
    allocateNormalZIndex();
    allocateLeaderboardZIndex();
    allocateVoiceCallZIndex();
    resetZIndexAllocators();
    expect(allocateNormalZIndex()).toBe(Z_INDEX_TIERS.normalBase + 1);
    expect(allocateLeaderboardZIndex()).toBe(Z_INDEX_TIERS.leaderboard);
    expect(allocateVoiceCallZIndex()).toBe(Z_INDEX_TIERS.voiceCall);
  });
});
