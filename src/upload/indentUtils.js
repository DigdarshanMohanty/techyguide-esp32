// centralized indentation and code formatting utilities
// used by both codeBuilder.js and arduinoCodeBuilder.js

const PYTHON_INDENT = "    "; // 4 spaces
const ARDUINO_INDENT = "  ";  // 2 spaces

/**
 * Indent every non-empty line of code by N levels.
 * @param {string} code — code string (may contain multiple lines)
 * @param {number} level — indent depth (default 1)
 * @param {string} unit — indent unit (default 4 spaces for Python)
 * @returns {string}
 */
export function indent(code, level = 1, unit = PYTHON_INDENT) {
  const prefix = unit.repeat(level);
  return code
    .split("\n")
    .map((line) => (line.trim() ? prefix + line : ""))
    .join("\n");
}

/**
 * Indent for Arduino (2-space).
 */
export function indentArduino(code, level = 1) {
  return indent(code, level, ARDUINO_INDENT);
}

/**
 * Remove leading/trailing blank lines and normalize line endings.
 * @param {string} code
 * @returns {string}
 */
export function trimCode(code) {
  return code
    .replace(/\r\n/g, "\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "\n");
}

/**
 * Normalize indentation: convert tabs to spaces, remove trailing whitespace.
 * @param {string} code
 * @returns {string}
 */
export function normalizeIndentation(code) {
  return code
    .split("\n")
    .map((line) => line.replace(/\t/g, PYTHON_INDENT).trimEnd())
    .join("\n");
}
