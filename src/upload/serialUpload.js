// uploads micropython to esp32 via web serial raw repl protocol
// Reuses the already-connected port from ConnectModal when available
import { buildESP32Code } from "./codeBuilder";
import { getActivePort, getConnectionState } from "../ui/ConnectModal";

const BAUD_RATE = 115200;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const enc = new TextEncoder();
const dec = new TextDecoder();

async function readFor(reader, timeoutMs) {
  let result = "";
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const remaining = Math.max(10, deadline - Date.now());

    let timedOut = false;
    const timer = new Promise((res) =>
      setTimeout(() => { timedOut = true; res(null); }, remaining)
    );

    const readPromise = reader.read();
    const winner = await Promise.race([readPromise, timer]);

    if (winner === null) {
      await reader.cancel().catch(() => {});
      break;
    }

    const { value, done } = winner;
    if (done || !value) break;
    result += dec.decode(value);
  }

  return result;
}

/**
 * Upload MicroPython code to ESP32 via Web Serial Raw REPL.
 *
 * Strategy:
 * 1. If a port is already connected via ConnectModal, reuse it (no prompt).
 * 2. If not connected, request a port via the browser picker.
 *
 * Raw REPL protocol:
 *   Ctrl+C  → interrupt running program
 *   Ctrl+A  → enter raw REPL mode
 *   <code>  → send the MicroPython source
 *   Ctrl+D  → execute the sent code
 *   Ctrl+B  → exit raw REPL back to normal REPL
 */
export async function uploadToESP32(code, onStatus = () => {}) {
  if (!("serial" in navigator)) {
    const isSecure = location.protocol === "https:" || location.hostname === "localhost";
    if (!isSecure) {
      throw new Error(
        "Upload requires a secure connection (HTTPS). " +
        "Please access this app over HTTPS, or run it locally."
      );
    }
    throw new Error(
      "Web Serial API not supported in this browser. " +
      "Please use Chrome or Edge (version 89+)."
    );
  }

  let port = null;
  let ownedPort = false; // true if we opened the port ourselves
  let writer = null;
  let reader = null;

  const cleanup = async () => {
    try { if (reader) { await reader.cancel().catch(() => {}); reader.releaseLock(); } } catch (_) {}
    try { if (writer) { writer.releaseLock(); } } catch (_) {}
    // Only close the port if we opened it, not if it came from ConnectModal
    if (ownedPort) {
      try { if (port) { await port.close(); } } catch (_) {}
    }
  };

  try {
    // ── 1. Get port ──────────────────────────────────
    const existingPort = getActivePort();
    if (existingPort && getConnectionState() === 'connected') {
      // Reuse the already-connected port — no browser prompt needed
      port = existingPort;
      ownedPort = false;
      onStatus("connecting");
      await delay(100);
    } else {
      // No port connected; request one via browser picker
      onStatus("waiting_port");
      port = await navigator.serial.requestPort();
      ownedPort = true;
      onStatus("connecting");
      await port.open({ baudRate: BAUD_RATE });
      await delay(300);
    }

    writer = port.writable.getWriter();
    reader = port.readable.getReader();

    const send = (text) => writer.write(enc.encode(text));

    // ── 2. Interrupt any running program ─────────────
    onStatus("interrupting");
    await send("\x03");        // Ctrl+C
    await delay(200);
    await send("\x03");        // Ctrl+C again
    await delay(300);
    await readFor(reader, 400); // drain any output

    // ── 3. Enter Raw REPL ────────────────────────────
    onStatus("entering_repl");
    await send("\x01");        // Ctrl+A = enter raw REPL
    await delay(300);
    let greeting = await readFor(reader, 600);

    if (!greeting.includes("raw REPL")) {
      // Soft reset and retry
      await send("\x04");      // Ctrl+D = soft reset
      await delay(1200);
      await send("\x01");      // Ctrl+A again
      await delay(300);
      greeting = await readFor(reader, 600);
    }

    // ── 4. Send code ─────────────────────────────────
    onStatus("uploading");
    const finalCode = buildESP32Code(code);

    // Send in chunks (some serial bridges have buffer limits)
    const CHUNK_SIZE = 256;
    for (let i = 0; i < finalCode.length; i += CHUNK_SIZE) {
      await send(finalCode.slice(i, i + CHUNK_SIZE));
      await delay(20);
    }

    await delay(100);
    await send("\x04");        // Ctrl+D = execute

    // ── 5. Read output ───────────────────────────────
    onStatus("reading_output");
    const response = await readFor(reader, 5000);

    let stdout = "";
    let stderr = "";
    const match = response.match(/OK([\s\S]*?)\x04([\s\S]*?)\x04/);
    if (match) {
      stdout = match[1].trim();
      stderr = match[2].trim();
    } else {
      stdout = response.trim();
    }

    // ── 6. Exit raw REPL ─────────────────────────────
    await send("\x02");        // Ctrl+B = exit raw REPL
    await delay(200);

    await cleanup();

    if (stderr.length > 0) {
      return { success: false, output: stderr };
    }
    return { success: true, output: stdout || "✓ Code uploaded and running on ESP32!" };

  } catch (err) {
    await cleanup();
    throw err;
  }
}
