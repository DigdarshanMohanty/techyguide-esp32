/**
 * uploadPanel.js
 * Renders the "Upload to ESP32" button, status badge, and output log.
 * Injects HTML into #uploadPanel (defined in index.html).
 */

import { uploadToESP32 } from "../upload/serialUpload";

// Status label map
const STATUS_LABELS = {
  idle: { text: "Ready", cls: "status-idle" },
  waiting_port: { text: "Select Port…", cls: "status-waiting" },
  connecting: { text: "Connecting…", cls: "status-waiting" },
  interrupting: { text: "Interrupting…", cls: "status-waiting" },
  entering_repl: { text: "Entering REPL…", cls: "status-waiting" },
  uploading: { text: "Uploading…", cls: "status-uploading" },
  reading_output: { text: "Reading output…", cls: "status-uploading" },
  success: { text: "✓ Done!", cls: "status-success" },
  error: { text: "✗ Error", cls: "status-error" },
};

let _getCode = null; // injected by init()
let _getBoard = null; // injected by init()
let _isUploading = false;

/**
 * Mount the upload panel into #uploadPanel.
 * @param {function} getCode  - function that returns current workspace code string
 * @param {function} getBoard - function that returns selected board ("esp32" | "arduino")
 */
export function initUploadPanel(getCode, getBoard) {
  _getCode = getCode;
  _getBoard = getBoard;

  const container = document.getElementById("uploadPanel");
  if (!container) return;

  container.innerHTML = `
    <div class="upload-panel">
      <div class="upload-header">
        <span class="upload-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 16 12 12 8 16"></polyline>
            <line x1="12" y1="12" x2="12" y2="21"></line>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
          </svg>
          Upload to ESP32
        </span>
        <span id="uploadStatus" class="upload-status status-idle">Ready</span>
      </div>

      <button id="uploadBtn" class="upload-btn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
        Upload Code
      </button>

      <div id="uploadLog" class="upload-log">
        <span class="log-placeholder">Output will appear here after upload…</span>
      </div>

      <div class="upload-hint">
        ⚠ Requires Chrome or Edge &nbsp;·&nbsp; Connect ESP32 via USB
      </div>
    </div>
  `;

  document.getElementById("uploadBtn").addEventListener("click", handleUpload);
}

async function handleUpload() {
  if (_isUploading) return;

  const code = _getCode();
  if (!code || code.trim() === "") {
    setLog("⚠ No code in workspace. Add some blocks first.", "log-warn");
    return;
  }

  _isUploading = true;
  setButtonState(true);
  setLog("", "");

  try {
    const result = await uploadToESP32(code, (status) => {
      setStatus(status);
    });

    if (result.success) {
      setStatus("success");
      setLog(result.output || "Upload complete.", "log-success");
    } else {
      setStatus("error");
      setLog("ESP32 Error:\n" + result.output, "log-error");
    }
  } catch (err) {
    setStatus("error");
    if (err.name === "NotFoundError") {
      // User cancelled port picker
      setLog("No port selected. Upload cancelled.", "log-warn");
      setStatus("idle");
    } else {
      setLog("Error: " + err.message, "log-error");
    }
  } finally {
    _isUploading = false;
    setButtonState(false);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setStatus(key) {
  const el = document.getElementById("uploadStatus");
  if (!el) return;
  const { text, cls } = STATUS_LABELS[key] || STATUS_LABELS.idle;
  el.textContent = text;
  el.className = "upload-status " + cls;
}

function setLog(text, cls) {
  const el = document.getElementById("uploadLog");
  if (!el) return;
  if (!text) {
    el.innerHTML = `<span class="log-placeholder">Output will appear here after upload…</span>`;
    return;
  }
  el.innerHTML = `<pre class="${cls}">${escapeHtml(text)}</pre>`;
}

function setButtonState(uploading) {
  const btn = document.getElementById("uploadBtn");
  if (!btn) return;
  btn.disabled = uploading;
  btn.classList.toggle("uploading", uploading);
  btn.innerHTML = uploading
    ? `<span class="spinner"></span> Uploading…`
    : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
       </svg> Upload Code`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
