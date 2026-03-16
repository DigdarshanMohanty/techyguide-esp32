/**
 * Arduino C++ generator for the digital_write block.
 * Maps to pinMode() + digitalWrite() for Arduino Uno.
 */

export const forBlock = Object.create(null);

forBlock["digital_write"] = function (block, generator) {
  const pin = block.getFieldValue("PIN");
  const state = block.getFieldValue("STATE");

  // Register the pinMode call for setup()
  generator.definitions_[`pin_mode_${pin}`] = `  pinMode(${pin}, OUTPUT);`;

  const stateStr = state === "1" ? "HIGH" : "LOW";
  const code = `digitalWrite(${pin}, ${stateStr});\n`;
  return code;
};
