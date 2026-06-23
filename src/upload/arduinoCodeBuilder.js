// Builds a complete Arduino sketch from the Blockly workspace
import { arduinoGenerator } from '../generators/arduinoGenerator';
import { pinReservationManager } from '../boards/PinReservationManager';

export const BAUD_RATE = 115200;

/**
 * Generate a full Arduino sketch from the current workspace.
 * @param {Blockly.Workspace} workspace
 * @param {{ name?: string, fqbn?: string } | null} boardDef
 * @returns {string} Complete Arduino sketch as C++ string
 */
export function buildArduinoSketch(workspace, boardDef = null) {
  const topBlocks = workspace.getTopBlocks(true);

  arduinoGenerator.init(workspace);

  const loopLines = [];

  for (const block of topBlocks) {
    if (block.type === 'esp32_when_starts') {
      const inner = arduinoGenerator.statementToCode(block, 'DO') || '';
      if (inner.trim()) loopLines.push(inner.trimEnd());
    } else {
      const code = arduinoGenerator.blockToCode(block);
      if (typeof code === 'string' && code.trim()) {
        loopLines.push(code.trimEnd());
      }
    }
  }

  // ── Collect from legacy definitions_ ──────────────────────────────────────
  const includes = [];
  const funcDefs = [];
  const globals = [];
  for (const val of Object.values(arduinoGenerator.definitions_)) {
    const first = val.split('\n')[0].trim();
    if (first.startsWith('#include') || first.startsWith('#define')) {
      if (!includes.includes(val)) includes.push(val);
    } else if (/^(void|int|float|long|bool|String)\s+\w+\s*\(/.test(first)) {
      funcDefs.push(val);
    } else {
      globals.push(val);
    }
  }

  // ── Collect from SketchRegistry (heart/lcd/mpu/l298n generators) ──────────
  const sketch = arduinoGenerator.sketch;
  if (sketch) {
    for (const line of sketch.getIncludes()) {
      if (!includes.includes(line)) includes.push(line);
    }
    for (const decl of sketch.getGlobals()) {
      if (!globals.includes(decl)) globals.push(decl);
    }
    for (const fn of sketch.getFunctions()) {
      if (!funcDefs.includes(fn)) funcDefs.push(fn);
    }
  }

  // ── Build pin constant map from pinSetup_ registry ────────────────────────
  // pinSetup_ entries: { pin: number, direction: string }
  const pinEntries = Object.values(arduinoGenerator.pinSetup_ || {})
    .sort((a, b) => a.pin - b.pin);

  // Map: pin number → constant name (zero-padded to 2 digits)
  const pinConstMap = new Map();
  for (const { pin } of pinEntries) {
    if (!pinConstMap.has(pin)) {
      pinConstMap.set(pin, `PIN_${String(pin).padStart(2, '0')}`);
    }
  }

  // #define lines — sorted ascending, constant name padded to column width
  const defineLines = [...pinConstMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([pin, name]) => `#define ${name.padEnd(8)} ${pin}`);

  // ── Build unique pinMode lines for setup() ────────────────────────────────
  const pinModeSet = new Set();
  const pinModeLines = [];
  for (const { pin, direction } of pinEntries) {
    const constant = pinConstMap.get(pin);
    const line = `  pinMode(${constant}, ${direction});`;
    if (!pinModeSet.has(line)) {
      pinModeSet.add(line);
      pinModeLines.push(line);
    }
  }

  // ── Collect non-pinMode setup entries from setupCode_ and SketchRegistry ──
  // _serial_begin is handled separately (always first)
  const serialBeginEntry = arduinoGenerator.setupCode_?.['_serial_begin'] || null;
  const otherSetupLines = [];
  for (const [key, val] of Object.entries(arduinoGenerator.setupCode_ || {})) {
    if (key === '_serial_begin') continue;
    // Skip any legacy setupCode_ entries that are just raw pinMode strings
    if (val.trim().startsWith('pinMode')) continue;
    otherSetupLines.push(val.trim());
  }
  if (sketch) {
    for (const entry of [...sketch.getPinSetup(), ...sketch.getSetup()]) {
      const t = entry.trim();
      if (!t.startsWith('pinMode') && !otherSetupLines.includes(t)) {
        otherSetupLines.push(t);
      }
    }
  }

  // ── Substitute raw pin numbers with constants everywhere ──────────────────
  function substitutePins(code) {
    if (!code || pinConstMap.size === 0) return code || '';
    let result = code;
    // Process longest (highest) pin numbers first to avoid replacing 4 in 14
    const sorted = [...pinConstMap.entries()].sort((a, b) => b[0] - a[0]);
    for (const [pin, constant] of sorted) {
      // Replace pin as a standalone numeric argument: preceded by ( , or space
      result = result.replace(
        new RegExp(`(?<=[,(\\s])${pin}(?=[,)\\s;])`, 'g'),
        constant,
      );
    }
    return result;
  }

  const loopCode = loopLines.join('\n');
  const loopOut  = substitutePins(loopCode);
  const defsOut  = funcDefs.map(substitutePins);
  const globalOut = globals.map(substitutePins);

  // ── Determine baud rate ───────────────────────────────────────────────────
  const baud = serialBeginEntry
    ? (serialBeginEntry.match(/\d+/)?.[0] || String(BAUD_RATE))
    : String(BAUD_RATE);

  // ── Auto-inject Serial.begin if any Serial. call is present ──────────────
  const allGeneratedCode = loopCode + '\n' + Object.values(arduinoGenerator.setupCode_ || {}).join('\n');
  const needsSerial = allGeneratedCode.includes('Serial.');

  // ── Conflict comments from PinReservationManager ──────────────────────────
  pinReservationManager.scanWorkspace(workspace);
  const conflicts = pinReservationManager.getConflicts();
  const conflictComments = conflicts.map(c => `// ⚠ PIN CONFLICT: ${c.message}`);

  // ── Indentation helper ──────────────────────────────────────────────────────
  const indentCode = (code) =>
    code
      .split('\n')
      .map((l) => (l.trim() ? '  ' + l : ''))
      .join('\n');

  // ── Loop body ──────────────────────────────────────────────────────────────
  const loopBody = loopOut.trim()
    ? loopOut.split('\n').map(l => l.trim() ? '  ' + l : '').join('\n')
    : '';

  // ── Header comment ─────────────────────────────────────────────────────────
  const boardName = boardDef?.name || 'ESP32';
  const fqbn = boardDef?.fqbn || 'esp32:esp32:esp32';
  const now = new Date().toISOString().slice(0, 10);
  const headerLines = [
    '// ╔══════════════════════════════════════════════════╗',
    `// ║  Board : ${boardName.padEnd(38)} ║`,
    `// ║  FQBN  : ${fqbn.padEnd(38)} ║`,
    `// ║  Baud  : ${baud.padEnd(38)} ║`,
    `// ║  Date  : ${now.padEnd(38)} ║`,
    '// ╚══════════════════════════════════════════════════╝',
  ];

  // ── Assemble final sketch ──────────────────────────────────────────────────
  // Order: header → conflict comments → #include → #define PIN_XX
  //        → globals → functions → setup() → loop()
  const parts = [...headerLines];

  if (conflictComments.length) {
    parts.push('');
    parts.push(...conflictComments);
  }

  if (includes.length) {
    parts.push('');
    parts.push(...includes);
  } else {
    parts.push('');
    parts.push('#include <Arduino.h>');
  }

  if (defineLines.length) {
    parts.push('');
    parts.push('// ── Pin definitions ──────────────────────────────────');
    parts.push(...defineLines);
  }

  if (globalOut.length) {
    parts.push('');
    parts.push(...globalOut);
  }

  if (defsOut.length) {
    parts.push('');
    parts.push(...defsOut);
  }

  // setup()
  parts.push('');
  parts.push('void setup() {');
  // Serial.begin is always the first line in setup()
  if (needsSerial) {
    parts.push(`  Serial.begin(${baud});`);
  }
  parts.push(...pinModeLines);
  for (const line of otherSetupLines) {
    parts.push(indentCode(line));
  }
  parts.push('}');

  // loop()
  parts.push('');
  parts.push('void loop() {');
  if (loopBody) parts.push(loopBody);
  parts.push('}');

  return parts.join('\n') + '\n';
}

/**
 * Returns a minimal empty Arduino sketch template.
 */
export function emptyArduinoSketch() {
  return [
    'void setup() {',
    '',
    '}',
    '',
    'void loop() {',
    '',
    '}',
  ].join('\n') + '\n';
}
