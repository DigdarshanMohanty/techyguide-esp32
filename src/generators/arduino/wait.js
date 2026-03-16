/**
 * Arduino C++ generator for the wait_block.
 * Maps to delay() for Arduino Uno (milliseconds).
 */

export const forBlock = Object.create(null);

forBlock["wait_block"] = function (block, generator) {
  const seconds = block.getFieldValue("TIME");
  const ms = Number(seconds) * 1000;
  const code = `delay(${ms});\n`;
  return code;
};
