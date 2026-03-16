/**
 * codeBuilder.js
 *
 * Converts raw Blockly-generated Python into clean, ESP32-ready MicroPython.
 *
 * Transformation steps:
 *  1. Strip blank / whitespace-only lines
 *  2. Split into "header" lines (import/from …) and "body" lines (everything else)
 *  3. Auto-inject `import time` if time.sleep is used but not imported
 *  4. Skip body lines that are Blockly scaffolding  (e.g. "if False:", "  pass")
 *  5. If the body has no top-level loop already → wrap in `while True:`
 *  6. Return the final string ready to paste into MicroPython raw REPL
 */

// Lines produced by Blockly that are meaningless on hardware
const SCAFFOLDING_PATTERNS = [
  /^if\s+False\s*:/,   // Blockly empty-if stub
  /^pass\s*$/,         // stub body
];

function isScaffolding(line) {
  const t = line.trim();
  return SCAFFOLDING_PATTERNS.some((re) => re.test(t));
}

function isImportLine(line) {
  const t = line.trim();
  return t.startsWith("import ") || t.startsWith("from ");
}

/**
 * Returns true if `lines` already contains a top-level loop
 * (while / for at column 0), so we don't double-wrap.
 */
function hasTopLevelLoop(lines) {
  return lines.some((l) => /^(while|for)\s/.test(l.trim()) && !l.startsWith(" "));
}

/**
 * Builds the final ESP32-ready MicroPython string from the raw
 * code string produced by `pythonGenerator.workspaceToCode(ws)`.
 *
 * @param {string} rawCode - output of pythonGenerator.workspaceToCode()
 * @returns {string}       - clean MicroPython ready to run on ESP32
 */
export function buildESP32Code(rawCode) {
  if (!rawCode || rawCode.trim() === "") return "";

  const allLines = rawCode.split("\n");

  const headerLines = [];
  const bodyLines = [];

  for (const line of allLines) {
    if (line.trim() === "") continue;        // skip blank lines
    if (isScaffolding(line)) continue;       // skip Blockly stubs
    if (isImportLine(line)) {
      // De-duplicate imports
      if (!headerLines.includes(line.trim())) {
        headerLines.push(line.trim());
      }
    } else {
      bodyLines.push(line);
    }
  }

  // Auto-inject `import time` if the body uses time.sleep
  const bodyText = bodyLines.join("\n");
  if (
    bodyText.includes("time.sleep") &&
    !headerLines.some((l) => l.includes("import time"))
  ) {
    headerLines.push("import time");
  }

  if (bodyLines.length === 0) {
    // Only imports, nothing executable — return as-is
    return headerLines.join("\n") + "\n";
  }

  // Decide whether to wrap in while True:
  if (hasTopLevelLoop(bodyLines)) {
    // Body already has its own loop — just assemble
    return [...headerLines, "", ...bodyLines].join("\n") + "\n";
  }

  // Wrap body in while True: (4-space indent)
  const indented = bodyLines.map((l) => "    " + l);
  return [...headerLines, "", "while True:", ...indented].join("\n") + "\n";
}
