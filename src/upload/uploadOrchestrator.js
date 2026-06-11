// Coordinates compile + flash (Arduino) and direct upload (MicroPython)
import { compileArduinoSketch } from './compileService';
import { flashESP32 }           from './espFlasher';
import { uploadToESP32 }        from './serialUpload';
import { buildESP32Code }       from './codeBuilder';

/**
 * Full Arduino pipeline: compile .ino → flash .bin to ESP32
 *
 * @param {string} inoSource  — Arduino C++ source (.ino contents)
 * @param {string} fqbn       — Board FQBN e.g. 'esp32:esp32:esp32'
 * @param {Object} boardDef   — Board definition (has .upload config)
 * @param {function} onStatus — Status callback(stage, percent?)
 */
export async function uploadArduino(inoSource, fqbn, boardDef, onStatus = () => {}) {
  if (!('serial' in navigator)) {
    throw new Error('Web Serial API not supported. Please use Chrome or Edge.');
  }

  onStatus('waiting_port');
  const port = await navigator.serial.requestPort();

  onStatus('compiling');
  const { binary, stderr } = await compileArduinoSketch(
    inoSource,
    fqbn,
    (stage) => onStatus(stage)
  );

  if (stderr && stderr.trim()) {
    console.warn('[compile] warnings:', stderr);
  }

  onStatus('flashing', 0);
  await flashESP32(binary, port, boardDef, (stage, pct) => onStatus(stage, pct));

  onStatus('done', 100);
}

/**
 * Full MicroPython pipeline: build code → upload via Raw REPL
 *
 * @param {string} rawBlocklyCode — Raw code from MicroPython generator
 * @param {function} onStatus     — Status callback(stage)
 */
export async function uploadMicroPython(rawBlocklyCode, onStatus = () => {}) {
  onStatus('building');
  const code = buildESP32Code(rawBlocklyCode);
  return await uploadToESP32(code, onStatus);
}
