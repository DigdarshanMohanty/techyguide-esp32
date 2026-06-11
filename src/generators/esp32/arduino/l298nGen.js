// ═══════════════════════════════════════════════════════════════
//  Arduino C++ Generator — ESP32 L298N Motor Driver Blocks
// ═══════════════════════════════════════════════════════════════

import { ArduinoOrder } from '../../arduinoGenerator';
import { readPin } from '../../../boards/pinHelper';

export const forBlock = Object.create(null);

// ── L298N Init ───────────────────────────────────────
forBlock['esp32_l298n_init'] = function (block, generator) {
  const in1 = readPin(block, generator, 'IN1', '12');
  const in2 = readPin(block, generator, 'IN2', '14');
  const ena = readPin(block, generator, 'ENA', '27');
  const in3 = readPin(block, generator, 'IN3', '26');
  const in4 = readPin(block, generator, 'IN4', '25');
  const enb = readPin(block, generator, 'ENB', '33');

  generator.sketch.global('l298n_pins',
    `const int L298N_IN1 = ${in1};\nconst int L298N_IN2 = ${in2};\nconst int L298N_ENA = ${ena};\n` +
    `const int L298N_IN3 = ${in3};\nconst int L298N_IN4 = ${in4};\nconst int L298N_ENB = ${enb};`);

  generator.sketch.pin(in1, 'OUTPUT');
  generator.sketch.pin(in2, 'OUTPUT');
  generator.sketch.pin(ena, 'OUTPUT');
  generator.sketch.pin(in3, 'OUTPUT');
  generator.sketch.pin(in4, 'OUTPUT');
  generator.sketch.pin(enb, 'OUTPUT');

  generator.sketch.setup('l298n_speed',
    'analogWrite(L298N_ENA, 255);\nanalogWrite(L298N_ENB, 255);');

  return '';
};

// ── Motor Forward ────────────────────────────────────
forBlock['esp32_l298n_motor_forward'] = function (block, generator) {
  const motor = block.getFieldValue('MOTOR');
  if (motor === 'A') {
    return `digitalWrite(L298N_IN1, HIGH);\ndigitalWrite(L298N_IN2, LOW);\n`;
  }
  return `digitalWrite(L298N_IN3, HIGH);\ndigitalWrite(L298N_IN4, LOW);\n`;
};

// ── Motor Backward ───────────────────────────────────
forBlock['esp32_l298n_motor_backward'] = function (block, generator) {
  const motor = block.getFieldValue('MOTOR');
  if (motor === 'A') {
    return `digitalWrite(L298N_IN1, LOW);\ndigitalWrite(L298N_IN2, HIGH);\n`;
  }
  return `digitalWrite(L298N_IN3, LOW);\ndigitalWrite(L298N_IN4, HIGH);\n`;
};

// ── Motor Speed ──────────────────────────────────────
forBlock['esp32_l298n_motor_speed'] = function (block, generator) {
  const motor = block.getFieldValue('MOTOR');
  const speed = block.getFieldValue('SPEED') || '75';
  const enPin = motor === 'A' ? 'L298N_ENA' : 'L298N_ENB';
  return `analogWrite(${enPin}, (int)(${speed} * 255 / 100));\n`;
};

// ── Stop Motor ───────────────────────────────────────
forBlock['esp32_l298n_stop_motor'] = function (block, generator) {
  const motor = block.getFieldValue('MOTOR');
  if (motor === 'A') {
    return `digitalWrite(L298N_IN1, LOW);\ndigitalWrite(L298N_IN2, LOW);\n`;
  }
  return `digitalWrite(L298N_IN3, LOW);\ndigitalWrite(L298N_IN4, LOW);\n`;
};

// ── Stop All Motors ──────────────────────────────────
forBlock['esp32_l298n_stop_all'] = function (block, generator) {
  return `digitalWrite(L298N_IN1, LOW);\ndigitalWrite(L298N_IN2, LOW);\n` +
    `digitalWrite(L298N_IN3, LOW);\ndigitalWrite(L298N_IN4, LOW);\n`;
};
