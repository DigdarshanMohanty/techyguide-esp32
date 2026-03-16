/**
 * Arduino C++ generators for Blockly built-in blocks.
 * These replace the Python fallbacks that crash because they rely on
 * pythonGenerator internals (getDistinctName, nameDB_, etc.).
 */

export const forBlock = Object.create(null);

// ── Loops ────────────────────────────────────────────────────────────────────

/**
 * repeat N times  →  for (int i = 0; i < N; i++) { ... }
 */
forBlock["controls_repeat_ext"] = function (block, generator) {
  const times =
    generator.valueToCode(block, "TIMES", 0) || "0";
  const branch = generator.statementToCode(block, "DO") || "";
  return `for (int i = 0; i < ${times}; i++) {\n${branch}}\n`;
};

/**
 * repeat N times (fixed number field)
 */
forBlock["controls_repeat"] = function (block, generator) {
  const times = block.getFieldValue("TIMES") || "10";
  const branch = generator.statementToCode(block, "DO") || "";
  return `for (int i = 0; i < ${times}; i++) {\n${branch}}\n`;
};

/**
 * while / until loop
 */
forBlock["controls_whileUntil"] = function (block, generator) {
  const mode = block.getFieldValue("MODE"); // "WHILE" or "UNTIL"
  let cond = generator.valueToCode(block, "BOOL", 0) || "false";
  if (mode === "UNTIL") {
    cond = `!(${cond})`;
  }
  const branch = generator.statementToCode(block, "DO") || "";
  return `while (${cond}) {\n${branch}}\n`;
};

/**
 * for i from X to Y by Z
 */
forBlock["controls_for"] = function (block, generator) {
  const varName = block.getFieldValue("VAR") || "i";
  const from = generator.valueToCode(block, "FROM", 0) || "0";
  const to = generator.valueToCode(block, "TO", 0) || "10";
  const by = generator.valueToCode(block, "BY", 0) || "1";
  const branch = generator.statementToCode(block, "DO") || "";
  return (
    `for (int ${varName} = ${from}; ${varName} <= ${to}; ${varName} += ${by}) {\n` +
    branch +
    `}\n`
  );
};

/**
 * flow: break / continue
 */
forBlock["controls_flow_statements"] = function (block) {
  const flow = block.getFieldValue("FLOW");
  return flow === "BREAK" ? "break;\n" : "continue;\n";
};

// ── Logic ────────────────────────────────────────────────────────────────────

forBlock["logic_boolean"] = function (block) {
  return [block.getFieldValue("BOOL") === "TRUE" ? "true" : "false", 0];
};

forBlock["logic_negate"] = function (block, generator) {
  const arg = generator.valueToCode(block, "BOOL", 0) || "true";
  return [`!${arg}`, 0];
};

forBlock["logic_compare"] = function (block, generator) {
  const ops = {
    EQ: "==",
    NEQ: "!=",
    LT: "<",
    LTE: "<=",
    GT: ">",
    GTE: ">=",
  };
  const op = ops[block.getFieldValue("OP")] || "==";
  const a = generator.valueToCode(block, "A", 0) || "0";
  const b = generator.valueToCode(block, "B", 0) || "0";
  return [`${a} ${op} ${b}`, 0];
};

forBlock["logic_operation"] = function (block, generator) {
  const op = block.getFieldValue("OP") === "AND" ? "&&" : "||";
  const a = generator.valueToCode(block, "A", 0) || "false";
  const b = generator.valueToCode(block, "B", 0) || "false";
  return [`${a} ${op} ${b}`, 0];
};

forBlock["controls_if"] = function (block, generator) {
  let code = "";
  let n = 0;
  while (block.getInput("IF" + n)) {
    const cond = generator.valueToCode(block, "IF" + n, 0) || "false";
    const branch = generator.statementToCode(block, "DO" + n) || "";
    code += (n === 0 ? "if" : " else if") + ` (${cond}) {\n${branch}}`;
    n++;
  }
  if (block.getInput("ELSE")) {
    const elseBranch = generator.statementToCode(block, "ELSE") || "";
    code += ` else {\n${elseBranch}}`;
  }
  return code + "\n";
};

forBlock["logic_ternary"] = function (block, generator) {
  const cond = generator.valueToCode(block, "IF", 0) || "false";
  const then = generator.valueToCode(block, "THEN", 0) || "0";
  const els = generator.valueToCode(block, "ELSE", 0) || "0";
  return [`(${cond} ? ${then} : ${els})`, 0];
};

// ── Math ─────────────────────────────────────────────────────────────────────

forBlock["math_number"] = function (block) {
  const num = Number(block.getFieldValue("NUM"));
  return [String(num), 0];
};

forBlock["math_arithmetic"] = function (block, generator) {
  const ops = { ADD: "+", MINUS: "-", MULTIPLY: "*", DIVIDE: "/", POWER: null };
  const opType = block.getFieldValue("OP");
  const a = generator.valueToCode(block, "A", 0) || "0";
  const b = generator.valueToCode(block, "B", 0) || "0";
  if (opType === "POWER") {
    return [`pow(${a}, ${b})`, 0];
  }
  return [`${a} ${ops[opType]} ${b}`, 0];
};

// ── Text ─────────────────────────────────────────────────────────────────────

forBlock["text"] = function (block) {
  const text = block.getFieldValue("TEXT") || "";
  return [`"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`, 0];
};

// ── Variables ────────────────────────────────────────────────────────────────

forBlock["variables_get"] = function (block) {
  const varName = block.getFieldValue("VAR") || "x";
  return [varName, 0];
};

forBlock["variables_set"] = function (block, generator) {
  const varName = block.getFieldValue("VAR") || "x";
  const value = generator.valueToCode(block, "VALUE", 0) || "0";
  return `${varName} = ${value};\n`;
};
