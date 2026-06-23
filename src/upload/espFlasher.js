// ═══════════════════════════════════════════════════════════════
//  ESP32 Flasher — Browser-based firmware flashing via esptool-js
// ═══════════════════════════════════════════════════════════════
//
//  Key fixes vs previous version:
//  1. Close + reopen port around each reset — clears hardware UART buffer
//     (not just the software RX buffer). This is the only reliable way
//     to stop a fast serial print loop from polluting the sync window.
//  2. Flush AFTER reopen (not before reset) — port is clean at this point.
//  3. loader.main() called WITHOUT 'no_reset' — we don't need a second reset
//     because we already triggered one and the port is clean.
//  4. Transport is recreated per attempt — avoids stale readLoop state.

export async function isEsptoolAvailable() {
  try {
    await import('esptool-js');
    return true;
  } catch {
    return false;
  }
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ── USB chip detection ────────────────────────────────────────────────────────

async function detectChip(port) {
  try {
    const info = await port.getInfo();
    const vid  = info?.usbVendorId;
    return {
      isCH340:  vid === 0x1A86,
      isFTDI:   vid === 0x0403,
      isCP210x: vid === 0x10C4,
      vendorId: vid,
    };
  } catch (_) {
    return { isCH340: false, isFTDI: false, isCP210x: false, vendorId: null };
  }
}

// ── Reset sequence ────────────────────────────────────────────────────────────
//
// Uses the port's setSignals() directly (not via Transport) because we need
// the port open for DTR/RTS control but CLOSED for esptool's internal reopen.
// The sequence mirrors esptool.py's ClassicReset.

async function triggerBootloaderViaPort(port, isCH340) {
  try {
    // IO0 low (BOOT held) — prepare for download mode
    await port.setSignals({ dataTerminalReady: false, requestToSend: true });
    await delay(isCH340 ? 150 : 100);

    // EN low then high — triggers reset into download mode while IO0 held
    await port.setSignals({ dataTerminalReady: false, requestToSend: false });
    await delay(isCH340 ? 600 : 250);

    // Release IO0
    await port.setSignals({ dataTerminalReady: true, requestToSend: false });
    await delay(50);
  } catch (e) {
    console.warn('[espFlasher] setSignals failed (manual BOOT press needed):', e.message);
  }
}

// ── RX buffer flush ───────────────────────────────────────────────────────────
//
// Drain and discard all bytes in the RX buffer after port reopen.
// At this point the buffer is small (only data since reopen) so 200ms suffices.

async function flushSerialBuffer(port, durationMs = 200) {
  if (!port.readable) return;
  let reader;
  try {
    reader = port.readable.getReader();
    const deadline = Date.now() + durationMs;
    while (Date.now() < deadline) {
      const timeLeft = Math.max(deadline - Date.now(), 1);
      const { value, done } = await Promise.race([
        reader.read(),
        new Promise(res => setTimeout(() => res({ value: null, done: true }), timeLeft)),
      ]);
      if (done || !value) break;
      // discard bytes
    }
  } catch (e) {
    console.warn('[espFlasher] flush warning:', e.message);
  } finally {
    try { await reader?.cancel(); } catch (_) {}
    try { reader?.releaseLock(); } catch (_) {}
  }
  console.log('[espFlasher] RX buffer flushed');
}

// ── Main flash function ───────────────────────────────────────────────────────

export async function flashESP32(binary, port, boardDef, onProgress) {
  if (!('serial' in navigator)) {
    throw new Error(
      'Web Serial API is not supported. Use Chrome or Edge 89+.'
    );
  }
  if (!boardDef) throw new Error('No board definition provided.');
  if (!binary || binary.length < 4 || binary[0] !== 0xE9) {
    throw new Error('Invalid firmware binary — missing ESP32 magic byte 0xE9.');
  }

  // Load esptool-js dynamically
  let ESPLoader, Transport;
  try {
    const esptool = await import('esptool-js');
    ESPLoader = esptool.ESPLoader;
    Transport = esptool.Transport;
  } catch (err) {
    throw new Error(`esptool-js not installed. Run: npm install esptool-js\n${err.message}`);
  }

  const uploadConfig = boardDef.upload || {};

  // Detect USB chip BEFORE opening port (getInfo works on closed port)
  onProgress?.('detecting', 5);
  const chipInfo = await detectChip(port);
  console.log('[espFlasher] USB chip:', chipInfo);

  const flashBaud = chipInfo.isCH340
    ? 115200
    : (uploadConfig.baudRate || 460800);
  console.log('[espFlasher] Using baud:', flashBaud, '| CH340:', chipInfo.isCH340);

  const terminal = {
    clean:     () => {},
    writeLine: (s) => console.log('[esptool]', s),
    write:     (s) => console.log('[esptool]', s),
  };

  // ── Retry connect loop ────────────────────────────────────────────────────
  //
  // THE KEY FIX: close → reset → wait → reopen → flush → loader.main()
  //
  // Closing the port before reset clears the HARDWARE UART buffer on the
  // CH340 chip — not just the software RX buffer. When the port reopens
  // after 1500ms, the buffer is empty regardless of how fast the user code
  // prints. The ESP32 has already entered bootloader mode and is waiting.
  // esptool.main() then connects cleanly without reading stale sensor data.

  const MAX_RETRIES = 3;
  let loader    = null;
  let lastError = null;

  onProgress?.('connecting', 10);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[espFlasher] Connect attempt ${attempt}/${MAX_RETRIES}…`);

    // Step 1: Ensure port is open so we can toggle DTR/RTS
    if (!port.readable) {
      try {
        await port.open({ baudRate: 115200 });
        await delay(100);
      } catch (e) {
        console.warn('[espFlasher] port.open failed before reset:', e.message);
      }
    }

    // Step 2: Trigger bootloader via hardware reset
    await triggerBootloaderViaPort(port, chipInfo.isCH340);

    // Step 3: CLOSE the port — this flushes the HARDWARE buffer on CH340
    // Any sensor data printed after the reset is discarded at the chip level.
    try { await port.close(); } catch (_) {}

    // Step 4: Wait for ESP32 to enter bootloader mode.
    // Bootloader window opens ~50ms after reset and stays open for ~100ms.
    // We wait long enough (1500ms for CH340) to ensure the bootloader is
    // ready and the port has fully released on the OS side.
    const bootWait = chipInfo.isCH340
      ? 1500 + (attempt - 1) * 300   // 1500, 1800, 2100 ms
      : 700  + (attempt - 1) * 200;  //  700,  900, 1100 ms
    console.log(`[espFlasher] Waiting ${bootWait}ms for bootloader…`);
    await delay(bootWait);

    // Step 5: Reopen at ROM baud rate (115200)
    // The port buffer is now empty — ESP32 is in bootloader mode waiting.
    try {
      await port.open({ baudRate: 115200 });
    } catch (e) {
      lastError = e;
      console.warn('[espFlasher] port.open failed after reset:', e.message);
      await delay(300);
      continue;
    }
    await delay(100);

    // Step 6: Short flush — catches any bytes from the bootloader banner
    // (ROM prints a version string at 115200 which we need to discard)
    await flushSerialBuffer(port, 200);

    // Step 7: Close again — loader.main() opens the port internally via transport
    try { await port.close(); } catch (_) {}

    // Step 8: Create fresh Transport + ESPLoader per attempt
    // (reusing a Transport after disconnect leaves stale readLoop state)
    const transport = new Transport(port, true);
    const loaderOptions = {
      transport,
      baudrate:    flashBaud,
      terminal,
      romBaudrate: 115200,
      debugLogging: false,
    };

    try {
      loader = new ESPLoader(loaderOptions);
      // NO 'no_reset' argument — we already reset, but esptool's main()
      // will do its own sync dance which works correctly now the buffer is clean.
      // Passing 'no_reset' in v0.6.0 causes it to skip sync entirely → fails.
      await loader.main();
      console.log(`[espFlasher] Connected on attempt ${attempt} ✅`);
      lastError = null;
      break;
    } catch (err) {
      lastError = err;
      loader = null;
      console.warn(`[espFlasher] Attempt ${attempt} failed:`, err.message);
      try { await transport.disconnect(); } catch (_) {}
      try { await port.close(); } catch (_) {}
      await delay(300);
      if (attempt < MAX_RETRIES) {
        onProgress?.('connecting', 10 + attempt * 5);
      }
    }
  }

  if (!loader || lastError) {
    throw new Error(
      `Failed to connect to ESP32 after ${MAX_RETRIES} attempts.\n\n` +
      `To fix this:\n` +
      `1. Hold the BOOT button on your ESP32 board\n` +
      `2. Click Upload again\n` +
      `3. Release BOOT after the progress bar starts moving\n\n` +
      `Also add delay(500) to your loop() if you have fast Serial.println calls —\n` +
      `they can prevent the bootloader from connecting.\n\n` +
      `Technical: ${lastError?.message ?? 'Unknown error'}`
    );
  }

  // ── Flash ─────────────────────────────────────────────────────────────────

  onProgress?.('detecting', 25);
  try { await loader.flashId(); } catch (_) {}

  onProgress?.('erasing', 30);

  const flashOptions = {
    fileArray: [{ data: binary, address: 0x10000 }],
    flashSize: uploadConfig.flashSize || '4MB',
    flashMode: uploadConfig.flashMode || 'dio',
    flashFreq: uploadConfig.flashFreq || '80m',
    eraseAll:  false,
    compress:  true,
    reportProgress: (fileIndex, written, total) => {
      const pct = 30 + Math.round((written / total) * 60);
      onProgress?.('flashing', pct);
    },
  };

  onProgress?.('flashing', 35);

  try {
    await loader.writeFlash(flashOptions);
  } catch (err) {
    try { await loader.transport?.disconnect(); } catch (_) {}
    try { await port.close(); } catch (_) {}
    throw new Error(`Flash failed during write: ${err.message}`);
  }

  onProgress?.('resetting', 95);

  // Hard reset into user code
  try {
    await loader.transport?.setRTS(false);
    await delay(100);
    await loader.transport?.setRTS(true);
    await delay(100);
    await loader.transport?.setRTS(false);
  } catch (_) {}

  try { await loader.transport?.disconnect(); } catch (_) {}
  try { await port.close(); } catch (_) {}

  onProgress?.('complete', 100);
  console.log('[espFlasher] Flash complete ✅');
}