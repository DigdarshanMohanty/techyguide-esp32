// MicroPython generators for Scratch control blocks
// Converts repeat, forever, if/else, wait, etc. into Python code
import { Order } from "blockly/python";

export const forBlock = Object.create(null);

// ── wait N seconds ──────────────────────────────────
forBlock["wait_seconds"] = function (block, generator) {
  const duration =
    generator.valueToCode(block, "DURATION", Order.NONE) || "1";
  generator.definitions_["import_time"] = "import time";
  return `time.sleep(${duration})\n`;
};

// ── repeat N times ──────────────────────────────────
forBlock["repeat_block"] = function (block, generator) {
  const times =
    generator.valueToCode(block, "TIMES", Order.NONE) || "10";
  const branch = generator.statementToCode(block, "SUBSTACK") || "    pass\n";
  return `for _i in range(int(${times})):\n${branch}`;
};

// ── forever ─────────────────────────────────────────
forBlock["forever_block"] = function (block, generator) {
  const branch = generator.statementToCode(block, "SUBSTACK") || "    pass\n";
  generator.definitions_["import_time"] = "import time";
  return `while True:\n${branch}`;
};

// ── if ... then ─────────────────────────────────────
forBlock["if_block"] = function (block, generator) {
  const condition =
    generator.valueToCode(block, "CONDITION", Order.NONE) || "False";
  const branch = generator.statementToCode(block, "SUBSTACK") || "    pass\n";
  return `if ${condition}:\n${branch}`;
};

// ── if ... then ... else ────────────────────────────
forBlock["if_else_block"] = function (block, generator) {
  const condition =
    generator.valueToCode(block, "CONDITION", Order.NONE) || "False";
  const ifBranch = generator.statementToCode(block, "SUBSTACK") || "    pass\n";
  const elseBranch =
    generator.statementToCode(block, "SUBSTACK2") || "    pass\n";
  return `if ${condition}:\n${ifBranch}else:\n${elseBranch}`;
};

// ── wait until ──────────────────────────────────────
forBlock["wait_until"] = function (block, generator) {
  const condition =
    generator.valueToCode(block, "CONDITION", Order.NONE) || "False";
  generator.definitions_["import_time"] = "import time";
  return `while not (${condition}):\n    time.sleep(0.05)\n`;
};

// ── repeat until ────────────────────────────────────
forBlock["repeat_until"] = function (block, generator) {
  const condition =
    generator.valueToCode(block, "CONDITION", Order.NONE) || "False";
  const branch = generator.statementToCode(block, "SUBSTACK") || "    pass\n";
  return `while not (${condition}):\n${branch}`;
};

// ── count loop (for i from X to Y step Z) ───────────
forBlock["count_loop"] = function (block, generator) {
  const varName = block.getFieldValue("VAR") || "i";
  const from_val =
    generator.valueToCode(block, "FROM", Order.NONE) || "0";
  const to_val =
    generator.valueToCode(block, "TO", Order.NONE) || "10";
  const step_val =
    generator.valueToCode(block, "STEP", Order.NONE) || "1";
  const branch = generator.statementToCode(block, "SUBSTACK") || "    pass\n";
  return `for ${varName} in range(int(${from_val}), int(${to_val}) + 1, int(${step_val})):\n${branch}`;
};

// ── stop all (stub — can't meaningfully translate) ──
forBlock["stop_all"] = function (block, generator) {
  const option = block.getFieldValue("STOP_OPTION") || "all";
  if (option === "all") {
    return "import sys\nsys.exit()\n";
  }
  return "pass  # stop this script\n";
};

// ── create clone / when clone starts / delete clone ─
// These are Scratch-only concepts; emit pass in MicroPython
forBlock["create_clone"] = function () {
  return "pass  # clone not supported on hardware\n";
};

forBlock["when_clone_starts"] = function () {
  return "";
};

forBlock["delete_clone"] = function () {
  return "pass  # clone not supported on hardware\n";
};
