import { REQUIRED_FILE_NAME, gameState } from "../state.js";
import { createWindow, closeWindow } from "./desktop.js";

export function open() {
  const body = createWindow({
    id: "email-window",
    title: "Inbox - boss@company.com",
    width: 470,
    height: 320,
    left: 70,
    top: 70
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

  emailPanel.appendChild(attachmentRow);
  body.appendChild(emailPanel);

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

  downloadBtn.addEventListener("click", () => {
    if (!gameState.downloadedFiles.includes(REQUIRED_FILE_NAME)) {
      gameState.downloadedFiles.push(REQUIRED_FILE_NAME);
    }

    status.textContent = `${REQUIRED_FILE_NAME} downloaded.`;
    window.setTimeout(() => {
      status.textContent = "";
    }, 1800);
  });
}
