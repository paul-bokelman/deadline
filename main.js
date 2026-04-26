import {
  START_HOUR_24,
  START_MINUTE,
  DEADLINE_DURATION_MS,
  TICK_INTERVAL_MS,
  gameState
} from "./state.js";
import {
  renderDesktop,
  updateClockAndCountdown,
  showEndOverlay
} from "./windows/desktop.js";
import { open as openEmail } from "./windows/email.js";
import { open as openPortal } from "./windows/portal.js";
import { open as openNotepad } from "./windows/notepad.js";
import { open as openCalculator } from "./windows/calculator.js";
import { open as openPaint } from "./windows/paint.js";
import { open as openComputer } from "./windows/computer.js";
import { open as openRecycleBin } from "./windows/recycle.js";

const startOfGameClock = new Date();
startOfGameClock.setHours(START_HOUR_24, START_MINUTE, 0, 0);

function endGame(status) {
  if (gameState.gameStatus !== "playing") return;

  gameState.gameStatus = status;
  if (gameState.tickIntervalId) {
    window.clearInterval(gameState.tickIntervalId);
    gameState.tickIntervalId = null;
  }

  showEndOverlay(status);
}

function tick() {
  if (gameState.gameStatus !== "playing") return;

  const elapsedMs = Date.now() - gameState.startedAtMs;
  const boundedElapsed = Math.min(elapsedMs, DEADLINE_DURATION_MS);
  const msRemaining = Math.max(0, DEADLINE_DURATION_MS - elapsedMs);

  // Keep in-game clock tied to real elapsed time.
  const currentClockTime = new Date(startOfGameClock.getTime() + boundedElapsed);
  updateClockAndCountdown(currentClockTime, msRemaining);

  // Trigger lose state exactly at (or after) the deadline.
  if (elapsedMs >= DEADLINE_DURATION_MS) {
    endGame("lost");
  }
}

function init() {
  const app = document.querySelector("#app");
  if (!app) return;

  renderDesktop(app, {
    onOpenEmail: openEmail,
    onOpenPortal: openPortal,
    onOpenNotepad: openNotepad,
    onOpenCalculator: openCalculator,
    onOpenPaint: openPaint,
    onOpenComputer: openComputer,
    onOpenRecycleBin: openRecycleBin
  });

  gameState.startedAtMs = Date.now();
  gameState.endGame = endGame;

  tick();
  gameState.tickIntervalId = window.setInterval(tick, TICK_INTERVAL_MS);
}

init();
