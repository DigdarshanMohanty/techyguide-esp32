// ═══════════════════════════════════════════════════════════════
//  Arduino C++ Generator — ESP32 MPU6050 (Accel/Gyro) Blocks
// ═══════════════════════════════════════════════════════════════
//
//  Block        │ Include            │ Global             │ Setup           │ Expr
//  ─────────────┼────────────────────┼────────────────────┼─────────────────┼─────
//  mpu_init     │ Wire,MPU,Sensor    │ mpu, events        │ Wire+mpu.begin  │
//  mpu_accel    │                    │                    │                 │ accel.x/y/z
//  mpu_gyro     │                    │                    │                 │ gyro.x/y/z
//  mpu_temp     │                    │                    │                 │ temp
//  mpu_tilt     │ math.h             │                    │                 │ _mpuIsTilted

import { ArduinoOrder } from '../../arduinoGenerator';
import { readPin } from '../../../boards/pinHelper';

export const forBlock = Object.create(null);

// ── MPU6050 Init ─────────────────────────────────────
forBlock['esp32_mpu_init'] = function (block, generator) {
  const sda = readPin(block, generator, 'SDA', '21');
  const scl = readPin(block, generator, 'SCL', '22');
  generator.sketch.include('#include <Wire.h>');
  generator.sketch.include('#include <Adafruit_MPU6050.h>');
  generator.sketch.include('#include <Adafruit_Sensor.h>');
  generator.sketch.global('mpu_obj', 'Adafruit_MPU6050 mpu;');
  generator.sketch.global('mpu_events',
    'sensors_event_t _mpu_accel, _mpu_gyro, _mpu_temp;');
  generator.sketch.setup('mpu_wire', `Wire.begin(${sda}, ${scl});`);
  generator.sketch.setup('mpu_init',
    'mpu.begin();\nmpu.setAccelerometerRange(MPU6050_RANGE_8_G);\nmpu.setGyroRange(MPU6050_RANGE_500_DEG);\nmpu.setFilterBandwidth(MPU6050_BAND_21_HZ);');
  generator.sketch.func('mpu_update',
`void _mpuUpdate() {
  mpu.getEvent(&_mpu_accel, &_mpu_gyro, &_mpu_temp);
}`);
  return '';
};

// ── MPU6050 Acceleration ─────────────────────────────
forBlock['esp32_mpu_accel'] = function (block, generator) {
  const axis = block.getFieldValue('AXIS');
  const member = { x: 'acceleration.x', y: 'acceleration.y', z: 'acceleration.z' }[axis];
  return [`(_mpuUpdate(), _mpu_accel.${member})`, ArduinoOrder.FUNCTION_CALL];
};

// ── MPU6050 Gyroscope ────────────────────────────────
forBlock['esp32_mpu_gyro'] = function (block, generator) {
  const axis = block.getFieldValue('AXIS');
  const member = { x: 'gyro.x', y: 'gyro.y', z: 'gyro.z' }[axis];
  return [`(_mpuUpdate(), _mpu_gyro.${member})`, ArduinoOrder.FUNCTION_CALL];
};

// ── MPU6050 Temperature ──────────────────────────────
forBlock['esp32_mpu_temp'] = function (block, generator) {
  return [`(_mpuUpdate(), _mpu_temp.temperature)`, ArduinoOrder.FUNCTION_CALL];
};

// ── MPU6050 Tilt Detection ───────────────────────────
forBlock['esp32_mpu_tilt'] = function (block, generator) {
  const threshold = block.getFieldValue('THRESHOLD') || '30';
  generator.sketch.include('#include <math.h>');
  generator.sketch.func('mpu_tilt',
`bool _mpuIsTilted(float thresholdDeg) {
  _mpuUpdate();
  float ax = _mpu_accel.acceleration.x;
  float ay = _mpu_accel.acceleration.y;
  float az = _mpu_accel.acceleration.z;
  float angle = atan2(sqrt(ax*ax + ay*ay), fabs(az)) * 180.0 / PI;
  return angle > thresholdDeg;
}`);
  return [`_mpuIsTilted(${threshold})`, ArduinoOrder.FUNCTION_CALL];
};
