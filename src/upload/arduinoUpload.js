/**
 * arduinoUpload.js
 * Frontend functions that call the local Arduino backend server
 * for listing ports, compiling, and uploading sketches.
 */

const API_BASE = "http://localhost:3456/api/arduino";

/**
 * Fetch available serial ports from the backend.
 * @returns {Promise<Array<{ address: string, boardName: string, fqbn: string|null }>>}
 */
export async function fetchArduinoPorts() {
  const resp = await fetch(`${API_BASE}/ports`);
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.error || `Server error (${resp.status})`);
  }
  const data = await resp.json();
  return data.ports || [];
}

/**
 * Send Arduino code to the backend for compile + upload.
 * @param {string} code   - Complete .ino sketch code
 * @param {string} port   - Serial port address (e.g. /dev/cu.usbmodem1201)
 * @param {string} [fqbn] - Fully qualified board name (default: arduino:avr:uno)
 * @returns {Promise<{ success: boolean, output: string }>}
 */
export async function uploadArduinoCode(code, port, fqbn = "arduino:avr:uno") {
  const resp = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, port, fqbn }),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new Error(data.error || `Upload failed (${resp.status})`);
  }

  return data;
}
