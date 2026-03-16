/**
 * arduinoCodeBuilder.js
 *
 * Converts raw Blockly-generated C++ statements into a complete
 * Arduino sketch with setup() and loop().
 *
 * Transformation steps:
 *  1. Parse definitions (from generator.definitions_) for setup() contents
 *  2. Place remaining body statements into loop()
 *  3. Return the final .ino-ready string
 */

const SCAFFOLDING_PATTERNS = [
  /^if\s*\(\s*false\s*\)\s*\{/, // Blockly empty-if stub
];

function isScaffolding(line) {
  const t = line.trim();
  return SCAFFOLDING_PATTERNS.some((re) => re.test(t));
}

/**
 * Builds a complete Arduino sketch from the raw code string
 * and definitions produced by the Arduino generator.
 *
 * @param {string} rawCode    - output of arduinoGenerator.workspaceToCode()
 * @param {Object} definitions - generator.definitions_ object (setup lines)
 * @returns {string}           - complete Arduino .ino sketch
 */
export function buildArduinoCode(rawCode, definitions = {}) {
  if (!rawCode || rawCode.trim() === "") return "";

  const allLines = rawCode.split("\n");

  const bodyLines = [];
  for (const line of allLines) {
    if (line.trim() === "") continue;
    if (isScaffolding(line)) continue;
    bodyLines.push(line);
  }

  // Build setup() contents from definitions
  const setupLines = [];
  for (const key of Object.keys(definitions)) {
    const val = definitions[key];
    // Skip Blockly internal definitions that start with function/var
    if (val.trim().startsWith("function ") || val.trim().startsWith("var ")) {
      continue;
    }
    setupLines.push(val);
  }

  // Auto-detect pinMode needs from digitalWrite calls in the body
  // (fallback when generator.definitions_ doesn't capture them)
  const bodyText = bodyLines.join("\n");
  const pinMatches = bodyText.matchAll(/digitalWrite\((\d+),/g);
  const usedPins = new Set();
  for (const m of pinMatches) {
    usedPins.add(m[1]);
  }
  for (const pin of usedPins) {
    const pinModeCall = `  pinMode(${pin}, OUTPUT);`;
    if (!setupLines.includes(pinModeCall)) {
      setupLines.push(pinModeCall);
    }
  }

  // Assemble the sketch
  const parts = [];
  parts.push("// Auto-generated Arduino sketch by TechyGuide Blockly");
  parts.push("");

  parts.push("void setup() {");
  if (setupLines.length > 0) {
    // De-duplicate and add
    const unique = [...new Set(setupLines)];
    parts.push(...unique);
  } else {
    parts.push("  // No setup required");
  }
  parts.push("}");
  parts.push("");

  parts.push("void loop() {");
  if (bodyLines.length > 0) {
    for (const line of bodyLines) {
      parts.push("  " + line);
    }
  } else {
    parts.push("  // Add blocks to generate code");
  }
  parts.push("}");
  parts.push("");

  return parts.join("\n");
}
