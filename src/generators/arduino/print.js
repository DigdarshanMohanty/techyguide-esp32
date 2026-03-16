/**
 * Arduino C++ generator for the print_block.
 * Maps to Serial.println() for Arduino Uno.
 */

export const forBlock = Object.create(null);

forBlock["print_block"] = function (block, generator) {
  const text = generator.valueToCode(block, "TEXT", 0) || '""';
  generator.definitions_["serial_begin"] = "  Serial.begin(9600);";
  const code = `Serial.println(${text});\n`;
  return code;
};
