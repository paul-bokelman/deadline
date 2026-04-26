import { APP_ICONS, createWindow, closeWindow } from "./desktop.js";

export function open() {
  const body = createWindow({
    id: "computer-window",
    title: "My Computer",
    width: 380,
    height: 290,
    left: 80,
    top: 130,
    taskbarIcon: APP_ICONS.computer
  });

  if (!body) return;
  body.replaceChildren();

  const heading = document.createElement("p");
  heading.textContent = "System drives";

  const list = document.createElement("ul");
  list.className = "computer-list";
  ["(C:) Workstation", "(D:) Shared Files", "(A:) Floppy Disk"].forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => closeWindow("computer-window"));

  body.appendChild(heading);
  body.appendChild(list);
  body.appendChild(closeButton);
}
