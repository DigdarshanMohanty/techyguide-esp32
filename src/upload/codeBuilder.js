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

function hasTopLevelLoop(lines) {
  return lines.some((l) => /^(while|for)\s/.test(l.trim()) && !l.startsWith(" "));
}

export function buildESP32Code(rawCode) {
  if (!rawCode || rawCode.trim() === "") return "";

  const allLines = rawCode.split("\n");

  const headerLines = [];
  const bodyLines = [];

  for (const line of allLines) {
    if (line.trim() === "") continue;        
    if (isScaffolding(line)) continue;       
    if (isImportLine(line)) {
      
      if (!headerLines.includes(line.trim())) {
        headerLines.push(line.trim());
      }
    } else {
      bodyLines.push(line);
    }
  }

  const bodyText = bodyLines.join("\n");
  if (
    bodyText.includes("time.sleep") &&
    !headerLines.some((l) => l.includes("import time"))
  ) {
    headerLines.push("import time");
  }

  if (bodyLines.length === 0) {
    
    return headerLines.join("\n") + "\n";
  }

  if (hasTopLevelLoop(bodyLines)) {
    
    return [...headerLines, "", ...bodyLines].join("\n") + "\n";
  }

  const indented = bodyLines.map((l) => "    " + l);
  return [...headerLines, "", "while True:", ...indented].join("\n") + "\n";
}
