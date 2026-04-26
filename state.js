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

  downloadedFiles: [],
  selectedPortalFile: null,

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
