// Arduino C++ generator for ESP32 actuator blocks
import { ArduinoOrder } from '../../arduinoGenerator';

export const forBlock = Object.create(null);

forBlock['esp32_enable_servo'] = function (block, generator) {
  const servo = block.getFieldValue('SERVO');
  const pin = block.getFieldValue('PIN');
  generator.definitions_['include_servo'] = '#include <ESP32Servo.h>';
  generator.definitions_[`decl_servo${servo}`] = `Servo servo${servo};`;
  return `servo${servo}.attach(${pin});\n`;
};

forBlock['esp32_set_servo_angle'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  const angle = block.getFieldValue('ANGLE');
  generator.definitions_['include_servo'] = '#include <ESP32Servo.h>';
  generator.definitions_['decl_servo1'] = `Servo servo1;`;
  return `servo1.write(${angle});\n`;
};

forBlock['esp32_free_motor'] = function (block, generator) {
  const motor = block.getFieldValue('MOTOR');
  return `analogWrite(motor${motor}_pwm_pin, 0);\n`;
};

forBlock['esp32_enable_motor'] = function (block, generator) {
  const motor = block.getFieldValue('MOTOR');
  const dir1 = block.getFieldValue('DIR1');
  const dir2 = block.getFieldValue('DIR2');
  const pwm = block.getFieldValue('PWM');
  generator.definitions_[`decl_motor${motor}_pins`] =
    `int motor${motor}_dir1 = ${dir1};\nint motor${motor}_dir2 = ${dir2};\nint motor${motor}_pwm_pin = ${pwm};`;
  return `pinMode(${dir1}, OUTPUT);\npinMode(${dir2}, OUTPUT);\npinMode(${pwm}, OUTPUT);\n`;
};

forBlock['esp32_set_relay'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  const state = block.getFieldValue('STATE') === '1' ? 'HIGH' : 'LOW';
  return `pinMode(${pin}, OUTPUT);\ndigitalWrite(${pin}, ${state});\n`;
};

forBlock['esp32_enable_led_control'] = function (block, generator) {
  return `// LED PWM control enabled\n`;
};

forBlock['esp32_set_led_brightness'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  const value = block.getFieldValue('VALUE');
  return `analogWrite(${pin}, ${value});\n`;
};

forBlock['esp32_pin_state_monitor'] = function (block, generator) {
  return `// Pin state monitor enabled\n`;
};
