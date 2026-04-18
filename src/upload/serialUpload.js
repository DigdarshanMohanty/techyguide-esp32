// uploads micropython to esp32 via web serial raw repl protocol
import { buildESP32Code } from "./codeBuilder";

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

  const cleanup = async () => {
    try { if (reader) { await reader.cancel().catch(() => {}); reader.releaseLock(); } } catch (_) {}
    try { if (writer) { writer.releaseLock(); } } catch (_) {}
    try { if (port) { await port.close(); } } catch (_) {}
  };

  try {
    
    onStatus("waiting_port");
    port = await navigator.serial.requestPort();

    onStatus("connecting");
    await port.open({ baudRate: BAUD_RATE });
    await delay(300);

    writer = port.writable.getWriter();
    reader = port.readable.getReader();

    const send = (text) => writer.write(enc.encode(text));

    onStatus("interrupting");
    await send("\x03");        
    await delay(200);
    await send("\x03");        
    await delay(300);
    await readFor(reader, 400); 

    onStatus("entering_repl");
    await send("\x01");        
    await delay(300);
    let greeting = await readFor(reader, 600);

    if (!greeting.includes("raw REPL")) {
      
      await send("\x04");      
      await delay(1200);
      await send("\x01");      
      await delay(300);
      greeting = await readFor(reader, 600);
    }

    onStatus("uploading");
    const finalCode = buildESP32Code(code);
    await send(finalCode);
    await delay(100);
    await send("\x04");        

    onStatus("reading_output");
    
    const response = await readFor(reader, 3000);

    let stdout = "";
    let stderr = "";
    const match = response.match(/OK([\s\S]*?)\x04([\s\S]*?)\x04/);
    if (match) {
      stdout = match[1].trim();
      stderr = match[2].trim();
    } else {
      stdout = response.trim();
    }

    await send("\x02");        
    await delay(200);

    await cleanup();

    if (stderr.length > 0) {
      return { success: false, output: stderr };
    }
    return { success: true, output: stdout || "Code running on ESP32." };

  } catch (err) {
    await cleanup();
    throw err;
  }
}
