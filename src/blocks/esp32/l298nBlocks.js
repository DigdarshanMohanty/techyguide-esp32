// L298N Motor Driver block definitions
import * as Blockly from "blockly/core";

const l298nInit = {
  type: "esp32_l298n_init",
  message0: "configure L298N: IN1 %1 IN2 %2 ENA %3 IN3 %4 IN4 %5 ENB %6",
  args0: [
    { type: "input_value", name: "IN1", check: "Number" },
    { type: "input_value", name: "IN2", check: "Number" },
    { type: "input_value", name: "ENA", check: "Number" },
    { type: "input_value", name: "IN3", check: "Number" },
    { type: "input_value", name: "IN4", check: "Number" },
    { type: "input_value", name: "ENB", check: "Number" }
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 30,
  tooltip: "Configure L298N motor driver pin connections for Motor A and Motor B"
};

const l298nMotorForward = {
  type: "esp32_l298n_motor_forward",
  message0: "motor %1 forward",
  args0: [
    { type: "field_dropdown", name: "MOTOR", options: [["A","A"],["B","B"]] }
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 30,
  tooltip: "Run motor forward"
};

const l298nMotorBackward = {
  type: "esp32_l298n_motor_backward",
  message0: "motor %1 backward",
  args0: [
    { type: "field_dropdown", name: "MOTOR", options: [["A","A"],["B","B"]] }
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 30,
  tooltip: "Run motor backward"
};

const l298nMotorSpeed = {
  type: "esp32_l298n_motor_speed",
  message0: "set motor %1 speed to %2 %",
  args0: [
    { type: "field_dropdown", name: "MOTOR", options: [["A","A"],["B","B"]] },
    { type: "field_number", name: "SPEED", value: 75, min: 0, max: 100 }
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 30,
  tooltip: "Set motor speed (0-100%)"
};

const l298nStopMotor = {
  type: "esp32_l298n_stop_motor",
  message0: "stop motor %1",
  args0: [
    { type: "field_dropdown", name: "MOTOR", options: [["A","A"],["B","B"]] }
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 30,
  tooltip: "Stop a specific motor"
};

const l298nStopAll = {
  type: "esp32_l298n_stop_all",
  message0: "stop all motors",
  previousStatement: null,
  nextStatement: null,
  colour: 30,
  tooltip: "Stop both motors immediately"
};

export const l298nBlocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  l298nInit, l298nMotorForward, l298nMotorBackward,
  l298nMotorSpeed, l298nStopMotor, l298nStopAll
]);
