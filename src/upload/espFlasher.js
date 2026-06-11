// ═══════════════════════════════════════════════════════════════
//  ESP32 Flasher — Browser-based firmware flashing via esptool-js
// ═══════════════════════════════════════════════════════════════
//
//  Wraps esptool-js to flash compiled Arduino firmware to an
//  ESP32 over Web Serial. Handles the full connect → sync →
//  erase → write → verify cycle.
//
//  Requires: Web Serial API (Chrome/Edge 89+)
//  Dependency: esptool-js (npm package)
//
//  Usage:
//    import { flashESP32, isEsptoolAvailable } from './espFlasher';
//    await flashESP32(binary, port, boardDef, onProgress);

/**
 * Check if esptool-js is available (dynamically imported).
 * @returns {Promise<boolean>}
 */
export async function isEsptoolAvailable() {
  try {
    await import('esptool-js');
    return true;
  } catch {
    return false;
  }
}

/**
 * Flash a compiled binary to an ESP32 via Web Serial.
 *
 * @param {Uint8Array} binary — Compiled firmware binary
 * @param {SerialPort} port — Web Serial port (already requested via navigator.serial.requestPort)
 * @param {Object} boardDef — Board definition from BoardRegistry (has .upload config)
 * @param {function(string, number?): void} [onProgress] — Progress callback(status, percent)
 * @returns {Promise<void>}
 * @throws {Error} If flashing fails
 */
export async function flashESP32(binary, port, boardDef, onProgress) {
  if (!('serial' in navigator)) {
    throw new Error(
      'Web Serial API is not supported in this browser. ' +
      'Please use Chrome or Edge (version 89+).'
    );
  }

  if (!boardDef) throw new Error('No board definition provided to flashESP32.');

  // Dynamic import — esptool-js is only loaded when actually flashing
  let ESPLoader, Transport;
  try {
    const esptool = await import('esptool-js');
    ESPLoader = esptool.ESPLoader;
    Transport = esptool.Transport;
  } catch (err) {
    throw new Error(
      'esptool-js is not installed. Run: npm install esptool-js\n\n' +
      `Error: ${err.message}`
    );
  }

  const uploadConfig = boardDef.upload || {};

  // Validate ESP32 firmware magic byte (0xE9) before attempting to flash
  if (!binary || binary.length < 4 || binary[0] !== 0xE9) {
    throw new Error(
      'Invalid firmware binary: missing ESP32 image magic byte. ' +
      'The compiled binary may be corrupt or empty.'
    );
  }

  onProgress?.('connecting', 0);

  // Create transport from the Web Serial port
  const transport = new Transport(port, true);

  // Terminal stub for esptool-js (logs to console)
  const terminal = {
    clean() {},
    writeLine(data) { console.log('[esptool]', data); },
    write(data) { console.log('[esptool]', data); },
  };

  const loaderOptions = {
    transport,
    baudrate: uploadConfig.baudRate || 921600,
    terminal,
    debugLogging: false,
  };

  let loader;
  try {
    // Initialize ESPLoader — connects and syncs with the chip
    loader = new ESPLoader(loaderOptions);

    onProgress?.('syncing', 10);
    await loader.main();

    onProgress?.('detecting', 20);
    await loader.flashId();

    onProgress?.('erasing', 30);

    // Prepare flash file array
    // Arduino firmware goes at offset 0x10000 for ESP32
    const flashOptions = {
      fileArray: [{
        data: binary,
        address: 0x10000,
      }],
      flashSize: uploadConfig.flashSize || '4MB',
      flashMode: uploadConfig.flashMode || 'dio',
      flashFreq: uploadConfig.flashFreq || '80m',
      eraseAll: false,
      compress: true,
      reportProgress: (fileIndex, written, total) => {
        const percent = 30 + Math.round((written / total) * 60);
        onProgress?.('flashing', percent);
      },
    };

    onProgress?.('flashing', 35);
    await loader.writeFlash(flashOptions);

    onProgress?.('resetting', 95);

    // Hard reset the chip to run the new firmware
    await transport.setDTR(false);
    await transport.setRTS(true);
    await new Promise(r => setTimeout(r, 100));
    await transport.setRTS(false);

    onProgress?.('complete', 100);

  } catch (err) {
    onProgress?.('error', 0);
    throw new Error(`Flash failed: ${err.message}`);
  } finally {
    try { await transport.disconnect(); } catch (_) {}
    try { await port.close(); } catch (_) {}
  }
}
