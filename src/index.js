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
import { forBlock as printGen } from "./generators/print";
import { forBlock as addTextGen } from "./generators/addText";
import { forBlock as waitGen } from "./generators/wait";
import { forBlock as pinGen } from "./generators/digital_pin";
import { pythonGenerator } from "blockly/python";
import { save, load } from "./serialization";
import { toolbox } from "./toolbox";
import { addCustomToolbar } from "./ui/customToolbar";
import { initUploadPanel } from "./ui/uploadPanel";
import { buildESP32Code } from "./upload/codeBuilder";
import "./index.css";

// Register all block definitions with Blockly
Blockly.common.defineBlocks(printblock);
Blockly.common.defineBlocks(textBlocks);
Blockly.common.defineBlocks(waitBlocks);
Blockly.common.defineBlocks(pinBlocks);

// Register all code generators
Object.assign(pythonGenerator.forBlock, printGen);
Object.assign(pythonGenerator.forBlock, addTextGen);
Object.assign(pythonGenerator.forBlock, waitGen);
Object.assign(pythonGenerator.forBlock, pinGen);


// Set up UI elements and inject Blockly
const codeDiv = document.getElementById("generatedCode").firstChild;
const blocklyDiv = document.getElementById("blocklyDiv");
console.log("Injecting Workspace...");
const ws = Blockly.inject(blocklyDiv, { toolbox });
console.log("Workspace:", ws);

addCustomToolbar();

// Mount the upload panel — passes a getter so it always reads latest code
initUploadPanel(() => pythonGenerator.workspaceToCode(ws));

// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
// In a real application, you probably shouldn't use `eval`.
const runCode = () => {
  const raw = pythonGenerator.workspaceToCode(ws);
  const esp32Code = buildESP32Code(raw);
  codeDiv.innerText = esp32Code || "# Add blocks to generate code";
  console.log("workspace changed");
};

// Load the initial state from storage and run the code.
load(ws);
runCode();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  save(ws);
});

// Whenever the workspace changes meaningfully, run the code again.
ws.addChangeListener((e) => {
  // Don't run the code when the workspace finishes loading; we're
  // already running it once when the application starts.
  // Don't run the code during drags; we might have invalid state.
  if (
    e.isUiEvent ||
    e.type == Blockly.Events.FINISHED_LOADING ||
    ws.isDragging()
  ) {
    return;
  }
  runCode();
});
