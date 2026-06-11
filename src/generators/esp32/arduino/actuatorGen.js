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
  generator.setupCode_[`pinMode_${dir1}`] = `pinMode(${dir1}, OUTPUT);`;
  generator.setupCode_[`pinMode_${dir2}`] = `pinMode(${dir2}, OUTPUT);`;
  generator.setupCode_[`pinMode_${pwm}`]  = `pinMode(${pwm}, OUTPUT);`;
  return '';
};

forBlock['esp32_set_relay'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  const state = block.getFieldValue('STATE') === '1' ? 'HIGH' : 'LOW';
  generator.setupCode_[`pinMode_${pin}`] = `pinMode(${pin}, OUTPUT);`;
  return `digitalWrite(${pin}, ${state});\n`;
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

forBlock['esp32_detach_servo'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  generator.definitions_['include_servo'] = '#include <ESP32Servo.h>';
  generator.definitions_[`decl_servo_detach_${pin}`] = `Servo servo_detach_${pin};`;
  return `servo_detach_${pin}.detach();\n`;
};

forBlock['esp32_relay_toggle'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  generator.definitions_[`decl_relay_${pin}`] = `bool _relay_${pin}_state = false;`;
  generator.setupCode_[`pinMode_${pin}`] = `pinMode(${pin}, OUTPUT);`;
  return `_relay_${pin}_state = !_relay_${pin}_state;\ndigitalWrite(${pin}, _relay_${pin}_state ? HIGH : LOW);\n`;
};

forBlock['esp32_relay_state'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  generator.definitions_[`decl_relay_${pin}`] = `bool _relay_${pin}_state = false;`;
  return [`_relay_${pin}_state`, ArduinoOrder.ATOMIC];
};

forBlock['esp32_rotate_servo'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  const from = block.getFieldValue('FROM');
  const to = block.getFieldValue('TO');
  const speed = block.getFieldValue('SPEED') || '15';
  generator.definitions_['include_servo'] = '#include <ESP32Servo.h>';
  generator.definitions_[`decl_servo_rot_${pin}`] = `Servo servo_rot_${pin};`;
  generator.sketch.func(`func_servo_rotate_${pin}`,
`void _servoRotate${pin}(int startAngle, int endAngle, int delayMs) {
  servo_rot_${pin}.attach(${pin});
  int step = (startAngle < endAngle) ? 1 : -1;
  for (int a = startAngle; a != endAngle + step; a += step) {
    servo_rot_${pin}.write(a);
    delay(delayMs);
  }
  servo_rot_${pin}.detach();
}`);
  return `_servoRotate${pin}(${from}, ${to}, ${speed});\n`;
};
