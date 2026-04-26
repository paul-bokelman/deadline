import { APP_ICONS, createWindow, closeWindow } from "./desktop.js";

function parseNumber(rawValue) {
  const value = Number.parseFloat(rawValue);
  return Number.isFinite(value) ? value : null;
}

export function open() {
  const body = createWindow({
    id: "calculator-window",
    title: "Calculator",
    width: 320,
    height: 240,
    left: 180,
    top: 100,
    taskbarIcon: APP_ICONS.calculator
  });

  if (!body) return;
  body.replaceChildren();

  const wrapper = document.createElement("div");
  wrapper.className = "calculator-panel";

  const first = document.createElement("input");
  first.type = "number";
  first.placeholder = "First number";

  const second = document.createElement("input");
  second.type = "number";
  second.placeholder = "Second number";

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "Add";

  const multiplyButton = document.createElement("button");
  multiplyButton.type = "button";
  multiplyButton.textContent = "Multiply";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", () => closeWindow("calculator-window"));

  const result = document.createElement("p");
  result.className = "inline-status";

  function calculate(operation) {
    const a = parseNumber(first.value);
    const b = parseNumber(second.value);
    if (a === null || b === null) {
      result.textContent = "Enter two valid numbers.";
      return;
    }

    const output = operation === "add" ? a + b : a * b;
    result.textContent = `Result: ${output}`;
  }

  addButton.addEventListener("click", () => calculate("add"));
  multiplyButton.addEventListener("click", () => calculate("multiply"));

  wrapper.appendChild(first);
  wrapper.appendChild(second);
  wrapper.appendChild(addButton);
  wrapper.appendChild(multiplyButton);
  wrapper.appendChild(closeButton);
  wrapper.appendChild(result);
  body.appendChild(wrapper);
}
