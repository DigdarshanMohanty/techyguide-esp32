// ═══════════════════════════════════════════════════════════════
//  Arduino C++ Generator — ESP32 Heart/Pulse Sensor Blocks
// ═══════════════════════════════════════════════════════════════

import { ArduinoOrder } from '../../arduinoGenerator';
import { readPin } from '../../../boards/pinHelper';

export const forBlock = Object.create(null);

// ── Heart Sensor Init ────────────────────────────────
forBlock['esp32_heart_init'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '32');

  generator.sketch.global('heart_vars',
`const int HEART_PIN = ${pin};
int _heartThreshold = 2000;
unsigned long _heartLastBeat = 0;
int _heartBPM = 0;
bool _heartPulse = false;`);

  generator.sketch.func('heart_update',
`int _heartUpdate() {
  int val = analogRead(HEART_PIN);
  unsigned long now = millis();
  if (val > _heartThreshold && !_heartPulse) {
    _heartPulse = true;
    if (_heartLastBeat > 0) {
      unsigned long interval = now - _heartLastBeat;
      if (interval > 300 && interval < 2000) {
        _heartBPM = 60000 / interval;
      }
    }
    _heartLastBeat = now;
  } else if (val < _heartThreshold - 200) {
    _heartPulse = false;
  }
  return val;
}`);

  return '';
};

// ── Heart Value (raw ADC) ────────────────────────────
forBlock['esp32_heart_value'] = function (block, generator) {
  return [`_heartUpdate()`, ArduinoOrder.FUNCTION_CALL];
};

// ── Heart BPM ────────────────────────────────────────
forBlock['esp32_heart_bpm'] = function (block, generator) {
  return [`_heartBPM`, ArduinoOrder.ATOMIC];
};

// ── Pulse Detected ───────────────────────────────────
forBlock['esp32_heart_pulse_detected'] = function (block, generator) {
  return [`_heartPulse`, ArduinoOrder.ATOMIC];
};
