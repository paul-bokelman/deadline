import { REQUIRED_FILE_NAME, gameState } from "../state.js";
import { APP_ICONS, createWindow, closeWindow } from "./desktop.js";

const DECOY_FILES = [
  "Q3_report_old_FINAL_v2(1).docx",
  "final_report_v7_FINAL_copy.docx",
  "Q3-draft-use-this-one.docx"
];

function randomDecoy() {
  return DECOY_FILES[Math.floor(Math.random() * DECOY_FILES.length)];
}

function createVirusPopup() {
  gameState.annoyance.activeViruses += 1;
  let resolved = false;
  const settle = () => {
    if (resolved) return;
    resolved = true;
    gameState.annoyance.activeViruses = Math.max(0, gameState.annoyance.activeViruses - 1);
  };

  const id = `virus-${++gameState.popupCounter}`;
  const body = createWindow({
    id,
    title: "Virus Alert",
    width: 300,
    height: 170,
    left: 150 + Math.floor(Math.random() * 350),
    top: 90 + Math.floor(Math.random() * 250),
    taskbarIcon: APP_ICONS.recycle,
    onClose: settle
  });
  if (!body) return;

  body.replaceChildren();
  const art = document.createElement("div");
  art.className = "virus-art";
  const artIcon = document.createElement("img");
  artIcon.src = APP_ICONS.recycle;
  artIcon.alt = "";
  art.appendChild(artIcon);
  body.appendChild(art);

  const preview = document.createElement("img");
  preview.className = "virus-preview";
  preview.src = "./assets/images/chaos-popups.png";
  preview.alt = "";
  body.appendChild(preview);

  const text = document.createElement("p");
  text.textContent = "Suspicious macro detected. Terminate process manually.";
  body.appendChild(text);

  const actions = document.createElement("div");
  actions.className = "window-actions";
  const terminateButton = document.createElement("button");
  terminateButton.type = "button";
  terminateButton.textContent = "Terminate";
  terminateButton.addEventListener("click", () => {
    settle();
    const closeButton = body.parentElement?.querySelector(".title-bar-controls button");
    if (closeButton) closeButton.click();
  });
  actions.appendChild(terminateButton);
  body.appendChild(actions);
}

function spawnVirusBurst(count) {
  for (let i = 0; i < count; i += 1) {
    createVirusPopup();
  }
}

function runJankyProgress(progressFill, onDone, minStepMs = 120, maxStepMs = 520) {
  let progress = 0;
  progressFill.style.width = "0%";

  const timerId = window.setInterval(() => {
    const roll = Math.random();
    if (roll < 0.14) {
      progress = Math.max(0, progress - Math.random() * 7);
    } else if (roll < 0.28) {
      // Stutter and do not progress this frame.
      progress += 0;
    } else {
      progress += 1 + Math.random() * 13;
    }

    progressFill.style.width = `${Math.min(progress, 100)}%`;
    if (progress >= 100) {
      window.clearInterval(timerId);
      onDone();
    }
  }, minStepMs + Math.random() * (maxStepMs - minStepMs));

  return timerId;
}

export function open() {
  if (Date.now() > gameState.annoyance.emailUnlockedUntilMs) {
    gameState.annoyance.emailUnlockedUntilMs = 0;
    openEmailPasswordGate();
    return;
  }

  const body = createWindow({
    id: "email-window",
    title: "Inbox - boss@company.com",
    width: 470,
    height: 320,
    left: 70,
    top: 70,
    taskbarIcon: APP_ICONS.email
  });

  if (!body) return;

  body.replaceChildren();

  const heading = document.createElement("p");
  heading.textContent = "1 message";
  body.appendChild(heading);

  const emailPanel = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = "boss@company.com";
  emailPanel.appendChild(legend);

  const subject = document.createElement("p");
  subject.textContent = "Subject: Q3 Report - SUBMIT BY 5PM";
  emailPanel.appendChild(subject);

  const attachmentRow = document.createElement("div");
  attachmentRow.className = "attachment-row";

  const attachmentName = document.createElement("span");
  attachmentName.textContent = gameState.annoyance.expectedFileName;
  attachmentRow.appendChild(attachmentName);

  const downloadBtn = document.createElement("button");
  downloadBtn.type = "button";
  downloadBtn.textContent = "Download";
  attachmentRow.appendChild(downloadBtn);

  const scanBtn = document.createElement("button");
  scanBtn.type = "button";
  scanBtn.textContent = "Run Security Scan";
  attachmentRow.appendChild(scanBtn);

  emailPanel.appendChild(attachmentRow);
  body.appendChild(emailPanel);

  const hint = document.createElement("p");
  hint.textContent =
    "Warning: network is unstable today. Corrupt downloads and malware alerts are expected.";
  body.appendChild(hint);

  const downloadBar = document.createElement("div");
  downloadBar.className = "loading-strip hidden";
  const downloadFill = document.createElement("div");
  downloadFill.className = "loading-fill";
  downloadBar.appendChild(downloadFill);
  body.appendChild(downloadBar);

  const scanBar = document.createElement("div");
  scanBar.className = "loading-strip hidden";
  const scanFill = document.createElement("div");
  scanFill.className = "loading-fill";
  scanBar.appendChild(scanFill);
  body.appendChild(scanBar);

  const status = document.createElement("p");
  status.className = "inline-status";
  status.textContent = "";
  body.appendChild(status);

  const closeRow = document.createElement("div");
  closeRow.className = "window-actions";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", () => closeWindow("email-window"));
  closeRow.appendChild(closeBtn);
  body.appendChild(closeRow);

  function refreshControls() {
    const phase = gameState.annoyance.downloadPhase;
    const busy = phase === "downloading" || phase === "scanning";
    attachmentName.textContent = gameState.annoyance.expectedFileName;
    downloadBtn.disabled = busy;
    scanBtn.disabled = phase !== "corrupted" || busy;
    downloadBar.classList.toggle("hidden", phase !== "downloading");
    scanBar.classList.toggle("hidden", phase !== "scanning");

    if (phase === "ready") {
      status.textContent = `${gameState.annoyance.expectedFileName} is finally available.`;
    } else if (phase === "downloading") {
      status.textContent = "Downloading... ETA keeps changing (slow office VPN).";
    } else if (phase === "scanning") {
      status.textContent = "Security scan running... this may take a while (or go backwards).";
    } else if (phase === "corrupted") {
      status.textContent =
        "Downloaded file is corrupt. Run security scan, close virus popups, then try again.";
    }
  }

  function finishDownload() {
    gameState.annoyance.downloadTimeoutId = null;

    if (
      gameState.annoyance.downloadAttempts < 2 ||
      !gameState.annoyance.securityScanComplete
    ) {
      const decoy = randomDecoy();
      if (!gameState.downloadedFiles.includes(decoy)) {
        gameState.downloadedFiles.push(decoy);
      }
      gameState.annoyance.downloadPhase = "corrupted";
      refreshControls();
      return;
    }

    gameState.annoyance.downloadPhase = "ready";
    if (!gameState.downloadedFiles.includes(gameState.annoyance.expectedFileName)) {
      gameState.downloadedFiles.push(gameState.annoyance.expectedFileName);
    }
    refreshControls();
  }

  downloadBtn.addEventListener("click", () => {
    const phase = gameState.annoyance.downloadPhase;
    if (phase === "downloading" || phase === "scanning") {
      return;
    }

    gameState.annoyance.downloadAttempts += 1;
    gameState.annoyance.downloadPhase = "downloading";
    refreshControls();

    if (gameState.annoyance.downloadTimeoutId) {
      window.clearInterval(gameState.annoyance.downloadTimeoutId);
      gameState.annoyance.downloadTimeoutId = null;
    }

    gameState.annoyance.downloadTimeoutId = runJankyProgress(
      downloadFill,
      () => {
        gameState.annoyance.downloadTimeoutId = null;
        finishDownload();
      },
      160,
      720
    );
  });

  scanBtn.addEventListener("click", () => {
    if (gameState.annoyance.downloadPhase !== "corrupted") return;

    gameState.annoyance.downloadPhase = "scanning";
    refreshControls();

    if (gameState.annoyance.scanTimeoutId) {
      window.clearInterval(gameState.annoyance.scanTimeoutId);
      gameState.annoyance.scanTimeoutId = null;
    }

    gameState.annoyance.scanTimeoutId = runJankyProgress(
      scanFill,
      () => {
        gameState.annoyance.scanTimeoutId = null;
        gameState.annoyance.securityScanComplete = true;
        gameState.annoyance.downloadPhase = "idle";
        status.textContent =
          "Scan complete, but malware dialogs popped up. Close all virus popups, then download again.";
        spawnVirusBurst(3);
        refreshControls();
      },
      220,
      680
    );
  });

  refreshControls();
}

function openEmailPasswordGate() {
  const body = createWindow({
    id: "email-auth-window",
    title: "E-mail [Corp] - Password Required",
    width: 370,
    height: 210,
    left: 120,
    top: 90,
    taskbarIcon: APP_ICONS.email
  });

  if (!body) return;
  body.replaceChildren();

  const intro = document.createElement("p");
  intro.textContent = "This mailbox is locked. Password hint exists somewhere on this machine.";
  body.appendChild(intro);

  const row = document.createElement("div");
  row.className = "portal-controls";
  const password = document.createElement("input");
  password.type = "password";
  password.placeholder = "mailbox password";
  const unlock = document.createElement("button");
  unlock.type = "button";
  unlock.textContent = "Unlock";
  row.appendChild(password);
  row.appendChild(unlock);
  body.appendChild(row);

  const status = document.createElement("p");
  status.className = "inline-status";
  body.appendChild(status);

  unlock.addEventListener("click", () => {
    if (password.value.trim() !== gameState.annoyance.emailPassword) {
      status.textContent = "Incorrect password. Security has been notified.";
      return;
    }

    gameState.annoyance.emailUnlockedUntilMs = Date.now() + 45000;
    status.textContent = "Unlocked for 45 seconds.";
    const closeButton = body.parentElement?.querySelector(".title-bar-controls button");
    if (closeButton) closeButton.click();
    open();
  });
}
