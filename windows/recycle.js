import { APP_ICONS, createWindow, closeWindow } from "./desktop.js";

export function open() {
  const body = createWindow({
    id: "recycle-window",
    title: "Recycle Bin",
    width: 350,
    height: 240,
    left: 330,
    top: 140,
    taskbarIcon: APP_ICONS.recycle
  });

  if (!body) return;
  body.replaceChildren();

  const message = document.createElement("p");
  message.textContent = "Recycle Bin is empty.";

  const restore = document.createElement("button");
  restore.type = "button";
  restore.textContent = "Restore All";
  restore.disabled = true;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => closeWindow("recycle-window"));

  const actions = document.createElement("div");
  actions.className = "window-actions";
  actions.appendChild(restore);
  actions.appendChild(closeButton);

  body.appendChild(message);
  body.appendChild(actions);
}
