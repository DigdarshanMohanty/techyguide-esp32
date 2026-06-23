// Arduino C++ generator for ESP32 input blocks
import { ArduinoOrder } from '../../arduinoGenerator';
import { readPin } from '../../../boards/pinHelper';

export const forBlock = Object.create(null);

forBlock['esp32_tactile_switch'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '4');
  generator.registerPin(pin, 'INPUT_PULLUP');
  return [`(digitalRead(${pin}) == LOW)`, ArduinoOrder.EQUALITY];
};

forBlock['esp32_slide_switch'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '4');
  const pos = block.getFieldValue('POS');
  const val = pos === 'LEFT' ? 'LOW' : 'HIGH';
  generator.registerPin(pin, 'INPUT');
  return [`(digitalRead(${pin}) == ${val})`, ArduinoOrder.EQUALITY];
};

forBlock['esp32_wait_until_pressed'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '4');
  generator.registerPin(pin, 'INPUT_PULLUP');
  return `while (digitalRead(${pin}) == HIGH) { delay(10); }\n`;
};

forBlock['esp32_when_switch_pressed'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '4');
  const branch = generator.statementToCode(block, 'DO') || '';
  generator.registerPin(pin, 'INPUT_PULLUP');
  return `if (digitalRead(${pin}) == LOW) {\n${branch}  delay(200);\n}\n`;
};

forBlock['esp32_slide_switch_is_on'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '4');
  generator.registerPin(pin, 'INPUT');
  return [`(digitalRead(${pin}) == LOW)`, ArduinoOrder.EQUALITY];
};

forBlock['esp32_slide_switch_is_off'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '4');
  generator.registerPin(pin, 'INPUT');
  return [`(digitalRead(${pin}) == HIGH)`, ArduinoOrder.EQUALITY];
};
