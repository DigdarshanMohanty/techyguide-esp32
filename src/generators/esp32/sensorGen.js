// python generator for esp32 sensor blocks
import { Order } from "blockly/python";

export const forBlock = Object.create(null);

forBlock["esp32_ultrasonic"] = function (block, generator) {
  const trig = block.getFieldValue("TRIG");
  const echo = block.getFieldValue("ECHO");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  generator.definitions_["import_time"] = "import time";
  generator.definitions_["def_ultrasonic"] =
`def read_ultrasonic(trig_pin, echo_pin):
    trig = Pin(trig_pin, Pin.OUT)
    echo = Pin(echo_pin, Pin.IN)
    trig.value(0)
    time.sleep_us(2)
    trig.value(1)
    time.sleep_us(10)
    trig.value(0)
    while echo.value() == 0:
        pass
    t1 = time.ticks_us()
    while echo.value() == 1:
        pass
    t2 = time.ticks_us()
    return (t2 - t1) * 0.0343 / 2`;
  return [`read_ultrasonic(${trig}, ${echo})`, Order.FUNCTION_CALL];
};

forBlock["esp32_digital_sensor"] = function (block, generator) {
  const pin = block.getFieldValue("PIN");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  return [`Pin(${pin}, Pin.IN).value()`, Order.FUNCTION_CALL];
};

forBlock["esp32_dht"] = function (block, generator) {
  const reading = block.getFieldValue("READING");
  const pin = block.getFieldValue("PIN");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM";
  generator.definitions_["import_dht"] = "import dht";
  generator.definitions_[`def_dht_${pin}`] = `_dht_${pin} = dht.DHT11(Pin(${pin}))`;
  const method = reading === "temperature" ? "temperature" : "humidity";
  return [`(_dht_${pin}.measure() or True) and _dht_${pin}.${method}()`, Order.FUNCTION_CALL];
};

forBlock["esp32_analog_sensor"] = function (block, generator) {
  const pin = block.getFieldValue("PIN");
  generator.definitions_["import_machine"] = "from machine import Pin, PWM, ADC";
  return [`ADC(Pin(${pin})).read()`, Order.FUNCTION_CALL];
};

forBlock["esp32_potentiometer"] = function (block, generator) {
  generator.definitions_["import_machine"] = "from machine import Pin, PWM, ADC";
  
  return [`ADC(Pin(34)).read()`, Order.FUNCTION_CALL];
};
