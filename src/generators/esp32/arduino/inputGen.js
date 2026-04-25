// Arduino C++ generator for ESP32 input blocks
import { ArduinoOrder } from '../../arduinoGenerator';

export const forBlock = Object.create(null);

forBlock['esp32_tactile_switch'] = function (block, generator) {
  const pin = block.getFieldValue('SWITCH');
  return [`(digitalRead(${pin}) == LOW)`, ArduinoOrder.EQUALITY];
};

forBlock['esp32_slide_switch'] = function (block, generator) {
  const pin = block.getFieldValue('SWITCH');
  const pos = block.getFieldValue('POS');
  const val = pos === 'LEFT' ? 'LOW' : 'HIGH';
  return [`(digitalRead(${pin}) == ${val})`, ArduinoOrder.EQUALITY];
};
