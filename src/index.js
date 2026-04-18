/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from "blockly";

// ESP32 Blocks & Generators (existing)
import { blocks as printblock } from "./blocks/print";
import { blocks1 as textBlocks } from "./blocks/text";
import { blocks2 as waitBlocks } from "./blocks/wait";
import { blocks3 as pinBlocks } from "./blocks/digital_pin";
import { forBlock as printGen } from "./generators/print";
import { forBlock as addTextGen } from "./generators/addText";
import { forBlock as waitGen } from "./generators/wait";
import { forBlock as pinGen } from "./generators/digital_pin";

// ESP32 Blocks & Generators (new modules)
import { actuatorBlocks } from "./blocks/esp32/actuatorBlocks";
import { sensorBlocks } from "./blocks/esp32/sensorBlocks";
import { communicationBlocks } from "./blocks/esp32/communicationBlocks";
import { inputBlocks } from "./blocks/esp32/inputBlocks";
import { terminalBlocks } from "./blocks/esp32/terminalBlocks";
import { notificationBlocks } from "./blocks/esp32/notificationBlocks";
import { cameraBlocks } from "./blocks/esp32/cameraBlocks";
import { iotBlocks } from "./blocks/esp32/iotBlocks";
import { dabbleBlocks } from "./blocks/esp32/dabbleBlocks";
import { esp32CoreBlocks } from "./blocks/esp32/esp32CoreBlocks";
import { forBlock as actuatorGen } from "./generators/esp32/actuatorGen";
import { forBlock as sensorGen } from "./generators/esp32/sensorGen";
import { forBlock as communicationGen } from "./generators/esp32/communicationGen";
import { forBlock as inputGen } from "./generators/esp32/inputGen";
import { forBlock as terminalGen } from "./generators/esp32/terminalGen";
import { forBlock as notificationGen } from "./generators/esp32/notificationGen";
import { forBlock as cameraGen } from "./generators/esp32/cameraGen";
import { forBlock as iotGen } from "./generators/esp32/iotGen";
import { forBlock as dabbleGen } from "./generators/esp32/dabbleGen";
import { forBlock as esp32CoreGen } from "./generators/esp32/esp32CoreGen";
import { pythonGenerator } from "blockly/python";

// Scratch Blocks & Runtime
import { motionBlocks } from "./blocks/motionBlocks";
import { looksBlocks } from "./blocks/looksBlocks";
import { eventBlocks } from "./blocks/eventBlocks";
import { controlBlocks } from "./blocks/controlBlocks";
import { sensingBlocks } from "./blocks/sensingBlocks";
import { soundBlocks } from "./blocks/soundBlocks";
import { scratchToolbox } from "./scratchToolbox";
import { BlockInterpreter } from "./engine/BlockInterpreter";
import { StageRenderer } from "./engine/StageRenderer";
import spriteStore from "./engine/SpriteStore";
import eventBus, { Events } from "./engine/EventBus";

// UI Components
import { save, load } from "./serialization";
import { toolbox as espToolbox } from "./toolbox";
import { addCustomToolbar } from "./ui/customToolbar";
import { initUploadPanel } from "./ui/uploadPanel";
import { buildESP32Code } from "./upload/codeBuilder";
import { initModeSwitcher, getCurrentMode } from "./ui/ModeSwitcher";
import { initSpritePanel } from "./ui/SpritePanel";
import { initConnectButton } from "./ui/ConnectModal";
import "./index.css";

// ── 1. Register Built-in & ESP32 Blocks ─────────────────────
Blockly.common.defineBlocks(printblock);
Blockly.common.defineBlocks(textBlocks);
Blockly.common.defineBlocks(waitBlocks);
Blockly.common.defineBlocks(pinBlocks);

// New ESP32 module blocks
Blockly.common.defineBlocks(actuatorBlocks);
Blockly.common.defineBlocks(sensorBlocks);
Blockly.common.defineBlocks(communicationBlocks);
Blockly.common.defineBlocks(inputBlocks);
Blockly.common.defineBlocks(terminalBlocks);
Blockly.common.defineBlocks(notificationBlocks);
Blockly.common.defineBlocks(cameraBlocks);
Blockly.common.defineBlocks(iotBlocks);
Blockly.common.defineBlocks(dabbleBlocks);
Blockly.common.defineBlocks(esp32CoreBlocks);

Object.assign(pythonGenerator.forBlock, printGen);
Object.assign(pythonGenerator.forBlock, addTextGen);
Object.assign(pythonGenerator.forBlock, waitGen);
Object.assign(pythonGenerator.forBlock, pinGen);

// New ESP32 module generators
Object.assign(pythonGenerator.forBlock, actuatorGen);
Object.assign(pythonGenerator.forBlock, sensorGen);
Object.assign(pythonGenerator.forBlock, communicationGen);
Object.assign(pythonGenerator.forBlock, inputGen);
Object.assign(pythonGenerator.forBlock, terminalGen);
Object.assign(pythonGenerator.forBlock, notificationGen);
Object.assign(pythonGenerator.forBlock, cameraGen);
Object.assign(pythonGenerator.forBlock, iotGen);
Object.assign(pythonGenerator.forBlock, dabbleGen);
Object.assign(pythonGenerator.forBlock, esp32CoreGen);

// ── 2. Register Scratch Blocks ──────────────────────────────
Blockly.common.defineBlocks(motionBlocks);
Blockly.common.defineBlocks(looksBlocks);
Blockly.common.defineBlocks(soundBlocks);
Blockly.common.defineBlocks(eventBlocks);
Blockly.common.defineBlocks(controlBlocks);
Blockly.common.defineBlocks(sensingBlocks);

// ── 3. Inject Blockly Workspace ─────────────────────────────
const blocklyDiv = document.getElementById("blocklyDiv");
// Start with Scratch toolbox initially
const ws = Blockly.inject(blocklyDiv, { 
  toolbox: scratchToolbox
});

addCustomToolbar(); // Add color circles for ESP32 toolbox (if used)

// ── 4. Initialize Scratch Engine (Stage & Runtime) ──────────
const stageContainer = document.getElementById("stageCanvas");
const renderer = new StageRenderer(stageContainer);
const interpreter = new BlockInterpreter(spriteStore, ws);
interpreter.setRenderer(renderer);

// PixiJS v8 Application.init() is async — wrap setup
(async () => {
  await renderer.init();

  // Add initial sprite
  spriteStore.addSprite("Cat");

  // Wire StageRenderer to SpriteStore
  spriteStore.on((event) => {
    renderer.setSprites(spriteStore.getAllSprites());
  });
  renderer.setSprites(spriteStore.getAllSprites());

  // Handle sprite selection changes
  spriteStore.on((event, sprite) => {
    if (event === "select" && sprite) {
      ws.clear();
      if (sprite.workspaceState) {
          Blockly.serialization.workspaces.load(sprite.workspaceState, ws);
      }
    }
  });

  // Continuously save workspace to selected sprite
  ws.addChangeListener((e) => {
      if (e.isUiEvent || ws.isDragging()) return;
      
      if (getCurrentMode() === "scratch") {
          const selectedId = spriteStore.selectedSpriteId;
          if (selectedId) {
              const state = Blockly.serialization.workspaces.save(ws);
              spriteStore.saveWorkspaceState(selectedId, state);
          }
      }
  });

  // Green Flag & Stop Buttons
  document.getElementById("greenFlagBtn")?.addEventListener("click", () => {
      spriteStore.resetAll();
      interpreter.startAll();
  });

  document.getElementById("stopBtn")?.addEventListener("click", () => {
      interpreter.stopAll();
  });

  // Initialize sprite panel UI
  initSpritePanel();
})();

// ── 5. Mode Switcher & Dual Mode Logic ──────────────────────
initModeSwitcher((newMode) => {
  console.log("Mode switched to:", newMode);

  if (newMode === "scratch") {
    // Switch to Scratch toolbox
    ws.updateToolbox(scratchToolbox);
    addCustomToolbar(); // Inject color nodes for Scratch
    
    // Load current sprite's workspace
    ws.clear();
    const activeSprite = spriteStore.getSelectedSprite();
    if (activeSprite && activeSprite.workspaceState) {
        Blockly.serialization.workspaces.load(activeSprite.workspaceState, ws);
    }
  } else {
    // Switch to customized Board toolbox (Scratch + ESP32)
    const esp32Category = espToolbox.contents.find(c => c.name === 'ESP32');
    const boardToolboxContents = [...scratchToolbox.contents];
    const myBlocksIndex = boardToolboxContents.findIndex(c => c.name === 'My Blocks');
    if (myBlocksIndex !== -1) {
      boardToolboxContents.splice(myBlocksIndex, 0, esp32Category);
    } else {
      boardToolboxContents.push(esp32Category);
    }
    const boardToolbox = {
      kind: "categoryToolbox",
      contents: boardToolboxContents
    };
    ws.updateToolbox(boardToolbox);
    addCustomToolbar(); // Re-inject color nodes for Board toolbox
    
    // Clear workspace for ESP mode (or load ESP specific saved state)
    ws.clear(); 
    // In a full app, you'd store the ESP32 project state separately.
    // For now, it just starts empty when switching to hardware mode.
  }
});


// ── 6. Connect Button ───────────────────────────────────────
initConnectButton();

// ── 7. ESP32 Board Mode Logic ───────────────────────────────
const codeContent = document.getElementById("codeContent");
const codeGutter = document.getElementById("codeGutter");
const codeLineCount = document.getElementById("codeLineCount");
initUploadPanel(() => pythonGenerator.workspaceToCode(ws));

/**
 * Simple Python syntax highlighter.
 * Wraps keywords, strings, comments, numbers in colored spans.
 */
function highlightPython(code) {
  if (!code) return '<span class="py-comment"># Add blocks to generate code</span>';

  // Escape HTML first
  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Comments
  html = html.replace(/(#.*$)/gm, '<span class="py-comment">$1</span>');

  // Strings (double and single quoted)
  html = html.replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g, '<span class="py-string">$1</span>');

  // Decorators
  html = html.replace(/(@\w+)/g, '<span class="py-decorator">$1</span>');

  // Keywords
  const keywords = ['import', 'from', 'def', 'class', 'return', 'if', 'elif', 'else', 'while', 'for', 'in', 'not', 'and', 'or', 'try', 'except', 'finally', 'with', 'as', 'pass', 'break', 'continue', 'yield', 'lambda', 'True', 'False', 'None', 'raise', 'global', 'async', 'await'];
  keywords.forEach(kw => {
    const re = new RegExp('\\b(' + kw + ')\\b', 'g');
    html = html.replace(re, '<span class="py-keyword">$1</span>');
  });

  // Built-in functions
  const builtins = ['print', 'range', 'len', 'int', 'str', 'float', 'list', 'dict', 'set', 'tuple', 'type', 'input', 'sleep', 'Pin', 'ADC', 'PWM', 'time'];
  builtins.forEach(fn => {
    const re = new RegExp('\\b(' + fn + ')\\b', 'g');
    html = html.replace(re, '<span class="py-builtin">$1</span>');
  });

  // Numbers
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="py-number">$1</span>');

  return html;
}

function updateCodeEditor(code) {
  const lines = (code || '').split('\n');

  // Update gutter line numbers
  if (codeGutter) {
    codeGutter.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
  }

  // Update line count
  if (codeLineCount) {
    codeLineCount.textContent = `${lines.length} line${lines.length !== 1 ? 's' : ''}`;
  }

  // Syntax-highlighted code
  if (codeContent) {
    codeContent.innerHTML = highlightPython(code);
  }
}

const runESPCode = () => {
  if (getCurrentMode() !== "scratch") {
    const raw = pythonGenerator.workspaceToCode(ws);
    const esp32Code = buildESP32Code(raw);
    updateCodeEditor(esp32Code);
  }
};

ws.addChangeListener((e) => {
  if (e.isUiEvent || e.type == Blockly.Events.FINISHED_LOADING || ws.isDragging()) return;
  runESPCode();
});

// Upload / Download buttons
const uploadBtn = document.getElementById("uploadBtn");
if (uploadBtn) {
  uploadBtn.addEventListener("click", () => {
    const code = pythonGenerator.workspaceToCode(ws);
    const esp32Code = buildESP32Code(code);
    // TODO: Real upload via serial
    console.log('Upload requested:', esp32Code);
  });
}

const downloadPyBtn = document.getElementById("downloadPyBtn");
if (downloadPyBtn) {
  downloadPyBtn.addEventListener("click", () => {
    const code = pythonGenerator.workspaceToCode(ws);
    const esp32Code = buildESP32Code(code);
    const blob = new Blob([esp32Code], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "main.py";
    link.click();
  });
}