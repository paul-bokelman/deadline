import {
  START_HOUR_24,
  START_MINUTE,
  DEADLINE_DURATION_MS,
  TICK_INTERVAL_MS,
  gameState
} from "./state.js";
import {
  renderDesktop,
  createWindow,
  APP_ICONS,
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

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createInterruptWindow({ title, message, actionLabel, iconPath, onResolve }) {
  const id = `interrupt-${++gameState.popupCounter}`;
  const body = createWindow({
    id,
    title,
    width: 320,
    height: 180,
    left: randomInt(80, 520),
    top: randomInt(60, 300),
    taskbarIcon: iconPath,
    onClose: onResolve
  });

  if (!body) return;
  body.replaceChildren();

  const text = document.createElement("p");
  text.textContent = message;
  body.appendChild(text);

  const actions = document.createElement("div");
  actions.className = "window-actions";
  const resolveButton = document.createElement("button");
  resolveButton.type = "button";
  resolveButton.textContent = actionLabel;
  resolveButton.addEventListener("click", () => {
    onResolve();
    const closeButton = body.parentElement?.querySelector(".title-bar-controls button");
    if (closeButton) closeButton.click();
  });
  actions.appendChild(resolveButton);
  body.appendChild(actions);
}

function spawnIncomingCall() {
  gameState.annoyance.activeCalls += 1;
  let resolved = false;
  const settle = () => {
    if (resolved) return;
    resolved = true;
    gameState.annoyance.activeCalls = Math.max(0, gameState.annoyance.activeCalls - 1);
  };

  createInterruptWindow({
    title: "Incoming Call - IT Helpdesk",
    message:
      "IT needs you to confirm your employee ID again. You cannot submit while on this call.",
    actionLabel: "Hang Up",
    iconPath: APP_ICONS.portal,
    onResolve: settle
  });
}

function spawnUrgentMessage() {
  gameState.annoyance.pendingMessages += 1;
  let resolved = false;
  const settle = () => {
    if (resolved) return;
    resolved = true;
    gameState.annoyance.pendingMessages = Math.max(
      0,
      gameState.annoyance.pendingMessages - 1
    );
  };

  createInterruptWindow({
    title: "HR Broadcast Message",
    message:
      "Mandatory pop-up policy reminder. Acknowledge this notice before submitting any portal forms.",
    actionLabel: "Acknowledge",
    iconPath: APP_ICONS.notepad,
    onResolve: settle
  });
}

function maybeSpawnInterruptions(elapsedMs) {
  if (elapsedMs < gameState.annoyance.nextInterruptAtMs) return;

  if (Math.random() < 0.5) {
    spawnIncomingCall();
  } else {
    spawnUrgentMessage();
  }

  // Keep interruptions frequent enough to feel annoying.
  gameState.annoyance.nextInterruptAtMs = elapsedMs + randomInt(14000, 26000);
}

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
  maybeSpawnInterruptions(elapsedMs);

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
