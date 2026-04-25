// esp32 upload panel — status badge, upload button, and output log
import { uploadToESP32 } from "../upload/serialUpload";
import { refreshIcons } from "./icons";

const STATUS_LABELS = {
  idle: { text: "Ready", cls: "status-idle" },
  waiting_port: { text: "Select Port…", cls: "status-waiting" },
  connecting: { text: "Connecting…", cls: "status-waiting" },
  interrupting: { text: "Interrupting…", cls: "status-waiting" },
  entering_repl: { text: "Entering REPL…", cls: "status-waiting" },
  uploading: { text: "Uploading…", cls: "status-uploading" },
  reading_output: { text: "Reading output…", cls: "status-uploading" },
  success: { text: "Done!", cls: "status-success" },
  error: { text: "Error", cls: "status-error" },
};

let _getCode = null; 
let _isUploading = false;

import { showToast } from "./ModeSwitcher";

export function initUploadPanel(getCode) {
  _getCode = getCode;

  const uploadBtn = document.getElementById("uploadBtn");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", handleUpload);
  }
  
  const headerUploadBtn = document.getElementById("headerUploadBtn");
  if (headerUploadBtn) {
    headerUploadBtn.addEventListener("click", handleUpload);
  }
}

async function handleUpload() {
  if (_isUploading) return;

  const code = _getCode();
  if (!code || code.trim() === "") {
    setLog("No code in workspace. Add some blocks first.", "log-warn");
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

function setStatus(key) {
  const el = document.getElementById("uploadStatus");
  if (!el) return;
  const { text, cls } = STATUS_LABELS[key] || STATUS_LABELS.idle;
  el.textContent = text;
  el.style.display = key === 'idle' ? 'none' : 'inline';
}

function setLog(text, cls) {
  if (text && cls.includes('error')) {
    showToast(text);
  } else if (text && cls.includes('success')) {
    showToast("Upload Successful!");
  } else if (text && cls.includes('warn')) {
    showToast(text);
  }
}

function setButtonState(uploading) {
  const btn = document.getElementById("uploadBtn");
  if (btn) {
    btn.disabled = uploading;
    const label = btn.querySelector('#uploadBtnLabel');
    if (label) {
      label.textContent = uploading ? "Uploading…" : "Upload Code";
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
