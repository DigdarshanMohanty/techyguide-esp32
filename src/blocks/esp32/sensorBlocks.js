// esp32 sensor blocks — ultrasonic, ir, temperature, light
import * as Blockly from "blockly/core";

const PIN_OPTIONS = [
  ["2","2"],["4","4"],["5","5"],["12","12"],["13","13"],
  ["14","14"],["15","15"],["16","16"],["17","17"],["18","18"],
  ["19","19"],["21","21"],["22","22"],["23","23"],["25","25"],
  ["26","26"],["27","27"],["32","32"],["33","33"]
];

const ultrasonic = {
  type: "esp32_ultrasonic",
  message0: "get ultrasonic sensor distance (cm) | trig %1 , echo %2",
  args0: [
    { type: "field_dropdown", name: "TRIG", options: PIN_OPTIONS },
    { type: "field_dropdown", name: "ECHO", options: PIN_OPTIONS }
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read distance in cm from an HC-SR04 ultrasonic sensor"
};

const digitalSensor = {
  type: "esp32_digital_sensor",
  message0: "read digital sensor %1 at %2",
  args0: [
    { type: "field_dropdown", name: "SENSOR", options: [
      ["PIR","PIR"],["IR","IR"],["touch","TOUCH"],["vibration","VIBRATION"]
    ]},
    { type: "field_dropdown", name: "PIN", options: PIN_OPTIONS }
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
    { type: "field_dropdown", name: "PIN", options: PIN_OPTIONS }
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read temperature or humidity from a DHT11/DHT22 sensor"
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
    { type: "field_dropdown", name: "PIN", options: [
      ["32","32"],["33","33"],["34","34"],["35","35"],["36","36"],["39","39"]
    ]}
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read analog value (0-4095) from an analog sensor"
};

const potentiometer = {
  type: "esp32_potentiometer",
  message0: "get potentiometer %1 value",
  args0: [
    { type: "field_dropdown", name: "POT", options: [["1","1"],["2","2"],["3","3"]] }
  ],
  output: "Number",
  colour: 0,
  tooltip: "Read value from a potentiometer"
};

export const sensorBlocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  ultrasonic, digitalSensor, dhtSensor, analogSensor, potentiometer
]);
