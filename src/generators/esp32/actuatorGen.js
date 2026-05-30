// python generator for esp32 actuator blocks
import { Order } from "blockly/python";

export const forBlock = Object.create(null);

forBlock["esp32_enable_servo"] = function (block, generator) {
  const servo = block.getFieldValue("SERVO");
  const pin = block.getFieldValue("PIN");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  return `servo${servo} = PWM(Pin(${pin}), freq=50)\n`;
};

forBlock["esp32_set_servo_angle"] = function (block, generator) {
  const pin = block.getFieldValue("PIN");
  const angle = block.getFieldValue("ANGLE");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  
  return `PWM(Pin(${pin}), freq=50).duty(int(${angle} / 180 * 102 + 26))\n`;
};

forBlock["esp32_free_motor"] = function (block, generator) {
  const motor = block.getFieldValue("MOTOR");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  return `motor${motor}_pwm.duty(0)\n`;
};

forBlock["esp32_enable_motor"] = function (block, generator) {
  const motor = block.getFieldValue("MOTOR");
  const dir1 = block.getFieldValue("DIR1");
  const dir2 = block.getFieldValue("DIR2");
  const pwm = block.getFieldValue("PWM");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  return `motor${motor}_dir1 = Pin(${dir1}, Pin.OUT)\nmotor${motor}_dir2 = Pin(${dir2}, Pin.OUT)\nmotor${motor}_pwm = PWM(Pin(${pwm}), freq=1000)\n`;
};

forBlock["esp32_set_relay"] = function (block, generator) {
  const pin = block.getFieldValue("PIN");
  const state = block.getFieldValue("STATE");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  return `Pin(${pin}, Pin.OUT).value(${state})\n`;
};

forBlock["esp32_enable_led_control"] = function (block, generator) {
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  return `# LED PWM control enabled\n`;
};

forBlock["esp32_set_led_brightness"] = function (block, generator) {
  const pin = block.getFieldValue("PIN");
  const value = block.getFieldValue("VALUE");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  return `PWM(Pin(${pin}), freq=1000).duty(${value})\n`;
};

forBlock["esp32_pin_state_monitor"] = function (block, generator) {
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  return `# Pin state monitor enabled\n`;
};

forBlock["esp32_detach_servo"] = function (block, generator) {
  const pin = block.getFieldValue("PIN");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  return `PWM(Pin(${pin})).deinit()\n`;
};

forBlock["esp32_rotate_servo"] = function (block, generator) {
  const pin = block.getFieldValue("PIN");
  const from = block.getFieldValue("FROM");
  const to = block.getFieldValue("TO");
  const speed = block.getFieldValue("SPEED") || "15";
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  generator.definitions_["import_time"] = "import time";
  generator.definitions_["def_servo_rotate"] = `
def _servo_rotate(pin_num, start, end, delay_ms):
  servo = PWM(Pin(pin_num), freq=50)
  step = 1 if start < end else -1
  for angle in range(start, end + step, step):
    duty = int(angle / 180 * 102 + 26)
    servo.duty(duty)
    time.sleep_ms(delay_ms)
`;
  return `_servo_rotate(${pin}, ${from}, ${to}, ${speed})\n`;
};

forBlock["esp32_relay_toggle"] = function (block, generator) {
  const pin = block.getFieldValue("PIN");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  generator.definitions_[`relay_pin_${pin}`] = `relay_${pin} = Pin(${pin}, Pin.OUT)`;
  return `relay_${pin}.value(1 - relay_${pin}.value())\n`;
};

forBlock["esp32_relay_state"] = function (block, generator) {
  const pin = block.getFieldValue("PIN");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  generator.definitions_[`relay_pin_${pin}`] = `relay_${pin} = Pin(${pin}, Pin.OUT)`;
  return [`relay_${pin}.value()`, Order.FUNCTION_CALL];
};
