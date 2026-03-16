/**
 * serialUpload.js
 * Handles uploading MicroPython code to an ESP32 via Web Serial API.
 *
 * MicroPython raw REPL protocol:
 *  Ctrl+C   = interrupt running program
 *  Ctrl+A   = enter raw REPL mode  (board replies "raw REPL; CTRL-B to exit\r\n>")
 *  <code>   = paste code
 *  Ctrl+D   = execute             (board replies "OK<stdout>\x04<stderr>\x04>")
 *  Ctrl+B   = exit raw REPL back to friendly REPL
 */

import { buildESP32Code } from "./codeBuilder";

const BAUD_RATE = 115200;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Safely read bytes from a Web Serial reader for up to `timeoutMs`.
 * Avoids abandoned pending reads by calling reader.cancel() on timeout.
 */
async function readFor(reader, timeoutMs) {
  let result = "";
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const remaining = Math.max(10, deadline - Date.now());

    // Race the next chunk against a timeout flag
    let timedOut = false;
    const timer = new Promise((res) =>
      setTimeout(() => { timedOut = true; res(null); }, remaining)
    );

    const readPromise = reader.read();
    const winner = await Promise.race([readPromise, timer]);

    if (winner === null) {
      // Timeout won — cancel the pending read cleanly
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
 * Main upload function.
 * @param {string} code      - MicroPython code to send to the ESP32
 * @param {function} onStatus - Callback(statusKey) for progress updates
 * @returns {Promise<{ success: boolean, output: string }>}
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
  let writer = null;
  let reader = null;

  // Clean up all locks and close port safely
  const cleanup = async () => {
    try { if (reader) { await reader.cancel().catch(() => {}); reader.releaseLock(); } } catch (_) {}
    try { if (writer) { writer.releaseLock(); } } catch (_) {}
    try { if (port) { await port.close(); } } catch (_) {}
  };

  try {
    // ── 1. Request port from user ─────────────────────────────────────
    onStatus("waiting_port");
    port = await navigator.serial.requestPort();

    // ── 2. Open port ──────────────────────────────────────────────────
    onStatus("connecting");
    await port.open({ baudRate: BAUD_RATE });
    await delay(300);

    writer = port.writable.getWriter();
    reader = port.readable.getReader();

    const send = (text) => writer.write(enc.encode(text));

    // ── 3. Interrupt any running program ──────────────────────────────
    onStatus("interrupting");
    await send("\x03");        // Ctrl+C
    await delay(200);
    await send("\x03");        // Ctrl+C again
    await delay(300);
    await readFor(reader, 400); // flush any pending output

    // ── 4. Enter raw REPL mode ────────────────────────────────────────
    onStatus("entering_repl");
    await send("\x01");        // Ctrl+A
    await delay(300);
    let greeting = await readFor(reader, 600);

    if (!greeting.includes("raw REPL")) {
      // Board might need a soft-reset to reach MicroPython prompt
      await send("\x04");      // Ctrl+D = soft reset
      await delay(1200);
      await send("\x01");      // Ctrl+A again
      await delay(300);
      greeting = await readFor(reader, 600);
    }

    // ── 5. Send code ──────────────────────────────────────────────────
    onStatus("uploading");
    const finalCode = buildESP32Code(code);
    
    // To make it persist after the port closes (which causes hardware reset),
    // we must save it to main.py. We wrap the code in a file-write script.
    // Triple-quotes are safe since Blockly string generators use double quotes.
    const fileWriteScript = `
f = open('main.py', 'w')
f.write("""${finalCode.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')}""")
f.close()
import os
print("Saved Files:", os.listdir())
with open('main.py', 'r') as f:
    print("--- MAIN.PY CONTENT ---")
    print(f.read())
    print("-----------------------")
`;

    // Send the file-write script via raw REPL
    await send(fileWriteScript.trim() + "\r\n");
    await delay(100);
    await send("\x04");        // Ctrl+D = execute the file-write

    // ── 6. Read response ──────────────────────────────────────────────
    onStatus("reading_output");
    const response = await readFor(reader, 1000);

    // Raw REPL response format: "OK<stdout>\x04<stderr>\x04>"
    let stdout = "";
    let stderr = "";
    const match = response.match(/OK([\s\S]*?)\x04([\s\S]*?)\x04/);
    if (match) {
      stdout = match[1].trim();
      stderr = match[2].trim();
    } else {
      stdout = response.trim();
    }

    // ── 7. Exit raw REPL and Reboot ───────────────────────────────────
    await send("\x02");        // Ctrl+B = back to friendly REPL
    await delay(200);
    
    // Soft reboot so it runs main.py
    await send("\x04");        // Ctrl+D in friendly REPL = soft reboot
    await delay(500);

    await cleanup();

    if (stderr.length > 0 && !stderr.includes("Could not decode")) {
      return { success: false, output: stderr };
    }
    return { success: true, output: "✓ Uploaded to ESP32! Running now..." };

  } catch (err) {
    await cleanup();
    throw err;
  }
}

// Code transformation is handled by codeBuilder.js (buildESP32Code)
