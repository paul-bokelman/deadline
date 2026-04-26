import {
  START_HOUR_24,
  START_MINUTE,
  DEADLINE_DURATION_MS,
  TICK_INTERVAL_MS,
  REQUIRED_FILE_NAME,
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
  const shell = body.parentElement;
  if (shell) shell.classList.add("chaos-popup");
  body.replaceChildren();

  const banner = document.createElement("p");
  banner.className = "chaos-popup-banner";
  banner.textContent = "WARNING! ACTION REQUIRED!";
  body.appendChild(banner);

  const preview = document.createElement("img");
  preview.className = "chaos-popup-preview";
  preview.src = "./assets/images/chaos-popups.png";
  preview.alt = "";
  body.appendChild(preview);

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

function renameExpectedReportFile() {
  const previousName = gameState.annoyance.expectedFileName;
  const renamed = `final_report_v7_FINAL_${randomInt(100, 999)}.docx`;
  gameState.annoyance.expectedFileName = renamed;
  gameState.annoyance.captcha.solved = false;

  gameState.downloadedFiles = gameState.downloadedFiles.map((fileName) =>
    fileName === previousName ? renamed : fileName
  );

  if (gameState.selectedPortalFile === previousName) {
    gameState.selectedPortalFile = null;
  }

  createInterruptWindow({
    title: "Auto Rename Service",
    message: `Compliance renamed your report to "${renamed}". Re-select this file before submitting.`,
    actionLabel: "Fine",
    iconPath: APP_ICONS.notepad,
    onResolve: () => {}
  });
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

function spawnTrapPopup() {
  gameState.annoyance.pendingMessages += 1;
  gameState.annoyance.trapPopups += 1;
  let resolved = false;

  const id = `offer-${++gameState.popupCounter}`;
  const body = createWindow({
    id,
    title: "FREE PC SPEED BOOST",
    width: 300,
    height: 180,
    left: randomInt(60, 560),
    top: randomInt(50, 320),
    taskbarIcon: APP_ICONS.recycle,
    onClose: settle
  });

  function settle() {
    if (resolved) return;
    resolved = true;
    gameState.annoyance.pendingMessages = Math.max(
      0,
      gameState.annoyance.pendingMessages - 1
    );
    gameState.annoyance.trapPopups = Math.max(0, gameState.annoyance.trapPopups - 1);
  }

  if (!body) return;
  const shell = body.parentElement;
  if (shell) shell.classList.add("chaos-popup");
  body.replaceChildren();

  const preview = document.createElement("img");
  preview.className = "chaos-popup-preview";
  preview.src = "./assets/images/chaos-popups.png";
  preview.alt = "";
  body.appendChild(preview);

  const text = document.createElement("p");
  text.textContent = "Click claim to remove 1,248 threats instantly.";
  body.appendChild(text);

  const actions = document.createElement("div");
  actions.className = "window-actions";

  const claim = document.createElement("button");
  claim.type = "button";
  claim.textContent = "Claim Reward";
  claim.className = "popup-claim-button";
  claim.addEventListener("click", () => {
    spawnTrapPopup();
    spawnTrapPopup();
  });
  actions.appendChild(claim);

  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.textContent = "Dismiss";
  dismiss.addEventListener("click", () => {
    settle();
    const closeButton = body.parentElement?.querySelector(".title-bar-controls button");
    if (closeButton) closeButton.click();
  });
  actions.appendChild(dismiss);

  body.appendChild(actions);
}

function spawnFakeBsod() {
  gameState.annoyance.pendingMessages += 1;
  let resolved = false;

  function settle() {
    if (resolved) return;
    resolved = true;
    gameState.annoyance.pendingMessages = Math.max(
      0,
      gameState.annoyance.pendingMessages - 1
    );
  }

  const body = createWindow({
    id: `bsod-${++gameState.popupCounter}`,
    title: "System Failure",
    width: 760,
    height: 430,
    left: 20,
    top: 20,
    taskbarIcon: APP_ICONS.computer,
    onClose: settle
  });

  if (!body) return;
  const shell = body.parentElement;
  if (shell) shell.classList.add("bsod-window");
  const closeButton = shell?.querySelector(".title-bar-controls button");
  if (closeButton) closeButton.disabled = true;
  body.replaceChildren();

  const message = document.createElement("p");
  message.textContent =
    "A fatal exception has occurred at 0E : 016F : BFF9DFFF. Restart is required.";
  body.appendChild(message);

  const countdown = document.createElement("p");
  countdown.textContent = "Reboot available in 6s";
  body.appendChild(countdown);

  const actions = document.createElement("div");
  actions.className = "window-actions";
  const reboot = document.createElement("button");
  reboot.type = "button";
  reboot.textContent = "Reboot";
  reboot.disabled = true;
  reboot.addEventListener("click", () => {
    settle();
    if (shell) shell.classList.remove("bsod-window");
    const closer = body.parentElement?.querySelector(".title-bar-controls button");
    if (closer) {
      closer.disabled = false;
      closer.click();
    }
  });
  actions.appendChild(reboot);
  body.appendChild(actions);

  let remaining = 6;
  const tickId = window.setInterval(() => {
    remaining -= 1;
    countdown.textContent = `Reboot available in ${Math.max(remaining, 0)}s`;
    if (remaining <= 0) {
      window.clearInterval(tickId);
      reboot.disabled = false;
      countdown.textContent = "Click reboot to continue.";
    }
  }, 1000);
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

  const roll = Math.random();
  if (roll < 0.28) {
    spawnFakeBsod();
  } else if (roll < 0.6) {
    spawnTrapPopup();
  } else if (roll < 0.8) {
    spawnIncomingCall();
  } else {
    spawnUrgentMessage();
  }

  // Keep interruptions frequent enough to feel annoying.
  gameState.annoyance.nextInterruptAtMs = elapsedMs + randomInt(9000, 18000);
}

function maybeRenameDownloadedReport(elapsedMs) {
  if (elapsedMs < gameState.annoyance.nextRenameAtMs) return;

  gameState.annoyance.nextRenameAtMs = elapsedMs + randomInt(22000, 35000);
  if (gameState.annoyance.downloadPhase !== "ready") return;

  if (!gameState.downloadedFiles.includes(gameState.annoyance.expectedFileName)) return;
  if (Math.random() < 0.75) {
    renameExpectedReportFile();
  }
}

function openFakeEmailWindow(title, lineA, lineB) {
  const body = createWindow({
    id: `fake-mail-${++gameState.popupCounter}`,
    title,
    width: 340,
    height: 190,
    left: randomInt(70, 540),
    top: randomInt(50, 280),
    taskbarIcon: APP_ICONS.email
  });
  if (!body) return;
  body.replaceChildren();
  const p1 = document.createElement("p");
  p1.textContent = lineA;
  const p2 = document.createElement("p");
  p2.textContent = lineB;
  body.appendChild(p1);
  body.appendChild(p2);
}

function openFakeEmailA() {
  openFakeEmailWindow(
    "Outlook 5.0 Recovery",
    "Mailbox index is corrupted. Rebuilding in 17 minutes...",
    "Please use another client while this recovers."
  );
}

function openFakeEmailB() {
  openFakeEmailWindow(
    "Mail (Legacy)",
    "This client no longer supports your profile.",
    "Error 0x0098: Please migrate to E-mail [Corp]."
  );
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
  maybeRenameDownloadedReport(elapsedMs);

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
    onOpenFakeEmailA: openFakeEmailA,
    onOpenFakeEmailB: openFakeEmailB,
    onOpenPortal: openPortal,
    onOpenNotepad: openNotepad,
    onOpenCalculator: openCalculator,
    onOpenPaint: openPaint,
    onOpenComputer: openComputer,
    onOpenRecycleBin: openRecycleBin
  });

  gameState.startedAtMs = Date.now();
  gameState.annoyance.expectedFileName = REQUIRED_FILE_NAME;
  gameState.endGame = endGame;

  tick();
  gameState.tickIntervalId = window.setInterval(tick, TICK_INTERVAL_MS);
}

init();
