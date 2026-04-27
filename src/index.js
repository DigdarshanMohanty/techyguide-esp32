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
import { forBlock as controlGen } from "./generators/controlGen";

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

// MicroPython generators (existing)
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

// Arduino C++ generators (new)
import { arduinoGenerator } from "./generators/arduinoGenerator";
import { forBlock as arduinoControlGen } from "./generators/arduinoControlGen";
import { forBlock as arduinoCoreGen } from "./generators/esp32/arduino/coreGen";
import { forBlock as arduinoActuatorGen } from "./generators/esp32/arduino/actuatorGen";
import { forBlock as arduinoSensorGen } from "./generators/esp32/arduino/sensorGen";
import { forBlock as arduinoCommunicationGen } from "./generators/esp32/arduino/communicationGen";
import { forBlock as arduinoInputGen } from "./generators/esp32/arduino/inputGen";
import { forBlock as arduinoTerminalGen } from "./generators/esp32/arduino/terminalGen";
import { forBlock as arduinoNotificationGen } from "./generators/esp32/arduino/notificationGen";
import { forBlock as arduinoCameraGen } from "./generators/esp32/arduino/cameraGen";
import { forBlock as arduinoIotGen } from "./generators/esp32/arduino/iotGen";
import { forBlock as arduinoDabbleGen } from "./generators/esp32/arduino/dabbleGen";

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
import { buildArduinoSketch, emptyArduinoSketch } from "./upload/arduinoCodeBuilder";
import { initModeSwitcher, getCurrentMode } from "./ui/ModeSwitcher";
import { initSpritePanel } from "./ui/SpritePanel";
import { initConnectButton } from "./ui/ConnectModal";
import { refreshIcons } from "./ui/icons";
import "./index.css";
import "./output.css";

// ── Register Block Definitions ──────────────────────
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

// MicroPython generator registrations
Object.assign(pythonGenerator.forBlock, printGen);
Object.assign(pythonGenerator.forBlock, addTextGen);
Object.assign(pythonGenerator.forBlock, waitGen);
Object.assign(pythonGenerator.forBlock, pinGen);
Object.assign(pythonGenerator.forBlock, controlGen);

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

// Arduino C++ generator registrations
Object.assign(arduinoGenerator.forBlock, arduinoControlGen);
Object.assign(arduinoGenerator.forBlock, arduinoCoreGen);
Object.assign(arduinoGenerator.forBlock, arduinoActuatorGen);
Object.assign(arduinoGenerator.forBlock, arduinoSensorGen);
Object.assign(arduinoGenerator.forBlock, arduinoCommunicationGen);
Object.assign(arduinoGenerator.forBlock, arduinoInputGen);
Object.assign(arduinoGenerator.forBlock, arduinoTerminalGen);
Object.assign(arduinoGenerator.forBlock, arduinoNotificationGen);
Object.assign(arduinoGenerator.forBlock, arduinoCameraGen);
Object.assign(arduinoGenerator.forBlock, arduinoIotGen);
Object.assign(arduinoGenerator.forBlock, arduinoDabbleGen);

Blockly.common.defineBlocks(motionBlocks);
Blockly.common.defineBlocks(looksBlocks);
Blockly.common.defineBlocks(soundBlocks);
Blockly.common.defineBlocks(eventBlocks);
Blockly.common.defineBlocks(controlBlocks);
Blockly.common.defineBlocks(sensingBlocks);

// ── Inject Blockly Workspace ────────────────────────
const blocklyDiv = document.getElementById("blocklyDiv");

const ws = Blockly.inject(blocklyDiv, { 
  toolbox: scratchToolbox
});

addCustomToolbar();


// ── Stage Renderer + Interpreter ────────────────────
const stageContainer = document.getElementById("stageCanvas");
const renderer = new StageRenderer(stageContainer);
const interpreter = new BlockInterpreter(spriteStore, ws);
interpreter.setRenderer(renderer);

(async () => {
  await renderer.init();

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

// ── Mode Switcher ───────────────────────────────────
initModeSwitcher(
  // onModeChange callback
  (newMode) => {
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

      // Auto-update the code panel once on entering board mode
      setTimeout(() => {
        regenerateCode();
        const toolbox = ws.getToolbox();
        if (toolbox) {
          const items = toolbox.getToolboxItems();
          const espItem = items.find(i => i.getName && i.getName() === 'ESP32');
          if (espItem) {
            toolbox.setSelectedItem(espItem);
          }
        }
      }, 100);
    }
  },
  // onViewChange callback (Stage / Code toggle from header pills)
  (view) => {
    console.log("View switched to:", view);
    setBoardView(view);
  }
);

initConnectButton();

// ══════════════════════════════════════════════════════
//  CODE EDITOR — Dual Language System
// ══════════════════════════════════════════════════════

let currentCodeLang = 'arduino'; // 'arduino' | 'micropython'

const codeTextarea = document.getElementById("codeContent");
const codeGutter = document.getElementById("codeGutter");
const codeLineCount = document.getElementById("codeLineCount");
const codeFileNameEl = document.getElementById("codeFileName");
const downloadBtnLabel = document.getElementById("downloadBtnLabel");

// Provide the code from textarea to the upload panel
initUploadPanel(() => codeTextarea?.value || '');

// ── Stage / Code View Toggle (driven by header pills) ──
const boardStageView = document.getElementById("boardStageView");
const boardCodeView = document.getElementById("boardCodeView");
const boardStageSlot = document.getElementById("boardStageSlot");
const scratchStageContainer = document.getElementById("stageContainer");

function setBoardView(view) {
  const scratchPane = document.getElementById("scratchPane");
  const boardPane = document.getElementById("boardPane");
  const scratchControls = document.getElementById('scratchControls');

  if (view === 'stage') {
    if (scratchPane) scratchPane.style.display = 'flex';
    if (boardPane) boardPane.style.display = 'none';
    if (scratchControls) scratchControls.style.display = 'flex';
  } else {
    if (scratchPane) scratchPane.style.display = 'none';
    if (boardPane) boardPane.style.display = 'flex';
    if (scratchControls) scratchControls.style.display = 'none';
    
    if (boardCodeView) boardCodeView.style.display = 'flex';
    if (boardStageView) boardStageView.style.display = 'none';
    
    regenerateCode();
  }
}

// ── Arduino / MicroPython Language Toggle ───────────
const envDropdown = document.getElementById("envDropdown");

function setCodeLanguage(lang) {
  currentCodeLang = lang;

  if (envDropdown && envDropdown.value !== lang) {
    envDropdown.value = lang;
  }

  if (lang === 'arduino') {
    if (codeFileNameEl) codeFileNameEl.textContent = 'sketch.ino';
    if (downloadBtnLabel) downloadBtnLabel.textContent = 'Download .ino';
  } else {
    if (codeFileNameEl) codeFileNameEl.textContent = 'main.py';
    if (downloadBtnLabel) downloadBtnLabel.textContent = 'Download .py';
  }

  regenerateCode();
}

envDropdown?.addEventListener('change', (e) => setCodeLanguage(e.target.value));

// ── Code Generation ─────────────────────────────────

function generateCurrentCode() {
  if (currentCodeLang === 'arduino') {
    return buildArduinoSketch(ws);
  } else {
    const raw = pythonGenerator.workspaceToCode(ws);
    return buildESP32Code(raw);
  }
}

function updateGutter(code) {
  const lines = (code || '').split('\n');

  if (codeGutter) {
    codeGutter.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
  }

  if (codeLineCount) {
    codeLineCount.textContent = `${lines.length} line${lines.length !== 1 ? 's' : ''}`;
  }
}

function updateCodeEditor(code) {
  if (codeTextarea) {
    codeTextarea.value = code || '';
  }
  updateGutter(code);
}

function regenerateCode() {
  if (getCurrentMode() === "scratch") return;
  const code = generateCurrentCode();
  updateCodeEditor(code);
}

// Sync gutter when user manually edits the textarea
codeTextarea?.addEventListener('input', () => {
  updateGutter(codeTextarea.value);
});

// Sync gutter scrolling with textarea scrolling
codeTextarea?.addEventListener('scroll', () => {
  if (codeGutter) {
    codeGutter.scrollTop = codeTextarea.scrollTop;
  }
});

// Handle Tab key inside textarea for indentation
codeTextarea?.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = codeTextarea.selectionStart;
    const end = codeTextarea.selectionEnd;
    codeTextarea.value = codeTextarea.value.substring(0, start) + '  ' + codeTextarea.value.substring(end);
    codeTextarea.selectionStart = codeTextarea.selectionEnd = start + 2;
    updateGutter(codeTextarea.value);
  }
});

// ── Workspace Change → Regenerate Code ──────────────
ws.addChangeListener((e) => {
  if (e.isUiEvent || e.type === Blockly.Events.FINISHED_LOADING || ws.isDragging()) return;
  regenerateCode();
});

// ── Download Button ─────────────────────────────────
const downloadCodeBtn = document.getElementById("downloadCodeBtn");
if (downloadCodeBtn) {
  downloadCodeBtn.addEventListener("click", () => {
    const code = codeTextarea?.value || generateCurrentCode();
    const ext = currentCodeLang === 'arduino' ? 'ino' : 'py';
    const filename = currentCodeLang === 'arduino' ? 'sketch.ino' : 'main.py';
    const blob = new Blob([code], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  });
}

// Initial icon render
refreshIcons();
