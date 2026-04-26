import { gameState } from "../state.js";

let desktopRoot = null;

function formatTime(date) {
  let hour = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatCountdown(msRemaining) {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export const APP_ICONS = {
  email: "./assets/icons/email.svg",
  portal: "./assets/icons/portal.svg",
  notepad: "./assets/icons/notepad.svg",
  calculator: "./assets/icons/calculator.svg",
  paint: "./assets/icons/paint.svg",
  computer: "./assets/icons/computer.svg",
  recycle: "./assets/icons/recycle.svg",
  start: "./assets/icons/start.svg"
};

function createDesktopIcon(label, iconPath, onDoubleClick) {
  const icon = document.createElement("button");
  icon.className = "desktop-icon";
  icon.type = "button";

  const glyph = document.createElement("div");
  glyph.className = "desktop-icon-glyph";
  const glyphImage = document.createElement("img");
  glyphImage.className = "icon-image";
  glyphImage.src = iconPath;
  glyphImage.alt = "";
  glyph.appendChild(glyphImage);
  icon.appendChild(glyph);

  const iconLabel = document.createElement("span");
  iconLabel.textContent = label;
  icon.appendChild(iconLabel);

  if (onDoubleClick) {
    icon.addEventListener("dblclick", onDoubleClick);
  }

  return icon;
}

function bringWindowToFront(windowId) {
  const windowEl = gameState.windows[windowId];
  if (!windowEl) return;
  gameState.zCounter += 1;
  windowEl.style.zIndex = String(gameState.zCounter);
}

function removeTaskbarButton(windowId) {
  const button = gameState.taskbarButtons[windowId];
  if (button && button.parentElement) {
    button.parentElement.removeChild(button);
  }
  delete gameState.taskbarButtons[windowId];
}

export function closeWindow(windowId) {
  const windowEl = gameState.windows[windowId];
  if (!windowEl) return;

  if (windowEl.parentElement) {
    windowEl.parentElement.removeChild(windowEl);
  }

  removeTaskbarButton(windowId);
  delete gameState.windows[windowId];
}

function makeDraggable(windowId, windowEl, titleBarEl) {
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let dragging = false;

  titleBarEl.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    dragging = true;
    bringWindowToFront(windowId);

    const rect = windowEl.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    document.body.classList.add("dragging");
    event.preventDefault();
  });

  window.addEventListener("mousemove", (event) => {
    if (!dragging || !desktopRoot) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    const nextLeft = Math.max(0, startLeft + dx);
    const nextTop = Math.max(0, startTop + dy);

    const desktopRect = desktopRoot.getBoundingClientRect();
    const windowRect = windowEl.getBoundingClientRect();
    const maxLeft = desktopRect.width - windowRect.width;
    const maxTop = desktopRect.height - windowRect.height - 36;

    windowEl.style.left = `${Math.min(maxLeft, nextLeft)}px`;
    windowEl.style.top = `${Math.min(maxTop, nextTop)}px`;
  });

  window.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove("dragging");
  });
}

export function createWindow({
  id,
  title,
  width = 420,
  height = 320,
  left = 80,
  top = 60,
  onClose,
  taskbarIcon = APP_ICONS.computer
}) {
  if (!desktopRoot) return null;

  const existing = gameState.windows[id];
  if (existing) {
    bringWindowToFront(id);
    return existing.querySelector(".window-body");
  }

  const windowEl = document.createElement("div");
  windowEl.className = "window app-window";
  windowEl.style.width = `${width}px`;
  windowEl.style.height = `${height}px`;
  windowEl.style.left = `${left}px`;
  windowEl.style.top = `${top}px`;
  windowEl.style.position = "absolute";

  const titleBar = document.createElement("div");
  titleBar.className = "title-bar";

  const titleBarText = document.createElement("div");
  titleBarText.className = "title-bar-text";
  titleBarText.textContent = title;
  titleBar.appendChild(titleBarText);

  const controls = document.createElement("div");
  controls.className = "title-bar-controls";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close");
  controls.appendChild(closeBtn);
  titleBar.appendChild(controls);
  windowEl.appendChild(titleBar);

  const body = document.createElement("div");
  body.className = "window-body";
  windowEl.appendChild(body);

  closeBtn.addEventListener("click", () => {
    closeWindow(id);
    if (typeof onClose === "function") {
      onClose();
    }
  });

  windowEl.addEventListener("mousedown", () => bringWindowToFront(id));
  makeDraggable(id, windowEl, titleBar);

  desktopRoot.appendChild(windowEl);
  gameState.windows[id] = windowEl;
  bringWindowToFront(id);

  if (gameState.ui.taskbarWindowsEl) {
    const taskButton = document.createElement("button");
    taskButton.type = "button";
    taskButton.className = "taskbar-window-button";

    const icon = document.createElement("img");
    icon.className = "taskbar-window-icon";
    icon.src = taskbarIcon;
    icon.alt = "";
    taskButton.appendChild(icon);

    const label = document.createElement("span");
    label.textContent = title;
    taskButton.appendChild(label);

    taskButton.addEventListener("click", () => bringWindowToFront(id));
    gameState.ui.taskbarWindowsEl.appendChild(taskButton);
    gameState.taskbarButtons[id] = taskButton;
  }

  return body;
}

export function updateClockAndCountdown(currentTime, msRemaining) {
  if (gameState.ui.systemClockEl) {
    gameState.ui.systemClockEl.textContent = formatTime(currentTime);
  }

  if (gameState.ui.countdownEl) {
    gameState.ui.countdownEl.textContent = `Time remaining: ${formatCountdown(
      msRemaining
    )}`;
  }
}

export function showEndOverlay(gameStatus) {
  if (!gameState.ui.overlayEl) return;

  const overlay = gameState.ui.overlayEl;
  overlay.replaceChildren();
  overlay.classList.remove("hidden");

  const panel = document.createElement("div");
  panel.className = "end-panel window";

  const body = document.createElement("div");
  body.className = "window-body end-panel-body";

  const message = document.createElement("p");
  message.textContent =
    gameStatus === "won"
      ? "Submitted on time. Boss is pleased."
      : "You missed the deadline. You're fired.";

  const playAgain = document.createElement("button");
  playAgain.type = "button";
  playAgain.textContent = "Play Again";
  playAgain.addEventListener("click", () => window.location.reload());

  body.appendChild(message);
  body.appendChild(playAgain);
  panel.appendChild(body);
  overlay.appendChild(panel);
}

export function renderDesktop(root, handlers) {
  root.replaceChildren();
  root.className = "desktop-shell";

  const desktop = document.createElement("div");
  desktop.className = "desktop-area";
  root.appendChild(desktop);
  desktopRoot = desktop;

  const countdown = document.createElement("div");
  countdown.className = "countdown-box";
  countdown.textContent = "Time remaining: 13:00";
  desktop.appendChild(countdown);

  const iconColumn = document.createElement("div");
  iconColumn.className = "desktop-icons";
  desktop.appendChild(iconColumn);

  const launchers = [
    { label: "Email", icon: APP_ICONS.email, onOpen: handlers.onOpenEmail },
    { label: "Portal", icon: APP_ICONS.portal, onOpen: handlers.onOpenPortal },
    { label: "Notepad", icon: APP_ICONS.notepad, onOpen: handlers.onOpenNotepad },
    {
      label: "Calculator",
      icon: APP_ICONS.calculator,
      onOpen: handlers.onOpenCalculator
    },
    { label: "Paint", icon: APP_ICONS.paint, onOpen: handlers.onOpenPaint },
    {
      label: "My Computer",
      icon: APP_ICONS.computer,
      onOpen: handlers.onOpenComputer
    },
    {
      label: "Recycle Bin",
      icon: APP_ICONS.recycle,
      onOpen: handlers.onOpenRecycleBin
    }
  ];

  launchers.forEach((launcher) => {
    iconColumn.appendChild(
      createDesktopIcon(launcher.label, launcher.icon, launcher.onOpen)
    );
  });

  const overlay = document.createElement("div");
  overlay.className = "end-overlay hidden";
  desktop.appendChild(overlay);

  const taskbar = document.createElement("div");
  taskbar.className = "taskbar";

  const startBtn = document.createElement("button");
  startBtn.type = "button";
  startBtn.className = "start-button";
  const startIcon = document.createElement("img");
  startIcon.className = "start-icon";
  startIcon.src = APP_ICONS.start;
  startIcon.alt = "";
  startBtn.appendChild(startIcon);
  startBtn.appendChild(document.createTextNode("Start"));
  taskbar.appendChild(startBtn);

  const dock = document.createElement("div");
  dock.className = "taskbar-dock";
  launchers.forEach((launcher) => {
    const quickLaunch = document.createElement("button");
    quickLaunch.type = "button";
    quickLaunch.className = "dock-button";
    quickLaunch.title = launcher.label;
    const quickIcon = document.createElement("img");
    quickIcon.className = "dock-icon";
    quickIcon.src = launcher.icon;
    quickIcon.alt = "";
    quickLaunch.appendChild(quickIcon);
    quickLaunch.addEventListener("click", () => {
      if (typeof launcher.onOpen === "function") launcher.onOpen();
    });
    dock.appendChild(quickLaunch);
  });
  taskbar.appendChild(dock);

  const windowButtons = document.createElement("div");
  windowButtons.className = "taskbar-windows";
  taskbar.appendChild(windowButtons);

  const tray = document.createElement("div");
  tray.className = "system-tray";
  const clock = document.createElement("span");
  clock.textContent = "4:47 PM";
  tray.appendChild(clock);
  taskbar.appendChild(tray);

  root.appendChild(taskbar);

  gameState.ui.countdownEl = countdown;
  gameState.ui.systemClockEl = clock;
  gameState.ui.taskbarWindowsEl = windowButtons;
  gameState.ui.overlayEl = overlay;
}
