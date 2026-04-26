// Easy-to-tweak timing constants for the game.
export const START_HOUR_24 = 16;
export const START_MINUTE = 47;
export const DEADLINE_DURATION_MS = 13 * 60 * 1000;
export const TICK_INTERVAL_MS = 1000;
export const REQUIRED_FILE_NAME = "final_report_v7_FINAL.docx";

export const gameState = {
  gameStatus: "playing", // "playing" | "won" | "lost"
  startedAtMs: 0,
  tickIntervalId: null,
  popupCounter: 0,

  downloadedFiles: [],
  selectedPortalFile: null,

  annoyance: {
    pendingMessages: 0,
    activeCalls: 0,
    activeViruses: 0,
    trapPopups: 0,
    securityScanComplete: false,
    downloadPhase: "idle", // "idle" | "downloading" | "corrupted" | "scanning" | "ready"
    downloadAttempts: 0,
    downloadTimeoutId: null,
    scanTimeoutId: null,
    nextInterruptAtMs: 24000,
    nextRenameAtMs: 33000,
    expectedFileName: REQUIRED_FILE_NAME,
    emailPassword: "petunia-98",
    submitPassword: "BIN_RITUAL_451",
    emailUnlockedUntilMs: 0,
    captcha: {
      a: 0,
      b: 0,
      answer: "",
      solved: false
    }
  },

  windows: {},
  taskbarButtons: {},
  zCounter: 20,

  ui: {
    systemClockEl: null,
    countdownEl: null,
    taskbarWindowsEl: null,
    overlayEl: null
  },

  endGame: null
};
