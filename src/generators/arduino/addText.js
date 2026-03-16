/**
 * Arduino C++ generator for the add_text block.
 * Maps to Serial.print() for Arduino Uno.
 */

export const forBlock = Object.create(null);

forBlock["add_text"] = function (block, generator) {
  const text = generator.valueToCode(block, "TEXT", 0) || '""';
  generator.definitions_["serial_begin"] = "  Serial.begin(9600);";
  const code = `Serial.print(${text});\n`;
  return code;
};
