// Builds a complete Arduino sketch from the Blockly workspace
// Separates setup() code (from esp32_when_starts) from loop() code
import { arduinoGenerator } from '../generators/arduinoGenerator';

/**
 * Generate a full Arduino sketch from the current workspace.
 * @param {Blockly.Workspace} workspace
 * @returns {string} Complete Arduino sketch as C++ string
 */
export function buildArduinoSketch(workspace) {
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

  // ── Collect from legacy definitions_ (existing generators) ──────────────
  const includes = [];
  const pinSetupDefs = [];  // e.g. pinMode() — goes inside setup()
  const funcDefs = [];      // function declarations
  const globals = [];       // variable declarations
  for (const val of Object.values(arduinoGenerator.definitions_)) {
    const first = val.split('\n')[0].trim();
    if (first.startsWith('#include') || first.startsWith('#define')) {
      if (!includes.includes(val)) includes.push(val);
    } else if (first.startsWith('pinMode')) {
      pinSetupDefs.push(val);
    } else if (/^(void|int|float|long|bool|String)\s+\w+\s*\(/.test(first)) {
      funcDefs.push(val);
    } else {
      globals.push(val);
    }
  }

  // ── Collect from setupCode_ (pinMode calls injected by individual generators) ──
  for (const val of Object.values(arduinoGenerator.setupCode_ || {})) {
    if (!pinSetupDefs.includes(val)) pinSetupDefs.push(val);
  }

  // ── Collect from SketchRegistry (new generators: heart/lcd/mpu/l298n) ──
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
    // Pin setup and explicit setup entries both go into setup()
    for (const ps of sketch.getPinSetup()) {
      if (!pinSetupDefs.includes(ps)) pinSetupDefs.push(ps);
    }
    for (const entry of sketch.getSetup()) {
      if (!pinSetupDefs.includes(entry)) pinSetupDefs.push(entry);
    }
  }

  const indentCode = (code) =>
    code
      .split('\n')
      .map((l) => (l.trim() ? '  ' + l : ''))
      .join('\n');

  // Auto-inject Serial.begin if any code uses Serial (loop body or setup entries)
  const loopCode = loopLines.join('\n');
  const setupCode = Object.values(arduinoGenerator.setupCode_ || {}).join('\n');
  const allCode = loopCode + '\n' + setupCode;
  const needsSerial =
    allCode.includes('Serial.') &&
    !pinSetupDefs.some(l => l.includes('Serial.begin'));

  // Combine setup: Serial.begin + pin setup defs
  const fullSetup = [];
  if (needsSerial) fullSetup.push('  Serial.begin(115200);');
  for (const pd of pinSetupDefs) fullSetup.push(indentCode(pd));

  const setupBody = fullSetup.length > 0 ? fullSetup.join('\n') : '';

  const loopBody =
    loopLines.length > 0
      ? loopLines.map(indentCode).join('\n')
      : '';

  const parts = [
    ...includes,
    '',
    ...globals,
    ...funcDefs,
    (globals.length || funcDefs.length) ? '' : null,
    'void setup() {',
    setupBody || null,
    '}',
    '',
    'void loop() {',
    loopBody || null,
    '}',
  ].filter((l) => l !== null);

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
