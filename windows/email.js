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

export function open() {
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
  attachmentName.textContent = REQUIRED_FILE_NAME;
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
    downloadBtn.disabled = busy;
    scanBtn.disabled = phase !== "corrupted" || busy;

    if (phase === "ready") {
      status.textContent = `${REQUIRED_FILE_NAME} is finally available.`;
    } else if (phase === "downloading") {
      status.textContent = "Downloading... please wait (slow office VPN).";
    } else if (phase === "scanning") {
      status.textContent = "Security scan running... this may take a while.";
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
    if (!gameState.downloadedFiles.includes(REQUIRED_FILE_NAME)) {
      gameState.downloadedFiles.push(REQUIRED_FILE_NAME);
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
      window.clearTimeout(gameState.annoyance.downloadTimeoutId);
      gameState.annoyance.downloadTimeoutId = null;
    }

    gameState.annoyance.downloadTimeoutId = window.setTimeout(finishDownload, 6500);
  });

  scanBtn.addEventListener("click", () => {
    if (gameState.annoyance.downloadPhase !== "corrupted") return;

    gameState.annoyance.downloadPhase = "scanning";
    refreshControls();

    if (gameState.annoyance.scanTimeoutId) {
      window.clearTimeout(gameState.annoyance.scanTimeoutId);
      gameState.annoyance.scanTimeoutId = null;
    }

    gameState.annoyance.scanTimeoutId = window.setTimeout(() => {
      gameState.annoyance.scanTimeoutId = null;
      gameState.annoyance.securityScanComplete = true;
      gameState.annoyance.downloadPhase = "idle";
      status.textContent =
        "Scan complete, but malware dialogs popped up. Close all virus popups, then download again.";
      spawnVirusBurst(3);
      refreshControls();
    }, 7000);
  });

  refreshControls();
}
