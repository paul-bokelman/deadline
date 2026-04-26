import { APP_ICONS, createWindow, closeWindow } from "./desktop.js";

export function open() {
  const body = createWindow({
    id: "notepad-window",
    title: "Notepad",
    width: 430,
    height: 320,
    left: 120,
    top: 80,
    taskbarIcon: APP_ICONS.notepad
  });

  if (!body) return;
  body.replaceChildren();

  const textArea = document.createElement("textarea");
  textArea.className = "notepad-editor";
  textArea.value =
    "TODO:\n- Submit Q3 report\n- Reply to boss\n- Do not miss 5:00 PM deadline\n\nMeeting Notes:\n- Rotate mailbox credentials weekly\n- current mailbox pass: petunia-98\n- maybe delete this later";
  body.appendChild(textArea);

  const actions = document.createElement("div");
  actions.className = "window-actions";

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Save";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => closeWindow("notepad-window"));

  const status = document.createElement("span");
  status.className = "inline-status";

  saveButton.addEventListener("click", () => {
    status.textContent = "Saved.";
    window.setTimeout(() => {
      status.textContent = "";
    }, 1400);
  });

  actions.appendChild(saveButton);
  actions.appendChild(closeButton);
  actions.appendChild(status);
  body.appendChild(actions);
}
