// Arduino C++ generator for ESP32 Dabble blocks
import { ArduinoOrder } from '../../arduinoGenerator';

export const forBlock = Object.create(null);

forBlock['esp32_dabble_set_bt'] = function (block, generator) {
  const name = block.getFieldValue('NAME');
  generator.definitions_['include_dabble'] = '#include <DabbleESP32.h>';
  return `Dabble.begin("${name}");\n`;
};

forBlock['esp32_dabble_refresh'] = function (block, generator) {
  generator.definitions_['include_dabble'] = '#include <DabbleESP32.h>';
  return `Dabble.processInput();\n`;
};

forBlock['esp32_gamepad_pressed'] = function (block, generator) {
  const btn = block.getFieldValue('BTN');
  generator.definitions_['include_dabble'] = '#include <DabbleESP32.h>';
  return [`GamePad.isPressed(${btn})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_gamepad_angle'] = function (block, generator) {
  const axis = block.getFieldValue('AXIS');
  generator.definitions_['include_dabble'] = '#include <DabbleESP32.h>';
  return [`GamePad.getAngle()`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_phone_sensor'] = function (block, generator) {
  const sensor = block.getFieldValue('SENSOR');
  generator.definitions_['include_dabble'] = '#include <DabbleESP32.h>';
  return [`Sensor.getAccelerometerXAxis()`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_color_detector_grid'] = function (block, generator) {
  const grid = block.getFieldValue('GRID');
  const mode = block.getFieldValue('MODE');
  const scheme = block.getFieldValue('SCHEME');
  return `// Color detector: grid=${grid}, mode=${mode}, scheme=${scheme}\n`;
};

forBlock['esp32_color_detector_value'] = function (block, generator) {
  const color = block.getFieldValue('COLOR');
  const row = block.getFieldValue('ROW');
  const col = block.getFieldValue('COL');
  return [`colorGrid[${row}][${col}]`, ArduinoOrder.FUNCTION_CALL];
};
