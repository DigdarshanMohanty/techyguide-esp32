// ═══════════════════════════════════════════════════════════════
//  Compile Service — Arduino Sketch Remote Compilation Client
// ═══════════════════════════════════════════════════════════════
//
//  Sends Arduino C++ code to a compile server and receives the
//  compiled binary (firmware .bin) for flashing via esptool-js.
//
//  The compile server is a separate backend (Express + arduino-cli).
//  This module handles the client-side HTTP request + error handling.
//
//  Usage:
//    import { compileArduinoSketch, setCompileServerUrl } from './compileService';
//    const result = await compileArduinoSketch(code, fqbn, onProgress);

// Default compile server URL — injected at build time from COMPILE_SERVER_URL in .env
// Falls back to localhost:3100 if not set. Override at runtime with setCompileServerUrl().
// eslint-disable-next-line no-undef
let COMPILE_API_URL = (typeof __COMPILE_SERVER_URL__ !== 'undefined')
  ? __COMPILE_SERVER_URL__
  : 'http://localhost:3100/compile';

/**
 * Set the compile server URL.
 * Call this before compileArduinoSketch() if using a non-default server.
 * @param {string} url — full URL including path, e.g. 'https://compile.example.com/compile'
 */
export function setCompileServerUrl(url) {
  COMPILE_API_URL = url;
}

/**
 * Get the current compile server URL.
 * @returns {string}
 */
export function getCompileServerUrl() {
  return COMPILE_API_URL;
}

/**
 * Compile an Arduino sketch on the remote compile server.
 *
 * @param {string} code — Arduino C++ source code (.ino contents)
 * @param {string} fqbn — Fully Qualified Board Name (e.g. 'esp32:esp32:esp32')
 * @param {function(string): void} [onProgress] — Optional progress callback
 * @returns {Promise<{ binary: Uint8Array, stdout: string, stderr: string }>}
 * @throws {Error} If compilation fails or server is unreachable
 */
export async function compileArduinoSketch(code, fqbn, onProgress) {
  if (!code || code.trim() === '') {
    throw new Error('No code to compile');
  }

  onProgress?.('compiling');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    response = await fetch(COMPILE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, fqbn }),
      signal: controller.signal,
    });
  } catch (networkErr) {
    if (networkErr.name === 'AbortError') {
      throw new Error('Compile server timed out after 30 seconds.');
    }
    throw new Error(
      'Cannot reach the compile server. Make sure it is running.\n\n' +
      'Start it with: node compile-server.js'
    );
  } finally {
    clearTimeout(timeout);
  }

  const data = await response.json();

  if (!response.ok) {
    const stderr = data.stderr || data.error || 'Unknown compilation error';
    const err = new Error(`Compilation failed:\n${stderr}`);
    err.stdout = data.stdout || '';
    err.stderr = stderr;
    throw err;
  }

  onProgress?.('compiled');

  // Server returns binary as base64-encoded string
  const binaryB64 = data.binary;
  if (!binaryB64) {
    throw new Error('Server returned success but no binary data');
  }

  // Decode base64 → Uint8Array
  let binary;
  try {
    const binaryStr = atob(binaryB64);
    binary = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      binary[i] = binaryStr.charCodeAt(i);
    }
  } catch (e) {
    throw new Error('Server returned invalid binary data (base64 decode failed).');
  }

  return {
    binary,
    stdout: data.stdout || '',
    stderr: data.stderr || '',
  };
}
