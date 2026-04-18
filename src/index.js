// main entry — registers blocks, injects workspace, wires engine and ui
import * as Blockly from "blockly";

import { blocks as printblock } from "./blocks/print";
import { blocks1 as textBlocks } from "./blocks/text";
import { blocks2 as waitBlocks } from "./blocks/wait";
import { blocks3 as pinBlocks } from "./blocks/digital_pin";
import { forBlock as printGen } from "./generators/print";
import { forBlock as addTextGen } from "./generators/addText";
import { forBlock as waitGen } from "./generators/wait";
import { forBlock as pinGen } from "./generators/digital_pin";

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

import { toolbox as espToolbox } from "./toolbox";
import { addCustomToolbar } from "./ui/customToolbar";
import { initUploadPanel } from "./ui/uploadPanel";
import { buildESP32Code } from "./upload/codeBuilder";
import { initModeSwitcher, getCurrentMode } from "./ui/ModeSwitcher";
import { initSpritePanel } from "./ui/SpritePanel";
import { initConnectButton } from "./ui/ConnectModal";
import "./index.css";

Blockly.common.defineBlocks(printblock);
Blockly.common.defineBlocks(textBlocks);
Blockly.common.defineBlocks(waitBlocks);
Blockly.common.defineBlocks(pinBlocks);

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

Blockly.common.defineBlocks(motionBlocks);
Blockly.common.defineBlocks(looksBlocks);
Blockly.common.defineBlocks(soundBlocks);
Blockly.common.defineBlocks(eventBlocks);
Blockly.common.defineBlocks(controlBlocks);
Blockly.common.defineBlocks(sensingBlocks);

const blocklyDiv = document.getElementById("blocklyDiv");

const ws = Blockly.inject(blocklyDiv, { 
  toolbox: scratchToolbox
});

addCustomToolbar(); 

const stageContainer = document.getElementById("stageCanvas");
const renderer = new StageRenderer(stageContainer);
const interpreter = new BlockInterpreter(spriteStore, ws);
interpreter.setRenderer(renderer);

(async () => {
  await renderer.init();

  spriteStore.addSprite("Cat");

  spriteStore.on((event) => {
    renderer.setSprites(spriteStore.getAllSprites());
  });
  renderer.setSprites(spriteStore.getAllSprites());

  spriteStore.on((event, sprite) => {
    if (event === "select" && sprite) {
      ws.clear();
      if (sprite.workspaceState) {
          Blockly.serialization.workspaces.load(sprite.workspaceState, ws);
      }
    }
  });

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

  document.getElementById("greenFlagBtn")?.addEventListener("click", () => {
      spriteStore.resetAll();
      interpreter.startAll();
  });

  document.getElementById("stopBtn")?.addEventListener("click", () => {
      interpreter.stopAll();
  });

  initSpritePanel();
})();

initModeSwitcher((newMode) => {
  console.log("Mode switched to:", newMode);

  if (newMode === "scratch") {

    ws.updateToolbox(scratchToolbox);
    addCustomToolbar(); 

    ws.clear();
    const activeSprite = spriteStore.getSelectedSprite();
    if (activeSprite && activeSprite.workspaceState) {
        Blockly.serialization.workspaces.load(activeSprite.workspaceState, ws);
    }
  } else {
    
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
    addCustomToolbar(); 

    ws.clear(); 

  }
});

initConnectButton();

const codeContent = document.getElementById("codeContent");
const codeGutter = document.getElementById("codeGutter");
const codeLineCount = document.getElementById("codeLineCount");
initUploadPanel(() => pythonGenerator.workspaceToCode(ws));

function highlightPython(code) {
  if (!code) return '<span class="py-comment"># Add blocks to generate code</span>';

  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/(#.*$)/gm, '<span class="py-comment">$1</span>');

  html = html.replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g, '<span class="py-string">$1</span>');


  html = html.replace(/(@\w+)/g, '<span class="py-decorator">$1</span>');


  const keywords = ['import', 'from', 'def', 'class', 'return', 'if', 'elif', 'else', 'while', 'for', 'in', 'not', 'and', 'or', 'try', 'except', 'finally', 'with', 'as', 'pass', 'break', 'continue', 'yield', 'lambda', 'True', 'False', 'None', 'raise', 'global', 'async', 'await'];
  keywords.forEach(kw => {
    const re = new RegExp('\\b(' + kw + ')\\b', 'g');
    html = html.replace(re, '<span class="py-keyword">$1</span>');
  });


  const builtins = ['print', 'range', 'len', 'int', 'str', 'float', 'list', 'dict', 'set', 'tuple', 'type', 'input', 'sleep', 'Pin', 'ADC', 'PWM', 'time'];
  builtins.forEach(fn => {
    const re = new RegExp('\\b(' + fn + ')\\b', 'g');
    html = html.replace(re, '<span class="py-builtin">$1</span>');
  });


  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="py-number">$1</span>');

  return html;
}

function updateCodeEditor(code) {
  const lines = (code || '').split('\n');

  if (codeGutter) {
    codeGutter.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
  }

  if (codeLineCount) {
    codeLineCount.textContent = `${lines.length} line${lines.length !== 1 ? 's' : ''}`;
  }

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
  if (e.isUiEvent || e.type === Blockly.Events.FINISHED_LOADING || ws.isDragging()) return;
  runESPCode();
});

const uploadBtn = document.getElementById("uploadBtn");
if (uploadBtn) {
  uploadBtn.addEventListener("click", () => {
    const code = pythonGenerator.workspaceToCode(ws);
    const esp32Code = buildESP32Code(code);
    console.log('[Legacy Upload Button] Code:', esp32Code);
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
