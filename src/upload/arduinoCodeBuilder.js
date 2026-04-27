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
      // Generate inner setup code from the DO/STACK connection
      const inner = arduinoGenerator.statementToCode(block, 'DO')
        || arduinoGenerator.statementToCode(block, 'SUBSTACK')
        || '';
      if (inner.trim()) setupLines.push(inner.trimEnd());
    } else {
      const code = arduinoGenerator.blockToCode(block);
      if (typeof code === 'string' && code.trim()) {
        loopLines.push(code.trimEnd());
      }
    }
  }

  // Collect definitions (includes, global declarations)
  const includes = [];
  const globals = [];
  for (const val of Object.values(arduinoGenerator.definitions_)) {
    const first = val.split('\n')[0].trim();
    if (first.startsWith('#include') || first.startsWith('#define')) {
      if (!includes.includes(val)) includes.push(val);
    } else {
      globals.push(val);
    }
  }

  const indent = (code) =>
    code
      .split('\n')
      .map((l) => (l.trim() ? '  ' + l : ''))
      .join('\n');

  const setupBody =
    setupLines.length > 0
      ? setupLines.map(indent).join('\n')
      : '';

  const loopBody =
    loopLines.length > 0
      ? loopLines.map(indent).join('\n')
      : '';

  const parts = [
    ...includes,
    '',
    ...globals,
    globals.length ? '' : null,
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
