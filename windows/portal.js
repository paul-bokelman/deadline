import { REQUIRED_FILE_NAME, gameState } from "../state.js";
import { APP_ICONS, createWindow, closeWindow } from "./desktop.js";

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
    checklist.textContent = [
      gameState.annoyance.securityScanComplete ? "scan: ok" : "scan: required",
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

    if (!gameState.selectedPortalFile) {
      status.textContent = "Error: Choose a file before submitting.";
      return;
    }

    if (gameState.selectedPortalFile !== REQUIRED_FILE_NAME) {
      status.textContent = "Error: That is not the required report file.";
      return;
    }

    status.textContent = "File accepted. Submitting...";
    if (typeof gameState.endGame === "function") {
      gameState.endGame("won");
    }
  });

  refreshChecklist();
}
