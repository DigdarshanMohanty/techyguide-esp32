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
  const t = line.trim();
  return (
    !line.startsWith(" ") &&
    !line.startsWith("\t") &&
    /^\w+\s*=\s*(Pin|PWM|ADC|I2C|SPI|UART|DHT|Timer|RTC|WDT|SoftI2C)\s*\(/.test(t)
  );
}

function isVarInit(line) {
  const t = line.trim();
  return (
    !line.startsWith(" ") &&
    !line.startsWith("\t") &&
    /^\w+\s*=\s*(None|0|False|True|\[\]|\{\}|""|'')$/.test(t)
  );
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
      if (inDef) defLines.push("");   // preserve blank lines inside functions
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
      if (line.startsWith(" ") || line.startsWith("\t")) {
        defLines.push(line);
        continue;
      } else {
        // Non-indented, non-blank line — function truly ended
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
