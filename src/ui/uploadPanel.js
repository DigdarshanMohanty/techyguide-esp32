// esp32 upload panel — status badge, upload button, and output log
import { uploadToESP32 } from "../upload/serialUpload";
import { refreshIcons } from "./icons";
import { connectSerialMonitor, toggleMonitor as smToggle } from "./SerialMonitor";
import { compileArduinoSketch } from "../upload/compileService";
import { flashESP32, isEsptoolAvailable } from "../upload/espFlasher";
import { boardRegistry } from "../boards/BoardRegistry";

const STATUS_LABELS = {
  idle: { text: "Ready", cls: "status-idle" },
  waiting_port: { text: "Select Port…", cls: "status-waiting" },
  connecting: { text: "Connecting…", cls: "status-waiting" },
  interrupting: { text: "Interrupting…", cls: "status-waiting" },
  entering_repl: { text: "Entering REPL…", cls: "status-waiting" },
  uploading: { text: "Uploading…", cls: "status-uploading" },
  reading_output: { text: "Reading output…", cls: "status-uploading" },
  compiling: { text: "Compiling…", cls: "status-waiting" },
  compiled: { text: "Compiled!", cls: "status-success" },
  syncing: { text: "Syncing…", cls: "status-waiting" },
  detecting: { text: "Detecting chip…", cls: "status-waiting" },
  erasing: { text: "Erasing…", cls: "status-uploading" },
  flashing: { text: "Flashing…", cls: "status-uploading" },
  resetting: { text: "Resetting…", cls: "status-waiting" },
  complete: { text: "Flash complete!", cls: "status-success" },
  success: { text: "Done!", cls: "status-success" },
  error: { text: "Error", cls: "status-error" },
};

let _getCode = null;
let _getLanguage = null;
let _isUploading = false;

import { showToast } from "./ModeSwitcher";

/**
 * @param {Function} getCode     — returns current code string from editor
 * @param {Function} getLanguage — returns 'arduino' | 'micropython'
 */
export function initUploadPanel(getCode, getLanguage) {
  _getCode = getCode;
  _getLanguage = getLanguage || (() => 'micropython');

  const uploadBtn = document.getElementById("uploadBtn");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", handleUpload);
  }

  const headerUploadBtn = document.getElementById("headerUploadBtn");
  if (headerUploadBtn) {
    headerUploadBtn.addEventListener("click", handleUpload);
  }
}

/**
 * Update the upload button label and behavior based on selected language.
 */
export function updateUploadButtonForLanguage(lang) {
  const uploadBtnLabel = document.getElementById("uploadBtnLabel");
  if (uploadBtnLabel) {
    uploadBtnLabel.textContent = lang === 'arduino' ? 'Upload (Arduino)' : 'Upload Code';
  }
}

async function handleUpload() {
  if (_isUploading) return;
  _isUploading = true;
  setButtonState(true);

  const code = _getCode();
  if (!code || code.trim() === "") {
    showToast("No code in workspace. Add some blocks first.");
    _isUploading = false;
    setButtonState(false);
    return;
  }

  const lang = _getLanguage ? _getLanguage() : 'micropython';

  if (lang === 'arduino') {
    await handleArduinoUpload(code);
    return;
  }

  // ── MicroPython: upload via Web Serial Raw REPL ──

  try {
    const result = await uploadToESP32(code, (status) => {
      setStatus(status);
    });

    if (result.success) {
      setStatus("success");
      showToast("Upload Successful! Serial monitor reconnected.");

      // Serial monitor is auto-resumed by serialUpload.js after upload.
      // Just make sure the panel is visible.
      const smBody = document.getElementById('smBody');
      if (smBody && smBody.style.display === 'none') {
        smToggle();
      }
    } else {
      setStatus("error");
      showToast("ESP32 Error: " + result.output);
    }
  } catch (err) {
    setStatus("error");
    if (err.name === "NotFoundError") {
      showToast("No port selected. Upload cancelled.");
      setStatus("idle");
    } else {
      showToast("Error: " + err.message);
    }
  } finally {
    _isUploading = false;
    setButtonState(false);
  }
}

/**
 * Arduino upload flow: compile → flash → serial monitor.
 * Falls back to .ino download if esptool-js is not available.
 */
async function handleArduinoUpload(code) {
  // Check if esptool-js is available for in-browser flashing
  const canFlash = await isEsptoolAvailable();

  if (!canFlash) {
    // Fallback: download .ino file
    _downloadFile(code, 'sketch.ino', 'text/x-arduino');
    showToast("Arduino sketch downloaded! Open in Arduino IDE to compile & upload.\n(Install esptool-js for in-browser flashing)");
    _isUploading = false;
    setButtonState(false);
    return;
  }

  let port = null;
  try {
    // Step 1: Request serial port before compiling
    setStatus("waiting_port");
    try {
      port = await navigator.serial.requestPort();
    } catch (portErr) {
      if (portErr.name === "NotFoundError") {
        showToast("No port selected. Upload cancelled.");
        setStatus("idle");
        _isUploading = false;
        setButtonState(false);
        return;
      }
      throw portErr;
    }

    // Step 2: Compile the sketch
    const board = boardRegistry.getBoard();
    const fqbn = board.fqbn;

    const { binary, stdout, stderr } = await compileArduinoSketch(
      code, fqbn, (status) => setStatus(status)
    );

    if (stderr) {
      console.warn('[compile] Warnings:', stderr);
    }
    console.log('[compile] Output:', stdout);

    // Step 3: Flash the binary (espFlasher manages the transport internally)
    await flashESP32(binary, port, board, (status, percent) => {
      setStatus(status);
    });

    setStatus("resetting");

    // Wait for ESP32-D0WD to finish booting before reconnecting serial.
    // The chip takes ~1200-1500ms to boot into user code after reset.
    await new Promise(r => setTimeout(r, 1500));

    setStatus("success");
    showToast("Arduino firmware uploaded successfully!");

    // Step 4: Resume serial monitor — open panel first, then connect
    const smBody = document.getElementById('smBody');
    if (smBody && smBody.style.display === 'none') {
      smToggle();
    }
    await connectSerialMonitor();

  } catch (err) {
    setStatus("error");
    showToast("Arduino upload error: " + err.message);
    console.error('[arduino-upload]', err);
  } finally {
    // Always close the port if it was opened but not consumed by espFlasher
    if (port) {
      try { await port.close(); } catch { /* already closed by espFlasher */ }
    }
    _isUploading = false;
    setButtonState(false);
  }
}

function _downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType || "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function setStatus(key) {
  const el = document.getElementById("uploadStatus");
  if (!el) return;
  const { text, cls } = STATUS_LABELS[key] || STATUS_LABELS.idle;
  el.textContent = text;
  el.style.display = key === 'idle' ? 'none' : 'inline';
}

function setButtonState(uploading) {
  const btn = document.getElementById("uploadBtn");
  if (btn) {
    btn.disabled = uploading;
    const label = btn.querySelector('#uploadBtnLabel');
    if (label) {
      label.textContent = uploading ? "Uploading…" : (_getLanguage?.() === 'arduino' ? 'Upload (Arduino)' : 'Upload Code');
    }
  }

  const headerBtn = document.getElementById("headerUploadBtn");
  if (headerBtn) {
    headerBtn.disabled = uploading;
    headerBtn.innerHTML = uploading
      ? `<i data-lucide="loader" class="spin-icon" style="width:14px;height:14px;"></i> Uploading…`
      : `<i data-lucide="upload" style="width:14px;height:14px;"></i> Upload`;
    refreshIcons();
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
