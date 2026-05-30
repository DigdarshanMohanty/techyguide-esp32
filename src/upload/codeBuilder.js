// transforms raw blockly python into clean esp32-ready micropython
const SCAFFOLDING_PATTERNS = [
  /^if\s+False\s*:/,
  /^pass\s*$/,
];

function isScaffolding(line) {
  const t = line.trim();
  return SCAFFOLDING_PATTERNS.some((re) => re.test(t));
}

function isImportLine(line) {
  const t = line.trim();
  return t.startsWith("import ") || t.startsWith("from ");
}

function isFunctionDef(line) {
  return /^def\s+\w+/.test(line.trim()) && !line.startsWith(" ");
}

function isPinInit(line) {
  // Matches hoisted pin/hardware setup lines and their continuations:
  // trig_18 = Pin(18, Pin.OUT)  — assignment
  // adc_34.atten(ADC.ATTN_11DB) — method call continuation
  return /^(trig_|echo_|dht_|adc_|pin_)\d+\s*[.=]/.test(line.trim()) && !line.startsWith(" ");
}

function isVarInit(line) {
  // Matches Blockly-generated variable declarations: distance = None, speed = None
  // These should be placed in the setup section, not leak above the loop
  return /^\w+\s*=\s*None\s*$/.test(line.trim()) && !line.startsWith(" ");
}

function hasTopLevelLoop(lines) {
  return lines.some((l) => /^(while|for)\s/.test(l.trim()) && !l.startsWith(" "));
}

export function buildESP32Code(rawCode) {
  if (!rawCode || rawCode.trim() === "") return "while True:\n  pass\n";

  const allLines = rawCode.split("\n");

  const headerLines = [];   // imports
  const setupLines = [];    // pin/hardware initialization (hoisted from definitions_)
  const defLines = [];      // function definitions (top-level defs + their bodies)
  const bodyLines = [];     // everything else

  let inDef = false;

  for (const line of allLines) {
    if (line.trim() === "") {
      // Blank lines end function definitions
      if (inDef) {
        inDef = false;
        defLines.push("");
      }
      continue;
    }
    if (isScaffolding(line)) continue;

    if (isImportLine(line)) {
      if (!headerLines.includes(line.trim())) {
        headerLines.push(line.trim());
      }
      continue;
    }

    if (isPinInit(line)) {
      if (!setupLines.includes(line.trim())) {
        setupLines.push(line.trim());
      }
      continue;
    }

    if (isVarInit(line)) {
      if (!setupLines.includes(line.trim())) {
        setupLines.push(line.trim());
      }
      continue;
    }

    if (isFunctionDef(line)) {
      inDef = true;
      defLines.push(line);
      continue;
    }

    if (inDef) {
      // Lines that are indented belong to the current function definition
      if (line.startsWith(" ") || line.startsWith("\t")) {
        defLines.push(line);
        continue;
      } else {
        // Non-indented line — function definition ended
        inDef = false;
      }
    }

    bodyLines.push(line);
  }

  const bodyText = bodyLines.join("\n");
  if (
    bodyText.includes("time.sleep") &&
    !headerLines.some((l) => l.includes("import time"))
  ) {
    headerLines.push("import time");
  }

  // Build the parts: imports → pin setup → function defs → body
  const parts = [...headerLines];
  if (setupLines.length > 0) {
    parts.push("", ...setupLines);
  }
  if (defLines.length > 0) {
    parts.push("", ...defLines);
  }

  if (bodyLines.length === 0) {
    return parts.join("\n") + "\n";
  }

  if (hasTopLevelLoop(bodyLines)) {
    // Body already has a loop, don't wrap
    parts.push("", ...bodyLines);
    return parts.join("\n") + "\n";
  }

  // Wrap body in while True: (using 2-space indent to match Blockly's default)
  const indented = bodyLines.map((l) => "  " + l);
  parts.push("", "while True:", ...indented);
  return parts.join("\n") + "\n";
}
