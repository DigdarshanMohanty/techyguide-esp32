// esp32 sensor blocks — ultrasonic, ir, pir, rain, ldr, dht, analog, potentiometer
import * as Blockly from "blockly/core";

const ultrasonic = {
  type: "esp32_ultrasonic",
  message0: "get ultrasonic sensor distance (cm) | trig %1 , echo %2",
  args0: [
    { type: "input_value", name: "TRIG", check: "Number" },
    { type: "input_value", name: "ECHO", check: "Number" }
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read distance in cm from an HC-SR04 ultrasonic sensor (returns -1 if no echo)"
};

const digitalSensor = {
  type: "esp32_digital_sensor",
  message0: "read digital sensor %1 at %2",
  args0: [
    { type: "field_dropdown", name: "SENSOR", options: [
      ["PIR","PIR"],["IR","IR"],["touch","TOUCH"],["vibration","VIBRATION"]
    ]},
    { type: "input_value", name: "PIN", check: "Number" }
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read a digital sensor (HIGH/LOW) at the specified pin"
};

const dhtSensor = {
  type: "esp32_dht",
  message0: "get %1 from DHT sensor at pin %2",
  args0: [
    { type: "field_dropdown", name: "READING", options: [
      ["temperature","temperature"],["humidity","humidity"]
    ]},
    { type: "input_value", name: "PIN", check: "Number" }
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read temperature or humidity from a DHT11/DHT22 sensor (returns -1 on error)"
};

const analogSensor = {
  type: "esp32_analog_sensor",
  message0: "read analog sensor %1 at %2",
  args0: [
    { type: "field_dropdown", name: "SENSOR", options: [
      ["light / photoresistor","LIGHT"],
      ["soil moisture","SOIL"],
      ["gas / MQ","GAS"],
      ["custom","CUSTOM"]
    ]},
    { type: "input_value", name: "PIN", check: "Number" }
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read analog value (0-4095) from an analog sensor"
};

const potentiometer = {
  type: "esp32_potentiometer",
  message0: "get potentiometer value at pin %1",
  args0: [
    { type: "input_value", name: "PIN", check: "Number" }
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read value from a potentiometer"
};

// ── New dedicated sensor blocks ──

const pirSensor = {
  type: "esp32_pir_sensor",
  message0: "motion detected? (PIR) at pin %1",
  args0: [
    { type: "input_value", name: "PIN", check: "Number" }
  ],
  output: "Boolean",
  colour: 0,
  tooltip: "Returns true if PIR sensor detects motion (HIGH = motion)"
};

const irSensor = {
  type: "esp32_ir_sensor",
  message0: "obstacle detected? (IR) at pin %1",
  args0: [
    { type: "input_value", name: "PIN", check: "Number" }
  ],
  output: "Boolean",
  colour: 0,
  tooltip: "Returns true if IR sensor detects an obstacle (LOW = obstacle, active-low)"
};

const rainSensor = {
  type: "esp32_rain_sensor",
  message0: "read rain sensor at pin %1 mode %2",
  args0: [
    { type: "input_value", name: "PIN", check: "Number" },
    { type: "field_dropdown", name: "MODE", options: [
      ["analog (0-4095)","ANALOG"],
      ["digital (0/1)","DIGITAL"]
    ]}
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read rain sensor. Analog: 0-4095 (lower = more rain). Digital: 0 = rain, 1 = dry."
};

const ldrSensor = {
  type: "esp32_ldr_sensor",
  message0: "read light level (LDR) at pin %1",
  args0: [
    { type: "input_value", name: "PIN", check: "Number" }
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read light intensity from LDR (0-4095, higher = more light)"
};

// ── External Hall Sensor Module ──

const hallModuleValue = {
  type: "esp32_hall_module_value",
  message0: "hall module value at pin %1",
  args0: [
    { type: "input_value", name: "PIN", check: "Number" }
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read digital value from external hall sensor module (0 = magnet, 1 = no magnet)"
};

const hallModuleDetected = {
  type: "esp32_hall_module_detected",
  message0: "magnet detected? (hall module at pin %1)",
  args0: [
    { type: "input_value", name: "PIN", check: "Number" }
  ],
  output: "Boolean",
  colour: 0,
  tooltip: "Returns true if the external hall sensor detects a magnet (active LOW)"
};

const hallModuleWait = {
  type: "esp32_hall_module_wait",
  message0: "wait for magnet at pin %1",
  args0: [
    { type: "input_value", name: "PIN", check: "Number" }
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 0,
  tooltip: "Pause execution until the hall sensor detects a magnet"
};

export const sensorBlocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  ultrasonic, digitalSensor, dhtSensor, analogSensor, potentiometer,
  pirSensor, irSensor, rainSensor, ldrSensor,
  hallModuleValue, hallModuleDetected, hallModuleWait
]);
