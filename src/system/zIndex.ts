/**
 * Central z-index tiers + allocator for "Windows 96"-style stacking.
 *
 * Rule of thumb:
 * - Normal app windows + popups should always be on top of everything except
 *   the explicit exception tiers below.
 * - Exceptions always win, regardless of open/focus order.
 */

export const Z_INDEX_TIERS = {
  normalBase: 300_000,
  leaderboard: 1_000_000,
  plot: 2_000_000,
  progress: 3_000_000,
  voiceCall: 4_000_000,
  // Ambient critters sit above all gameplay layers but below the bluescreen
  // sequence and the bootloader takeover.
  ambientCritter: 5_000_000,
  bluescreen: 6_000_000,
} as const;

type ZIndexTier = keyof typeof Z_INDEX_TIERS;

let normalCounter = Z_INDEX_TIERS.normalBase + 1;
let leaderboardCounter = Z_INDEX_TIERS.leaderboard;
let voiceCallCounter = Z_INDEX_TIERS.voiceCall;

// Reserve headroom for the WinStageLayer "New High Score!" overlay, which
// sits at `leaderboardBase + 99`.
const LEADERBOARD_APP_MAX_Z_INDEX = Z_INDEX_TIERS.leaderboard + 98;

export const resetZIndexAllocators = () => {
  normalCounter = Z_INDEX_TIERS.normalBase + 1;
  leaderboardCounter = Z_INDEX_TIERS.leaderboard;
  voiceCallCounter = Z_INDEX_TIERS.voiceCall;
};

/**
 * Allocate a monotonically increasing zIndex for the "normal" tier.
 * This is shared across normal windows + popups so whichever spawns last
 * will appear on top.
 */
export const allocateNormalZIndex = () => {
  // Keep normal-tier items strictly below the leaderboard exception tier.
  // This guarantees exceptions never get covered "no matter what".
  if (normalCounter >= Z_INDEX_TIERS.leaderboard) {
    normalCounter = Z_INDEX_TIERS.normalBase + 1;
  }
  return normalCounter++;
};

/**
 * Allocate a monotonically increasing zIndex for the "leaderboard" tier.
 * (This tier is exception #4 in the requested ordering.)
 */
export const allocateLeaderboardZIndex = () => {
  // Keep leaderboard *app* windows below the leaderboard exception overlay
  // (WinStageLayer), which is fixed at `leaderboardBase + 99`.
  if (leaderboardCounter > LEADERBOARD_APP_MAX_Z_INDEX) {
    leaderboardCounter = Z_INDEX_TIERS.leaderboard;
  }
  return leaderboardCounter++;
};

/**
 * Allocate a monotonically increasing zIndex for the "voice call" tier.
 * (This tier is exception #1 in the requested ordering.)
 */
export const allocateVoiceCallZIndex = () => {
  return voiceCallCounter++;
};

/**
 * Convenience for determining which tier an OpenWindow belongs to.
 */
export const getZIndexTierForAppId = (appId: string): ZIndexTier => {
  if (appId === 'netVoiceCall') return 'voiceCall';
  if (appId === 'leaderboard') return 'leaderboard';
  return 'normalBase';
};

