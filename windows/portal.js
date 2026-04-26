import { gameState } from "../state.js";
import { APP_ICONS, createWindow, closeWindow } from "./desktop.js";

function issueCaptcha() {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  gameState.annoyance.captcha.a = a;
  gameState.annoyance.captcha.b = b;
  gameState.annoyance.captcha.answer = String(a + b);
  gameState.annoyance.captcha.solved = false;
}

function runJankyProgress(progressFill, onDone) {
  let progress = 0;
  progressFill.style.width = "0%";

  const timer = window.setInterval(() => {
    const roll = Math.random();
    if (roll < 0.12) {
      progress = Math.max(0, progress - Math.random() * 10);
    } else if (roll < 0.32) {
      progress += 0;
    } else {
      progress += 2 + Math.random() * 16;
    }
    progressFill.style.width = `${Math.min(100, progress)}%`;
    if (progress >= 100) {
      window.clearInterval(timer);
      onDone();
    }
  }, 120 + Math.random() * 500);
}

function renderFileChoices(container, fileLabel, status) {
  container.replaceChildren();

  const list = document.createElement("div");
  list.className = "file-choice-list";

  if (gameState.downloadedFiles.length === 0) {
    const none = document.createElement("p");
    none.textContent = "No downloaded files yet.";
    list.appendChild(none);
  } else {
    gameState.downloadedFiles.forEach((fileName) => {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.textContent = fileName;
      choice.addEventListener("click", () => {
        gameState.selectedPortalFile = fileName;
        fileLabel.textContent = `Selected: ${fileName}`;
        status.textContent = "File selected.";
        container.classList.add("hidden");
      });
      list.appendChild(choice);
    });
  }

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Cancel";
  cancel.addEventListener("click", () => container.classList.add("hidden"));
  list.appendChild(cancel);

  container.appendChild(list);
}

export function open() {
  const body = createWindow({
    id: "portal-window",
    title: "Company Portal",
    width: 460,
    height: 330,
    left: 240,
    top: 120,
    taskbarIcon: APP_ICONS.portal
  });

  if (!body) return;

  body.replaceChildren();

  const intro = document.createElement("p");
  intro.textContent = "Upload report and submit before 5:00 PM.";
  body.appendChild(intro);

  const checklist = document.createElement("p");
  checklist.className = "portal-checklist";
  body.appendChild(checklist);

  const controls = document.createElement("div");
  controls.className = "portal-controls";
  body.appendChild(controls);

  const chooseBtn = document.createElement("button");
  chooseBtn.type = "button";
  chooseBtn.textContent = "Choose File";
  controls.appendChild(chooseBtn);

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.textContent = "Submit";
  controls.appendChild(submitBtn);

  const fileLabel = document.createElement("p");
  fileLabel.className = "selected-file";
  fileLabel.textContent = gameState.selectedPortalFile
    ? `Selected: ${gameState.selectedPortalFile}`
    : "Selected: (none)";
  body.appendChild(fileLabel);

  const captchaRow = document.createElement("div");
  captchaRow.className = "portal-controls";
  const captchaLabel = document.createElement("span");
  const captchaInput = document.createElement("input");
  captchaInput.type = "text";
  captchaInput.placeholder = "captcha answer";
  captchaInput.size = 8;
  const verifyBtn = document.createElement("button");
  verifyBtn.type = "button";
  verifyBtn.textContent = "Verify CAPTCHA";
  const resetCaptchaBtn = document.createElement("button");
  resetCaptchaBtn.type = "button";
  resetCaptchaBtn.textContent = "New CAPTCHA";
  captchaRow.appendChild(captchaLabel);
  captchaRow.appendChild(captchaInput);
  captchaRow.appendChild(verifyBtn);
  captchaRow.appendChild(resetCaptchaBtn);
  body.appendChild(captchaRow);

  const submitPasswordRow = document.createElement("div");
  submitPasswordRow.className = "portal-controls";
  const submitPasswordLabel = document.createElement("span");
  submitPasswordLabel.textContent = "Submission password:";
  const submitPasswordInput = document.createElement("input");
  submitPasswordInput.type = "password";
  submitPasswordInput.placeholder = "second password";
  submitPasswordRow.appendChild(submitPasswordLabel);
  submitPasswordRow.appendChild(submitPasswordInput);
  body.appendChild(submitPasswordRow);

  const submitBar = document.createElement("div");
  submitBar.className = "loading-strip hidden";
  const submitFill = document.createElement("div");
  submitFill.className = "loading-fill";
  submitBar.appendChild(submitFill);
  body.appendChild(submitBar);

  const status = document.createElement("p");
  status.className = "inline-status";
  status.textContent = "";
  body.appendChild(status);

  const pickerDialog = document.createElement("div");
  pickerDialog.className = "file-picker-dialog hidden window";

  const pickerBody = document.createElement("div");
  pickerBody.className = "window-body";
  pickerDialog.appendChild(pickerBody);
  body.appendChild(pickerDialog);

  const closeRow = document.createElement("div");
  closeRow.className = "window-actions";
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", () => closeWindow("portal-window"));
  closeRow.appendChild(closeBtn);
  body.appendChild(closeRow);

  function refreshChecklist() {
    captchaLabel.textContent = `CAPTCHA: ${gameState.annoyance.captcha.a} + ${gameState.annoyance.captcha.b} = ?`;
    checklist.textContent = [
      gameState.annoyance.securityScanComplete ? "scan: ok" : "scan: required",
      gameState.annoyance.captcha.solved ? "captcha: ok" : "captcha: required",
      gameState.annoyance.activeViruses > 0
        ? `viruses: ${gameState.annoyance.activeViruses} active`
        : "viruses: clear",
      gameState.annoyance.activeCalls > 0
        ? `calls: ${gameState.annoyance.activeCalls} active`
        : "calls: clear",
      gameState.annoyance.pendingMessages > 0
        ? `messages: ${gameState.annoyance.pendingMessages} pending`
        : "messages: clear"
    ].join(" | ");
  }

  chooseBtn.addEventListener("click", () => {
    renderFileChoices(pickerBody, fileLabel, status);
    pickerDialog.classList.remove("hidden");
    refreshChecklist();
  });

  submitBtn.addEventListener("click", () => {
    refreshChecklist();

    if (gameState.annoyance.activeCalls > 0) {
      status.textContent = "Submission blocked: you are stuck on an IT call.";
      return;
    }

    if (gameState.annoyance.pendingMessages > 0) {
      status.textContent = "Submission blocked: acknowledge all mandatory pop-up messages.";
      return;
    }

    if (gameState.annoyance.activeViruses > 0) {
      status.textContent = "Submission blocked: close all virus alert windows first.";
      return;
    }

    if (!gameState.annoyance.securityScanComplete) {
      status.textContent = "Submission blocked: run the Email security scan first.";
      return;
    }

    if (gameState.annoyance.downloadPhase !== "ready") {
      status.textContent =
        "Submission blocked: correct report not ready. Complete the annoying download flow in Email.";
      return;
    }

    if (!gameState.annoyance.captcha.solved) {
      status.textContent = "Submission blocked: CAPTCHA required.";
      return;
    }

    if (!gameState.selectedPortalFile) {
      status.textContent = "Error: Choose a file before submitting.";
      return;
    }

    if (gameState.selectedPortalFile !== gameState.annoyance.expectedFileName) {
      status.textContent = `Error: Required file is now ${gameState.annoyance.expectedFileName}`;
      return;
    }

    if (submitPasswordInput.value.trim() !== gameState.annoyance.submitPassword) {
      status.textContent =
        "Error: Submission password incorrect. Hidden somewhere weird on this PC.";
      return;
    }

    submitBtn.disabled = true;
    submitBar.classList.remove("hidden");
    status.textContent = "Submitting to server... please do not refresh.";
    runJankyProgress(submitFill, () => {
      submitBtn.disabled = false;
      submitBar.classList.add("hidden");
      if (typeof gameState.endGame === "function") {
        gameState.endGame("won");
      }
    });
  });

  verifyBtn.addEventListener("click", () => {
    if (captchaInput.value.trim() === gameState.annoyance.captcha.answer) {
      gameState.annoyance.captcha.solved = true;
      status.textContent = "CAPTCHA verified.";
    } else {
      gameState.annoyance.captcha.solved = false;
      status.textContent = "CAPTCHA incorrect. New challenge generated.";
      issueCaptcha();
    }
    captchaInput.value = "";
    refreshChecklist();
  });

  resetCaptchaBtn.addEventListener("click", () => {
    issueCaptcha();
    status.textContent = "New CAPTCHA issued.";
    captchaInput.value = "";
    refreshChecklist();
  });

  if (!gameState.annoyance.captcha.answer) {
    issueCaptcha();
  }

  refreshChecklist();
}
