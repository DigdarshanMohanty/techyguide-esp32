// esp32 upload panel — status badge, upload button, and output log
import { uploadToESP32 } from "../upload/serialUpload";
import { refreshIcons } from "./icons";
import { connectSerialMonitor, pauseSerialMonitor, toggleMonitor as smToggle } from "./SerialMonitor";
import { compileArduinoSketch } from "../upload/compileService";
import { flashESP32, isEsptoolAvailable } from "../upload/espFlasher";
import { boardRegistry } from "../boards/BoardRegistry";
import { pinReservationManager } from "../boards/PinReservationManager";

const STATUS_LABELS = {
  idle: { text: "Ready", cls: "status-idle" },
  waiting_port: { text: "Select Port…", cls: "status-waiting" },
  connecting: { text: "Connecting…", cls: "status-waiting" },
  retry_1: { text: "Retrying (2/3)…", cls: "status-waiting" },
  retry_2: { text: "Retrying (3/3)…", cls: "status-waiting" },
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
let _getWorkspace = null;
let _isUploading = false;

import { showToast } from "./ModeSwitcher";

// ── Stage → step mapping ─────────────────────────────────────────────────────
const STAGE_META = {
  compiling:    { step: 0, icon: _iconSpinner('#4C97FF'), pct: 15 },
  compiled:     { step: 0, icon: _iconCheck('#59C059'),   pct: 25 },
  waiting_port: { step: 1, icon: _iconSpinner('#FFAB19'), pct: 28 },
  detecting:    { step: 1, icon: _iconSpinner('#FFAB19'), pct: 30 },
  connecting:   { step: 1, icon: _iconSpinner('#FFAB19'), pct: 32 },
  retry_1:      { step: 1, icon: _iconSpinner('#FFAB19'), pct: 33 },
  retry_2:      { step: 1, icon: _iconSpinner('#FFAB19'), pct: 34 },
  syncing:      { step: 1, icon: _iconSpinner('#FFAB19'), pct: 35 },
  erasing:      { step: 2, icon: _iconSpinner('#4C97FF'), pct: 40 },
  flashing:     { step: 2, icon: _iconFlash('#4C97FF'),   pct: null },
  resetting:    { step: 2, icon: _iconSpinner('#9966FF'), pct: 92 },
  success:      { step: 3, icon: _iconCheck('#4CBF56'),   pct: 100 },
  complete:     { step: 3, icon: _iconCheck('#4CBF56'),   pct: 100 },
  error:        { step: -1, icon: _iconError('#FC2F2F'),  pct: null },
};

function _iconSpinner(color) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5"
    stroke-linecap="round" style="animation:spin 1s linear infinite">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>`;
}
function _iconCheck(color) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`;
}
function _iconFlash(color) {
  return `<svg viewBox="0 0 24 24" fill="${color}" stroke="none">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/>
  </svg>`;
}
function _iconError(color) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round">
    <circle cx="12" cy="12" r="9"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`;
}

// ── Progress bar controller ──────────────────────────────────────────────────

function showProgress() {
  const wrap = document.getElementById('uploadProgressWrap');
  if (wrap) wrap.style.display = 'flex';
  _setProgress(0, false);
  [0, 1, 2, 3].forEach(i => {
    const step = document.getElementById(`uplStep${i}`);
    if (step) step.className = 'upl-step';
  });
  document.querySelectorAll('.upl-step-line').forEach(l => l.classList.remove('done'));
  const shimmer = document.getElementById('uplShimmer');
  if (shimmer) shimmer.classList.remove('hidden');
}

function hideProgress() {
  setTimeout(() => {
    const wrap = document.getElementById('uploadProgressWrap');
    if (wrap) wrap.style.display = 'none';
  }, 3000);
}

function updateProgress(statusKey, percent = null) {
  const meta = STAGE_META[statusKey];
  if (!meta) return;

  const pct = percent !== null ? percent : (meta.pct ?? null);

  if (pct !== null) {
    _setProgress(pct, statusKey === 'error');
  }

  const iconEl  = document.getElementById('uplStageIcon');
  const labelEl = document.getElementById('uplStageLabel');
  const pctEl   = document.getElementById('uplPctLabel');

  if (iconEl && meta.icon) iconEl.innerHTML = meta.icon;
  if (labelEl) labelEl.textContent = STATUS_LABELS[statusKey]?.text ?? statusKey;
  if (pctEl && pct !== null) pctEl.textContent = `${Math.round(pct)}%`;

  const activeStep = meta.step;
  [0, 1, 2, 3].forEach(i => {
    const step = document.getElementById(`uplStep${i}`);
    const lines = document.querySelectorAll('.upl-step-line');
    const line  = lines[i];

    if (!step) return;

    if (statusKey === 'error' && i === activeStep) {
      step.className = 'upl-step error';
    } else if (i < activeStep) {
      step.className = 'upl-step done';
      if (line) line.classList.add('done');
    } else if (i === activeStep) {
      step.className = (statusKey === 'success' || statusKey === 'complete')
        ? 'upl-step done'
        : 'upl-step active';
    } else {
      step.className = 'upl-step';
    }
  });
}

function _setProgress(pct, isError = false) {
  const bar     = document.getElementById('uplBar');
  const shimmer = document.getElementById('uplShimmer');
  const pctEl   = document.getElementById('uplPctLabel');

  if (!bar) return;

  const clamped = Math.max(0, Math.min(100, pct));
  bar.style.width = `${clamped}%`;
  if (pctEl) pctEl.textContent = `${Math.round(clamped)}%`;

  bar.classList.toggle('error',   isError);
  bar.classList.toggle('success', clamped === 100 && !isError);

  if (shimmer) shimmer.classList.toggle('hidden', clamped === 100 || isError);
}

/**
 * @param {Function} getCode      — returns current code string from editor
 * @param {Function} getLanguage  — returns 'arduino' | 'micropython'
 * @param {Function} getWorkspace — returns the active Blockly workspace
 */
export function initUploadPanel(getCode, getLanguage, getWorkspace) {
  _getCode = getCode;
  _getLanguage = getLanguage || (() => 'micropython');
  _getWorkspace = getWorkspace || (() => null);

  const uploadBtn = document.getElementById("uploadBtn");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", handleUpload);
    _maybeShowBootTip();
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

  // ── Pin conflict gate (Arduino mode only) ──────────────────────────────────
  if (lang === 'arduino') {
    const workspace = _getWorkspace?.();
    if (workspace) {
      pinReservationManager.scanWorkspace(workspace);
      const conflicts = pinReservationManager.getConflicts();
      if (conflicts.length > 0) {
        const msgs = conflicts.map(c => `• ${c.message}`).join('\n');
        // Hard conflicts (reserved/input-only violations) always block upload;
        // direction conflicts (IN+OUT same pin) are a warning — ask the user.
        const isHard = conflicts.some(c =>
          c.message.includes('reserved') || c.message.includes('input-only')
        );
        if (isHard) {
          showToast(`Upload blocked — fix pin conflicts first:\n${msgs}`);
          _isUploading = false;
          setButtonState(false);
          return;
        }
        const proceed = window.confirm(
          `Pin conflicts detected:\n${msgs}\n\nUpload anyway?`
        );
        if (!proceed) {
          _isUploading = false;
          setButtonState(false);
          return;
        }
      }
    }
  }

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
  showProgress();

  // Check if esptool-js is available for in-browser flashing
  const canFlash = await isEsptoolAvailable();

  if (!canFlash) {
    // Fallback: download .ino file
    _downloadFile(code, 'sketch.ino', 'text/x-arduino');
    showToast("Arduino sketch downloaded! Open in Arduino IDE to compile & upload.\n(Install esptool-js for in-browser flashing)");
    hideProgress();
    _isUploading = false;
    setButtonState(false);
    return;
  }

  // Pause serial monitor BEFORE requesting the port so its reader lock is
  // released. Without this, esptool can't acquire a reader and sync fails
  // even though the bootloader reset works correctly.
  const resumeMonitor = await pauseSerialMonitor();

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
        hideProgress();
        _isUploading = false;
        setButtonState(false);
        await resumeMonitor();
        return;
      }
      throw portErr;
    }

    // Step 2: Open the port so espFlasher can flush it and control signals
    if (!port.readable) {
      await port.open({ baudRate: 115200 });
      await new Promise(r => setTimeout(r, 100));
    }

    // Step 3: Compile the sketch
    const board = boardRegistry.getBoard();
    const fqbn = board.fqbn;

    const { binary, stdout, stderr } = await compileArduinoSketch(
      code, fqbn, (status) => setStatus(status)
    );

    if (stderr) {
      console.warn('[compile] Warnings:', stderr);
    }
    console.log('[compile] Output:', stdout);

    // Step 4: Flash the binary (espFlasher manages the transport internally)
    await flashESP32(binary, port, board, (status, percent) => {
      setStatus(status);
      if (percent !== undefined) updateProgress(status, percent);
    });

    setStatus("resetting");

    // Wait for ESP32-D0WD to finish booting before reconnecting serial.
    // The chip takes ~1200-1500ms to boot into user code after reset.
    await new Promise(r => setTimeout(r, 2500));

    setStatus("success");
    hideProgress();
    showToast("Arduino firmware uploaded successfully!");

    // Step 5: Resume serial monitor — open panel first, then connect
    const smBody = document.getElementById('smBody');
    if (smBody && smBody.style.display === 'none') {
      smToggle();
    }
    await resumeMonitor();

  } catch (err) {
    setStatus("error");
    hideProgress();
    showUploadError(err.message);
    console.error('[arduino-upload]', err);
    await resumeMonitor();
  } finally {
    // Port is closed inside espFlasher's finally block after writeFlash.
    // Attempt close here only as a safety net for pre-flash failures.
    if (port) {
      try { await port.close(); } catch { /* already closed by espFlasher */ }
    }
    _isUploading = false;
    setButtonState(false);
  }
}

/**
 * Show a multi-line error message in a dedicated panel below the upload button.
 * Falls back to showToast for short messages. The error panel supports \n via
 * white-space: pre-line so BOOT button instructions render as separate lines.
 */
function showUploadError(message) {
  // Remove any existing error panel first
  document.getElementById('uploadErrorPanel')?.remove();

  // Short single-line messages go to the toast — long ones get the panel
  if (!message.includes('\n')) {
    showToast('Upload error: ' + message);
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'uploadErrorPanel';
  panel.className = 'upload-error-panel';
  panel.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'upload-error-close';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', () => panel.remove());
  panel.appendChild(closeBtn);

  // Insert after upload button or at end of board pane
  const uploadBtn = document.getElementById('uploadBtn');
  const parent = uploadBtn?.parentElement ?? document.getElementById('boardCodeView') ?? document.body;
  parent.appendChild(panel);
}

/**
 * Show the BOOT button tip once (tracked in localStorage).
 */
function _maybeShowBootTip() {
  if (localStorage.getItem('tg_boot_tip_shown')) return;

  const uploadBtn = document.getElementById('uploadBtn');
  if (!uploadBtn) return;

  const tip = document.createElement('div');
  tip.className = 'upload-tip';
  tip.innerHTML = `
    <span>💡 Tip: If upload fails, hold the <strong>BOOT</strong> button on your ESP32 while clicking Upload, then release after 2 seconds.</span>
    <button id="bootTipDismiss">Got it</button>
  `;
  uploadBtn.parentElement?.appendChild(tip);

  document.getElementById('bootTipDismiss')?.addEventListener('click', () => {
    localStorage.setItem('tg_boot_tip_shown', '1');
    tip.remove();
  });
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
  updateProgress(key);
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
