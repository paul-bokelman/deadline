import { APP_ICONS, createWindow, closeWindow } from "./desktop.js";

const PALETTE = ["#000000", "#a80000", "#006d00", "#0b3ee3", "#ff8a00", "#ffffff"];

export function open() {
  const body = createWindow({
    id: "paint-window",
    title: "Paint",
    width: 460,
    height: 330,
    left: 260,
    top: 90,
    taskbarIcon: APP_ICONS.paint
  });

  if (!body) return;
  body.replaceChildren();

  const toolbar = document.createElement("div");
  toolbar.className = "paint-toolbar";

  const canvas = document.createElement("div");
  canvas.className = "paint-canvas";
  canvas.textContent = "Click a color, then click here to stamp pixels.";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => closeWindow("paint-window"));

  let selectedColor = PALETTE[0];
  PALETTE.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "paint-swatch";
    swatch.style.background = color;
    swatch.title = color;
    swatch.addEventListener("click", () => {
      selectedColor = color;
    });
    toolbar.appendChild(swatch);
  });
  toolbar.appendChild(closeButton);

  canvas.addEventListener("click", (event) => {
    const dot = document.createElement("span");
    dot.className = "paint-dot";
    dot.style.left = `${event.offsetX - 4}px`;
    dot.style.top = `${event.offsetY - 4}px`;
    dot.style.background = selectedColor;
    canvas.appendChild(dot);
  });

  body.appendChild(toolbar);
  body.appendChild(canvas);
}
