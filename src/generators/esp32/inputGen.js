import { Order } from "blockly/python";

export const forBlock = Object.create(null);

forBlock["esp32_tactile_switch"] = function (block, generator) {
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  return [`Pin(${block.getFieldValue("SWITCH")}, Pin.IN, Pin.PULL_UP).value() == 0`, Order.COMPARISON];
};

forBlock["esp32_slide_switch"] = function (block, generator) {
  const pos = block.getFieldValue("POS");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  const val = pos === "LEFT" ? "0" : "1";
  return [`Pin(${block.getFieldValue("SWITCH")}, Pin.IN).value() == ${val}`, Order.COMPARISON];
};
