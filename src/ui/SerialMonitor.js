// Serial Monitor — reads/writes to ESP32 over Web Serial
// Uses the active port from ConnectModal when connected,
// or prompts for a port via the browser picker.
import { getActivePort, getConnectionState } from './ConnectModal';
import { refreshIcons } from './icons';

let _monitorOpen = false;
let _reader = null;
let _writer = null;
let _readLoopActive = false;
let _outputEl = null;
let _inputEl = null;
let _baudRate = 115200;
let _autoScroll = true;
let _monitorPort = null;
let _lineEnding = '\n';

const dec = new TextDecoder();
const enc = new TextEncoder();

/**
 * Initialize the serial monitor.
 * Creates the DOM elements inside #serialMonitorContainer.
 */
export function initSerialMonitor() {
  const container = document.getElementById('serialMonitorContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="sm-toolbar" id="smToolbar">
      <div class="sm-toolbar-left">
        <button class="sm-btn sm-toggle-btn" id="smToggleBtn" title="Toggle Serial Monitor">
          <i data-lucide="terminal" style="width:14px;height:14px;"></i>
          <span>Serial Monitor</span>
          <i data-lucide="chevron-up" class="sm-chevron" style="width:12px;height:12px;"></i>
        </button>
      </div>
      <div class="sm-toolbar-right" id="smToolbarControls" style="display:none;">
        <select class="sm-baud-select" id="smBaudRate" title="Baud Rate">
          <option value="9600">9600</option>
          <option value="19200">19200</option>
          <option value="38400">38400</option>
          <option value="57600">57600</option>
          <option value="115200" selected>115200</option>
          <option value="230400">230400</option>
          <option value="460800">460800</option>
          <option value="921600">921600</option>
        </select>
        <select class="sm-ending-select" id="smLineEnding" title="Line Ending">
          <option value="\\n">Newline (\\n)</option>
          <option value="\\r\\n">CR+LF (\\r\\n)</option>
          <option value="\\r">Carriage Return (\\r)</option>
          <option value="">No line ending</option>
        </select>
        <label class="sm-autoscroll-label" title="Auto-scroll output">
          <input type="checkbox" id="smAutoScroll" checked>
          <span>Auto-scroll</span>
        </label>
        <button class="sm-btn sm-icon-btn" id="smClearBtn" title="Clear output">
          <i data-lucide="trash-2" style="width:13px;height:13px;"></i>
        </button>
        <button class="sm-btn sm-icon-btn sm-stop-btn" id="smStopBtn"
                title="Stop reading" style="display:none">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#FC2F2F">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
          </svg>
        </button>
        <div class="sm-reading-indicator" id="smReadingIndicator" title="Reading">
          <span class="sm-dot"></span>
        </div>
        <button class="sm-btn sm-connect-btn" id="smConnectBtn" title="Connect / Disconnect">
          <i data-lucide="plug" style="width:13px;height:13px;"></i>
          <span id="smConnectLabel">Connect</span>
        </button>
      </div>
    </div>

    <div class="sm-body" id="smBody" style="display:none;">
      <div class="sm-output" id="smOutput"></div>
      <div class="sm-input-bar">
        <input type="text" class="sm-input" id="smInput" placeholder="Send message to ESP32…" disabled>
        <button class="sm-btn sm-send-btn" id="smSendBtn" disabled title="Send">
          <i data-lucide="send" style="width:14px;height:14px;"></i>
        </button>
      </div>
    </div>
  `;

  // Cache DOM references
  _outputEl = document.getElementById('smOutput');
  _inputEl = document.getElementById('smInput');

  // ── Event Listeners ──
  document.getElementById('smToggleBtn')?.addEventListener('click', toggleMonitor);
  document.getElementById('smClearBtn')?.addEventListener('click', clearOutput);
  document.getElementById('smConnectBtn')?.addEventListener('click', handleConnect);
  document.getElementById('smSendBtn')?.addEventListener('click', sendInput);
  document.getElementById('smStopBtn')?.addEventListener('click', async () => {
    await _stopReading();
    _updateConnectUI(false);
  });

  document.getElementById('smBaudRate')?.addEventListener('change', (e) => {
    _baudRate = parseInt(e.target.value);
  });

  document.getElementById('smLineEnding')?.addEventListener('change', (e) => {
    // The value comes escaped from HTML, unescape it
    _lineEnding = e.target.value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
  });

  document.getElementById('smAutoScroll')?.addEventListener('change', (e) => {
    _autoScroll = e.target.checked;
  });

  _inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendInput();
    }
  });

  refreshIcons();
}

/**
 * Toggle the serial monitor panel open/closed.
 */
export function toggleMonitor() {
  _monitorOpen = !_monitorOpen;

  const body = document.getElementById('smBody');
  const controls = document.getElementById('smToolbarControls');
  const chevron = document.querySelector('.sm-chevron');

  if (body) body.style.display = _monitorOpen ? 'flex' : 'none';
  if (controls) controls.style.display = _monitorOpen ? 'flex' : 'none';
  if (chevron) chevron.style.transform = _monitorOpen ? 'rotate(180deg)' : 'rotate(0deg)';
}

/**
 * Handle connect / disconnect button click.
 */
async function handleConnect() {
  if (_readLoopActive) {
    await _stopReading();
    _updateConnectUI(false);
    return;
  }

  try {
    let port = getActivePort();
    if (port && getConnectionState() === 'connected') {
      // Reuse ConnectModal port
    } else {
      if (!('serial' in navigator)) {
        appendOutput('[Error] Web Serial not supported. Use Chrome or Edge.\n', 'sm-error');
        return;
      }
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: _baudRate });
    }

    // If the readable stream was canceled (e.g. after an upload), reopen
    if (!port.readable) {
      try { await port.close(); } catch (_) {}
      await new Promise(r => setTimeout(r, 300));
      await port.open({ baudRate: _baudRate });
      await new Promise(r => setTimeout(r, 200));
    }

    _monitorPort = port;
    _startReading();
    _updateConnectUI(true);
    appendOutput('[Connected] Listening for output…\n', 'sm-system');
  } catch (err) {
    if (err.name === 'NotFoundError') return;
    appendOutput(`[Error] ${err.message}\n`, 'sm-error');
  }
}

/**
 * Release any active reader safely.
 */
async function _releaseReader() {
  if (_reader) {
    try { await _reader.cancel(); } catch (_) {}
    try { _reader.releaseLock(); } catch (_) {}
    _reader = null;
  }
}

/**
 * Release any active writer safely.
 */
async function _releaseWriter() {
  if (_writer) {
    try { _writer.releaseLock(); } catch (_) {}
    _writer = null;
  }
}

/**
 * Start the background read loop.
 */
function _startReading() {
  if (_readLoopActive || !_monitorPort) return;
  _readLoopActive = true;

  _inputEl?.removeAttribute('disabled');
  document.getElementById('smSendBtn')?.removeAttribute('disabled');

  (async () => {
    try {
      while (_readLoopActive && _monitorPort?.readable) {
        // Release any stale reader before getting a new one
        await _releaseReader();
        _reader = _monitorPort.readable.getReader();
        try {
          while (true) {
            const { value, done } = await _reader.read();
            if (done) break;
            if (value) appendOutput(dec.decode(value));
          }
        } catch (readErr) {
          // Read was canceled (e.g. by upload pausing us) — this is expected
          if (_readLoopActive) {
            console.warn('[SerialMonitor] Read error:', readErr.message);
          }
        } finally {
          try { _reader.releaseLock(); } catch (_) {}
          _reader = null;
        }
      }
    } catch (err) {
      if (_readLoopActive) {
        appendOutput(`\n[Disconnected] ${err.message}\n`, 'sm-error');
      }
    }
    _readLoopActive = false;
    _updateConnectUI(false);
    if (_inputEl) _inputEl.disabled = true;
    const sendBtn = document.getElementById('smSendBtn');
    if (sendBtn) sendBtn.disabled = true;
  })();
}

/**
 * Stop the background read loop and release all locks.
 */
async function _stopReading() {
  _readLoopActive = false;

  await _releaseReader();
  await _releaseWriter();

  appendOutput('\n[Disconnected]\n', 'sm-system');
}

/**
 * Send text from the input field to the serial port.
 */
async function sendInput() {
  if (!_monitorPort?.writable || !_inputEl) return;

  const text = _inputEl.value;
  if (text === '') return;

  try {
    _writer = _monitorPort.writable.getWriter();
    await _writer.write(enc.encode(text + _lineEnding));
    _writer.releaseLock();
    _writer = null;

    // Echo sent text in the output
    appendOutput(`> ${text}\n`, 'sm-sent');
    _inputEl.value = '';
  } catch (err) {
    appendOutput(`[Send Error] ${err.message}\n`, 'sm-error');
    if (_writer) {
      try { _writer.releaseLock(); } catch (_) {}
      _writer = null;
    }
  }
}

/**
 * Append text to the serial output area.
 */
function appendOutput(text, className) {
  if (!_outputEl) return;

  const span = document.createElement('span');
  if (className) span.className = className;
  span.textContent = text;
  _outputEl.appendChild(span);

  // Cap output to prevent memory issues
  while (_outputEl.childNodes.length > 5000) {
    _outputEl.removeChild(_outputEl.firstChild);
  }

  if (_autoScroll) {
    _outputEl.scrollTop = _outputEl.scrollHeight;
  }
}

/**
 * Clear serial output.
 */
function clearOutput() {
  if (_outputEl) _outputEl.innerHTML = '';
}

/**
 * Update the connect button UI.
 */
function _updateConnectUI(connected) {
  const connectBtn = document.getElementById('smConnectBtn');
  const stopBtn    = document.getElementById('smStopBtn');
  const indicator  = document.getElementById('smReadingIndicator');
  const label      = document.getElementById('smConnectLabel');
  if (!connectBtn) return;

  if (connected) {
    connectBtn.classList.add('sm-connected');
    if (label)      label.textContent = 'Disconnect';
    if (stopBtn)    stopBtn.style.display = 'inline-flex';
    if (indicator)  indicator.classList.add('active');
  } else {
    connectBtn.classList.remove('sm-connected');
    if (label)      label.textContent = 'Connect';
    if (stopBtn)    stopBtn.style.display = 'none';
    if (indicator)  indicator.classList.remove('active');
  }
}

/**
 * Pause reading — called by serialUpload before uploading.
 * Stops the read loop and releases the reader lock so the uploader
 * can safely acquire its own reader/writer pair.
 * Returns a function to resume reading afterwards.
 */
export async function pauseSerialMonitor() {
  const wasReading = _readLoopActive;
  const savedPort = _monitorPort;

  if (wasReading) {
    await _stopReading();
    // Give the stream time to fully release
    await new Promise(r => setTimeout(r, 100));
  }

  return () => {
    // Always start reading after upload — even if the monitor wasn't
    // previously running. This ensures print() output appears immediately.
    const port = savedPort || getActivePort();
    if (port) {
      _monitorPort = port;
      clearOutput();
      _startReading();
      _updateConnectUI(true);
      appendOutput('[Connected] Listening for output…\n', 'sm-system');
    }
  };
}

/**
 * Auto-connect the serial monitor to the active port.
 * Called by uploadPanel after a successful MicroPython upload
 * so the user immediately sees streaming output.
 */
export async function connectSerialMonitor() {
  // If already reading, skip
  if (_readLoopActive) return;

  try {
    let port = getActivePort();

    if (!port || getConnectionState() !== 'connected') {
      // Try to get any previously paired port
      if ('serial' in navigator) {
        const ports = await navigator.serial.getPorts();
        if (ports.length > 0) {
          port = ports[0];
        }
      }
    }

    if (!port) {
      appendOutput('[Info] No port available. Click Connect to select a port.\n', 'sm-system');
      return;
    }

    // If the readable stream was canceled (by upload cleanup), reopen the port
    if (!port.readable) {
  // Ensure any stale OS lock is released — CH340 needs this after flash
  try { await port.close(); } catch (_) {}

  // Wait for OS to fully release the CH340 port (500ms minimum)
  // Without this, port.open() throws "The port is already open" or
  // opens successfully but readable stays null
  await new Promise(r => setTimeout(r, 500));

  // Retry open up to 3 times — CH340 is slow to release
  let opened = false;
  for (let i = 0; i < 3; i++) {
    try {
      await port.open({ baudRate: _baudRate });
      opened = true;
      break;
    } catch (e) {
      console.warn(`[SerialMonitor] port.open attempt ${i + 1} failed:`, e.message);
      await new Promise(r => setTimeout(r, 300));
    }
  }

  if (!opened) {
    appendOutput('[Error] Could not open port after flash. Try clicking Connect manually.\n', 'sm-error');
    return;
  }

  // Small settle time so first bytes aren't missed
  await new Promise(r => setTimeout(r, 200));
}

    _monitorPort = port;

    clearOutput();
    _startReading();
    _updateConnectUI(true);
    appendOutput('[Connected] Listening for output…\n', 'sm-system');
  } catch (err) {
    appendOutput(`[Error] ${err.message}\n`, 'sm-error');
  }
}
