// uploads micropython to esp32 via web serial
// Uses raw REPL protocol then cleanly releases port for serial monitor
import { getActivePort, getConnectionState } from "../ui/ConnectModal";
import { pauseSerialMonitor } from "../ui/SerialMonitor";

const BAUD_RATE = 115200;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Upload MicroPython code to ESP32 via Web Serial Raw REPL.
 *
 * Pauses the serial monitor before upload to release its reader,
 * then resumes it after upload completes so the user sees streaming output.
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
  let ownedPort = false;
  let writer = null;
  let reader = null;
  let resumeMonitor = null;

  // Cancel any pending reads, then release all locks.
  const releaseLocks = async () => {
    if (reader) {
      try { await reader.cancel(); } catch (_) {}
      try { reader.releaseLock(); } catch (_) {}
      reader = null;
    }
    if (writer) {
      try { writer.releaseLock(); } catch (_) {}
      writer = null;
    }
  };

  try {
    // ── 0. Pause the serial monitor (releases its reader) ──
    resumeMonitor = await pauseSerialMonitor();

    // ── 1. Get port ──────────────────────────────────
    const existingPort = getActivePort();
    if (existingPort && getConnectionState() === 'connected') {
      port = existingPort;
      ownedPort = false;
      onStatus("connecting");

      // If the readable stream was consumed (canceled by monitor pause), reopen
      if (!port.readable) {
        try { await port.close(); } catch (_) {}
        await delay(300);
        await port.open({ baudRate: BAUD_RATE });
      }
      await delay(100);
    } else {
      onStatus("waiting_port");
      port = await navigator.serial.requestPort();
      ownedPort = true;
      onStatus("connecting");
      await port.open({ baudRate: BAUD_RATE });
      await delay(300);
    }

    // ── 1b. Acquire reader/writer ────────────────────
    writer = port.writable.getWriter();
    reader = port.readable.getReader();

    const send = (text) => writer.write(enc.encode(text));

    // Read with timeout — collects data until deadline
    const readFor = async (timeoutMs) => {
      let result = "";
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        const remaining = Math.max(10, deadline - Date.now());
        const timer = new Promise(r => setTimeout(() => r('TIMEOUT'), remaining));
        const readP = reader.read();
        const winner = await Promise.race([readP, timer]);

        if (winner === 'TIMEOUT') break;
        const { value, done } = winner;
        if (done) break;
        if (value) result += dec.decode(value);
      }
      return result;
    };

    // ── 2. Interrupt any running program ─────────────
    onStatus("interrupting");
    await send("\x03");          // Ctrl+C
    await delay(200);
    await send("\x03");          // Ctrl+C again
    await delay(300);
    await readFor(400);          // drain any output

    // ── 3. Enter Raw REPL ────────────────────────────
    onStatus("entering_repl");
    await send("\x01");          // Ctrl+A = enter raw REPL
    await delay(300);
    let greeting = await readFor(600);

    if (!greeting.includes("raw REPL")) {
      // Soft-reset and retry
      await send("\x04");        // Ctrl+D = soft reset
      await delay(1500);
      await send("\x03");        // Ctrl+C to stop boot code
      await delay(200);
      await send("\x01");        // Ctrl+A
      await delay(300);
      greeting = await readFor(600);
    }

    // ── 4. Send code ─────────────────────────────────
    onStatus("uploading");

    const CHUNK_SIZE = 256;
    for (let i = 0; i < code.length; i += CHUNK_SIZE) {
      await send(code.slice(i, i + CHUNK_SIZE));
      await delay(20);
    }

    await delay(100);
    await send("\x04");          // Ctrl+D = compile & execute

    // ── 5. Read initial response (OK marker + any immediate errors) ──
    onStatus("reading_output");
    const response = await readFor(2000);

    let stdout = "";
    let stderr = "";
    const match = response.match(/OK([\s\S]*?)\x04([\s\S]*?)\x04/);
    if (match) {
      stdout = match[1].trim();
      stderr = match[2].trim();
    } else {
      // No OK..^D..^D framing found — could mean the code has a while-loop
      // that's running and the framing markers haven't arrived yet.
      // Check if we at least got "OK" (code accepted and running).
      if (response.includes("OK")) {
        stdout = response.replace("OK", "").trim();
        stderr = "";
      } else {
        stdout = response.trim();
      }
    }

    // ── 6. DO NOT exit raw REPL if code is still running ──
    // If the code contains a while-loop, sending Ctrl+B would kill execution.
    // Instead, just release locks and let serial monitor pick up streaming output.
    // The user's code (e.g. while True: print(sensor)) will keep printing.

    // Only exit raw REPL if there was an error (code isn't running)
    if (stderr.length > 0) {
      await send("\x02");        // Ctrl+B = exit raw REPL
      await delay(200);
    }

    // ── 7. Release locks ─────────────────────────────
    await releaseLocks();

    // ── 8. Wait for ESP32 to start outputting, then resume monitor ──
    await delay(500);

    if (resumeMonitor) {
      resumeMonitor();
      resumeMonitor = null;
    }

    if (stderr.length > 0) {
      return { success: false, output: stderr };
    }
    return {
      success: true,
      output: stdout || "Code uploaded and executing on ESP32!"
    };

  } catch (err) {
    await releaseLocks();
    if (ownedPort && port) {
      try { await port.close(); } catch (_) {}
    }
    // Try to resume monitor even on error
    if (resumeMonitor) {
      try { resumeMonitor(); } catch (_) {}
    }
    throw err;
  }
}
