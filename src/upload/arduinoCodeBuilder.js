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

  const setupLines = [];
  const loopLines = [];

  for (const block of topBlocks) {
    if (block.type === 'esp32_when_starts') {
      const inner = arduinoGenerator.statementToCode(block, 'DO') || '';
      if (inner.trim()) setupLines.push(inner.trimEnd());
    } else {
      const code = arduinoGenerator.blockToCode(block);
      if (typeof code === 'string' && code.trim()) {
        loopLines.push(code.trimEnd());
      }
    }
  }

  // Collect definitions: includes, pin-setup (→ setup), functions, globals
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

  const indentCode = (code) =>
    code
      .split('\n')
      .map((l) => (l.trim() ? '  ' + l : ''))
      .join('\n');

  // Auto-inject Serial.begin if any code uses Serial
  const allCode = setupLines.join('\n') + loopLines.join('\n');
  const needsSerial = allCode.includes('Serial.print') || allCode.includes('Serial.read');

  // Combine setup: Serial.begin + pin setup defs + user setup blocks
  const fullSetup = [];
  if (needsSerial) fullSetup.push('  Serial.begin(115200);');
  for (const pd of pinSetupDefs) fullSetup.push(indentCode(pd));
  for (const sl of setupLines) fullSetup.push(indentCode(sl));

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
