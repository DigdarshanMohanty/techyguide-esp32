// Arduino C++ generator for ESP32 sensor blocks
import { ArduinoOrder } from '../../arduinoGenerator';

export const forBlock = Object.create(null);

forBlock['esp32_ultrasonic'] = function (block, generator) {
  const trig = block.getFieldValue('TRIG');
  const echo = block.getFieldValue('ECHO');
  generator.definitions_['def_ultrasonic'] =
`long readUltrasonic(int trigPin, int echoPin) {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  digitalWrite(trigPin, LOW);
  delayMicroseconds(5);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 50000);
  if (duration == 0) return -1;
  return (long)(duration * 0.0343 / 2);
}`;
  return [`readUltrasonic(${trig}, ${echo})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_digital_sensor'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  generator.definitions_[`pin_input_${pin}`] = `// Pin ${pin} configured as INPUT`;
  return [`digitalRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_dht'] = function (block, generator) {
  const reading = block.getFieldValue('READING');
  const pin = block.getFieldValue('PIN');
  generator.definitions_['include_dht'] = '#include <DHT.h>';
  generator.definitions_[`decl_dht_${pin}`] = `DHT dht${pin}(${pin}, DHT11);`;
  generator.definitions_[`init_dht_${pin}`] = `// Call dht${pin}.begin() in setup()`;
  const method = reading === 'temperature' ? 'readTemperature()' : 'readHumidity()';
  return [`dht${pin}.${method}`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_analog_sensor'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  return [`analogRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_potentiometer'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  return [`analogRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

// ── New dedicated sensor blocks ──

forBlock['esp32_rain_sensor'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  const mode = block.getFieldValue('MODE');
  if (mode === 'DIGITAL') {
    return [`digitalRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
  } else {
    return [`analogRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
  }
};

forBlock['esp32_ldr_sensor'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  return [`analogRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_ir_sensor'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  return [`digitalRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_pir_sensor'] = function (block, generator) {
  const pin = block.getFieldValue('PIN');
  return [`digitalRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};
