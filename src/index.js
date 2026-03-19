/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from "blockly";

// ESP32 Blocks & Generators
import { blocks as printblock } from "./blocks/print";
import { blocks1 as textBlocks } from "./blocks/text";
import { blocks2 as waitBlocks } from "./blocks/wait";
import { blocks3 as pinBlocks } from "./blocks/digital_pin";
import { forBlock as printGen } from "./generators/print";
import { forBlock as addTextGen } from "./generators/addText";
import { forBlock as waitGen } from "./generators/wait";
import { forBlock as pinGen } from "./generators/digital_pin";
import { pythonGenerator } from "blockly/python";

// Scratch Blocks & Runtime
import { motionBlocks } from "./blocks/motionBlocks";
import { looksBlocks } from "./blocks/looksBlocks";
import { eventBlocks } from "./blocks/eventBlocks";
import { controlBlocks } from "./blocks/controlBlocks";
import { sensingBlocks } from "./blocks/sensingBlocks";
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
import "./index.css";

// ── 1. Register Built-in & ESP32 Blocks ─────────────────────
Blockly.common.defineBlocks(printblock);
Blockly.common.defineBlocks(textBlocks);
Blockly.common.defineBlocks(waitBlocks);
Blockly.common.defineBlocks(pinBlocks);

Object.assign(pythonGenerator.forBlock, printGen);
Object.assign(pythonGenerator.forBlock, addTextGen);
Object.assign(pythonGenerator.forBlock, waitGen);
Object.assign(pythonGenerator.forBlock, pinGen);

// ── 2. Register Scratch Blocks ──────────────────────────────
Blockly.common.defineBlocks(motionBlocks);
Blockly.common.defineBlocks(looksBlocks);
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
const canvas = document.getElementById("stageCanvas");
const renderer = new StageRenderer(canvas);
const interpreter = new BlockInterpreter(spriteStore, ws);
interpreter.setRenderer(renderer);

// Add initial sprite
spriteStore.addSprite("Cat");

// Wire StageRenderer to SpriteStore
spriteStore.on((event) => {
  renderer.setSprites(spriteStore.getAllSprites());
});
renderer.setSprites(spriteStore.getAllSprites()); // Initial set

// Start render loop
renderer.start();

// Handle sprite selection changes
spriteStore.on((event, sprite) => {
  if (event === "select" && sprite) {
    // Save current workspace state to the previously selected sprite
    // (Handled automatically by the block change listener, but we could force save)
    
    // Load the newly selected sprite's workspace
    ws.clear();
    if (sprite.workspaceState) {
        Blockly.serialization.workspaces.load(sprite.workspaceState, ws);
    }
  }
});

// Continuously save workspace to selected sprite
ws.addChangeListener((e) => {
    if (e.isUiEvent || ws.isDragging()) return;
    
    // In Scratch mode, save to the selected sprite.
    if (getCurrentMode() === "scratch") {
        const selectedId = spriteStore.selectedSpriteId;
        if (selectedId) {
            const state = Blockly.serialization.workspaces.save(ws);
            spriteStore.saveWorkspaceState(selectedId, state);
        }
    }
    // (Also save to global localstorage for fallback if needed)
});

// Green Flag & Stop Buttons
document.getElementById("greenFlagBtn")?.addEventListener("click", () => {
    spriteStore.resetAll(); // Reset positions before running
    interpreter.startAll();
});

document.getElementById("stopBtn")?.addEventListener("click", () => {
    interpreter.stopAll();
});

// Initialize sprite panel UI
initSpritePanel();

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
    // Switch to ESP32 toolbox
    ws.updateToolbox(espToolbox);
    addCustomToolbar(); // Re-inject color nodes for ESP toolbox
    
    // Clear workspace for ESP mode (or load ESP specific saved state)
    ws.clear(); 
    // In a full app, you'd store the ESP32 project state separately.
    // For now, it just starts empty when switching to hardware mode.
  }
});


// ── 6. ESP32 Board Mode Logic ───────────────────────────────
const codeDiv = document.getElementById("generatedCode")?.firstChild;
initUploadPanel(() => pythonGenerator.workspaceToCode(ws));

const runESPCode = () => {
  if (getCurrentMode() !== "scratch" && codeDiv) {
    const raw = pythonGenerator.workspaceToCode(ws);
    const esp32Code = buildESP32Code(raw);
    codeDiv.innerText = esp32Code || "# Add blocks to generate code";
  }
};

ws.addChangeListener((e) => {
  if (e.isUiEvent || e.type == Blockly.Events.FINISHED_LOADING || ws.isDragging()) return;
  runESPCode();
});

const uploadBtn = document.getElementById("uploadBtn");
if (uploadBtn) {
  uploadBtn.addEventListener("click", () => {
    const code = pythonGenerator.workspaceToCode(ws);
    const blob = new Blob([code], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "program.py";
    link.click();
  });
}