/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from "blockly";
import { blocks as printblock } from "./blocks/print";
import { blocks1 as textBlocks } from "./blocks/text";
import { blocks2 as waitBlocks } from "./blocks/wait";
import { blocks3 as pinBlocks } from "./blocks/digital_pin";

// ── Python (ESP32) generators ──
import { forBlock as printGen } from "./generators/print";
import { forBlock as addTextGen } from "./generators/addText";
import { forBlock as waitGen } from "./generators/wait";
import { forBlock as pinGen } from "./generators/digital_pin";

// ── Arduino (C++) generators ──
import { forBlock as ardPrintGen } from "./generators/arduino/print";
import { forBlock as ardAddTextGen } from "./generators/arduino/addText";
import { forBlock as ardWaitGen } from "./generators/arduino/wait";
import { forBlock as ardPinGen } from "./generators/arduino/digital_pin";
import { forBlock as ardBuiltinGen } from "./generators/arduino/builtins";

import { pythonGenerator } from "blockly/python";
import { save, load } from "./serialization";
import { toolbox } from "./toolbox";
import { addCustomToolbar } from "./ui/customToolbar";
import { initUploadPanel } from "./ui/uploadPanel";
import { initArduinoUploadPanel } from "./ui/arduinoUploadPanel";
import { buildESP32Code } from "./upload/codeBuilder";
import { buildArduinoCode } from "./upload/arduinoCodeBuilder";
import "./index.css";

// Register all block definitions with Blockly
Blockly.common.defineBlocks(printblock);
Blockly.common.defineBlocks(textBlocks);
Blockly.common.defineBlocks(waitBlocks);
Blockly.common.defineBlocks(pinBlocks);

// ── Register Python generators (ESP32) ──
Object.assign(pythonGenerator.forBlock, printGen);
Object.assign(pythonGenerator.forBlock, addTextGen);
Object.assign(pythonGenerator.forBlock, waitGen);
Object.assign(pythonGenerator.forBlock, pinGen);

// ── Create Arduino generator (extends CodeGenerator) ──
const arduinoGenerator = new Blockly.CodeGenerator("Arduino");
arduinoGenerator.PRECEDENCE = 0;

// Register Arduino-specific generators for built-in blocks (loops, logic, math, etc.)
Object.assign(arduinoGenerator.forBlock, ardBuiltinGen);

// Override with Arduino-specific generators for our custom blocks
Object.assign(arduinoGenerator.forBlock, ardPrintGen);
Object.assign(arduinoGenerator.forBlock, ardAddTextGen);
Object.assign(arduinoGenerator.forBlock, ardWaitGen);
Object.assign(arduinoGenerator.forBlock, ardPinGen);

// Arduino generator needs scrub_ and scrubNakedValue_ to work
arduinoGenerator.scrubNakedValue = function (line) {
  return line + ";\n";
};

arduinoGenerator.scrub_ = function (block, code, thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  if (nextBlock && !thisOnly) {
    return code + arduinoGenerator.blockToCode(nextBlock);
  }
  return code;
};

// ── Set up UI elements and inject Blockly ──
const codeDiv = document.getElementById("generatedCode").firstChild;
const blocklyDiv = document.getElementById("blocklyDiv");
const boardSelector = document.getElementById("boardSelector");
const codeLabelText = document.getElementById("codeLabelText");

console.log("Injecting Workspace...");
const ws = Blockly.inject(blocklyDiv, { toolbox });
console.log("Workspace:", ws);

addCustomToolbar();

// Track selected board
let selectedBoard = "esp32";

// Mount the ESP32 upload panel — passes a getter so it always reads latest code
initUploadPanel(
  () => pythonGenerator.workspaceToCode(ws),
  () => selectedBoard
);

// Mount the Arduino upload panel — passes a getter for compiled Arduino C++ code
initArduinoUploadPanel(() => {
  arduinoGenerator.definitions_ = Object.create(null);
  const raw = arduinoGenerator.workspaceToCode(ws);
  return buildArduinoCode(raw, arduinoGenerator.definitions_);
});

// Initially hide Arduino upload panel
const arduinoUploadPanelEl = document.getElementById("arduinoUploadPanel");
if (arduinoUploadPanelEl) arduinoUploadPanelEl.style.display = "none";

// This function resets the code div and shows the generated code
const runCode = () => {
  if (selectedBoard === "arduino") {
    // Reset definitions before generation
    arduinoGenerator.definitions_ = Object.create(null);
    const raw = arduinoGenerator.workspaceToCode(ws);
    const sketch = buildArduinoCode(raw, arduinoGenerator.definitions_);
    codeDiv.innerText = sketch || "// Add blocks to generate code";
  } else {
    const raw = pythonGenerator.workspaceToCode(ws);
    const esp32Code = buildESP32Code(raw);
    codeDiv.innerText = esp32Code || "# Add blocks to generate code";
  }
  console.log("workspace changed");
};

// Board selector change handler
boardSelector.addEventListener("change", (e) => {
  selectedBoard = e.target.value;
  if (selectedBoard === "arduino") {
    codeLabelText.textContent = "Arduino C++ (Uno-Ready)";
  } else {
    codeLabelText.textContent = "MicroPython (ESP32-Ready)";
  }
  // Update upload panel visibility: show ESP32 panel for esp32, Arduino panel for arduino
  const uploadPanel = document.getElementById("uploadPanel");
  const ardUploadPanel = document.getElementById("arduinoUploadPanel");
  if (uploadPanel) {
    uploadPanel.style.display = selectedBoard === "arduino" ? "none" : "block";
  }
  if (ardUploadPanel) {
    ardUploadPanel.style.display = selectedBoard === "arduino" ? "block" : "none";
  }
  runCode();
});

// Load the initial state from storage and run the code.
load(ws);
runCode();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
  if (e.isUiEvent) return;
  save(ws);
});

// Whenever the workspace changes meaningfully, run the code again.
ws.addChangeListener((e) => {
  if (
    e.isUiEvent ||
    e.type == Blockly.Events.FINISHED_LOADING ||
    ws.isDragging()
  ) {
    return;
  }
  runCode();
});
