/**
 * arduinoUploadPanel.js
 * Renders the Arduino upload panel: port selector, upload button,
 * status badge, and output log.
 * Injects HTML into #arduinoUploadPanel (defined in index.html).
 */

import {
  fetchArduinoPorts,
  uploadArduinoCode,
} from "../upload/arduinoUpload";

// Status label map
const STATUS_LABELS = {
  idle: { text: "Ready", cls: "status-idle" },
  loading_ports: { text: "Loading ports…", cls: "status-waiting" },
  compiling: { text: "Compiling…", cls: "status-uploading" },
  uploading: { text: "Uploading…", cls: "status-uploading" },
  success: { text: "✓ Done!", cls: "status-success" },
  error: { text: "✗ Error", cls: "status-error" },
  server_down: { text: "Server offline", cls: "status-error" },
};

let _getCode = null;
let _isUploading = false;

/**
 * Mount the Arduino upload panel into #arduinoUploadPanel.
 * @param {function} getCode - returns the current Arduino C++ sketch string
 */
export function initArduinoUploadPanel(getCode) {
  _getCode = getCode;

  const container = document.getElementById("arduinoUploadPanel");
  if (!container) return;

  container.innerHTML = `
    <div class="upload-panel arduino-upload-panel">
      <div class="upload-header">
        <span class="upload-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="3" ry="3"></rect>
            <line x1="9" y1="2" x2="9" y2="22"></line>
            <line x1="15" y1="2" x2="15" y2="22"></line>
            <line x1="2" y1="9" x2="22" y2="9"></line>
            <line x1="2" y1="15" x2="22" y2="15"></line>
          </svg>
          Upload to Arduino
        </span>
        <span id="arduinoUploadStatus" class="upload-status status-idle">Ready</span>
      </div>

      <div class="port-selector-row">
        <select id="arduinoPortSelect" class="port-select">
          <option value="">Select port…</option>
        </select>
        <button id="refreshPortsBtn" class="refresh-ports-btn" title="Refresh ports">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      </div>

      <button id="arduinoUploadBtn" class="upload-btn arduino-upload-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
        Upload Firmware
      </button>

      <div id="arduinoUploadLog" class="upload-log">
        <span class="log-placeholder">Output will appear here after upload…</span>
      </div>

      <div class="upload-hint">
        ⚡ Run <code>npm run server</code> first &nbsp;·&nbsp; Connect Arduino via USB
      </div>
    </div>
  `;

  // Bind events
  document
    .getElementById("arduinoUploadBtn")
    .addEventListener("click", handleArduinoUpload);
  document
    .getElementById("refreshPortsBtn")
    .addEventListener("click", loadPorts);

  // Auto-load ports on init
  loadPorts();
}

/** Fetch and populate port dropdown */
async function loadPorts() {
  const select = document.getElementById("arduinoPortSelect");
  if (!select) return;

  setArduinoStatus("loading_ports");
  select.innerHTML = `<option value="">Loading…</option>`;

  try {
    const ports = await fetchArduinoPorts();

    select.innerHTML = `<option value="">Select port…</option>`;

    if (ports.length === 0) {
      select.innerHTML = `<option value="">No ports found</option>`;
      setArduinoStatus("idle");
      return;
    }

    for (const p of ports) {
      const opt = document.createElement("option");
      opt.value = p.address;
      opt.textContent = `${p.address} — ${p.boardName}`;
      if (p.fqbn) opt.dataset.fqbn = p.fqbn;
      select.appendChild(opt);
    }

    // Auto-select if only one port
    if (ports.length === 1) {
      select.value = ports[0].address;
    }

    setArduinoStatus("idle");
  } catch (err) {
    console.error("Failed to load ports:", err);
    select.innerHTML = `<option value="">Server offline</option>`;
    setArduinoStatus("server_down");
    setArduinoLog(
      "⚠ Cannot reach upload server.\nStart it with: npm run server",
      "log-warn"
    );
  }
}

/** Handle upload button click */
async function handleArduinoUpload() {
  if (_isUploading) return;

  const code = _getCode();
  if (!code || code.trim() === "") {
    setArduinoLog(
      "⚠ No code in workspace. Add some blocks first.",
      "log-warn"
    );
    return;
  }

  const select = document.getElementById("arduinoPortSelect");
  const port = select ? select.value : "";
  if (!port) {
    setArduinoLog("⚠ Please select a port first.", "log-warn");
    return;
  }

  // Get FQBN from selected option if available
  const selectedOption = select.options[select.selectedIndex];
  const fqbn = selectedOption.dataset.fqbn || "arduino:avr:uno";

  _isUploading = true;
  setArduinoButtonState(true);
  setArduinoLog("", "");
  setArduinoStatus("compiling");

  try {
    const result = await uploadArduinoCode(code, port, fqbn);

    if (result.success) {
      setArduinoStatus("success");
      setArduinoLog(result.output || "Upload complete.", "log-success");
    } else {
      setArduinoStatus("error");
      setArduinoLog("Error:\n" + (result.error || result.output), "log-error");
    }
  } catch (err) {
    setArduinoStatus("error");
    setArduinoLog("Error: " + err.message, "log-error");
  } finally {
    _isUploading = false;
    setArduinoButtonState(false);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setArduinoStatus(key) {
  const el = document.getElementById("arduinoUploadStatus");
  if (!el) return;
  const { text, cls } = STATUS_LABELS[key] || STATUS_LABELS.idle;
  el.textContent = text;
  el.className = "upload-status " + cls;
}

function setArduinoLog(text, cls) {
  const el = document.getElementById("arduinoUploadLog");
  if (!el) return;
  if (!text) {
    el.innerHTML = `<span class="log-placeholder">Output will appear here after upload…</span>`;
    return;
  }
  el.innerHTML = `<pre class="${cls}">${escapeHtml(text)}</pre>`;
}

function setArduinoButtonState(uploading) {
  const btn = document.getElementById("arduinoUploadBtn");
  if (!btn) return;
  btn.disabled = uploading;
  btn.classList.toggle("uploading", uploading);
  btn.innerHTML = uploading
    ? `<span class="spinner"></span> Uploading…`
    : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
       </svg> Upload Firmware`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
