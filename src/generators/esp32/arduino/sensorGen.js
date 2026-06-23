// Arduino C++ generator for ESP32 sensor blocks
import { ArduinoOrder } from '../../arduinoGenerator';
import { readPin } from '../../../boards/pinHelper';

export const forBlock = Object.create(null);

forBlock['esp32_ultrasonic'] = function (block, generator) {
  const trig = readPin(block, generator, 'TRIG', '5');
  const echo = readPin(block, generator, 'ECHO', '18');
  generator.registerPin(trig, 'OUTPUT');
  generator.registerPin(echo, 'INPUT');
  generator.definitions_['def_ultrasonic'] =
`long readUltrasonic(int trigPin, int echoPin) {
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
  const pin = readPin(block, generator, 'PIN', '4');
  generator.registerPin(pin, 'INPUT');
  return [`digitalRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_dht'] = function (block, generator) {
  const reading = block.getFieldValue('READING');
  const pin = readPin(block, generator, 'PIN', '4');
  generator.definitions_['include_dht'] = '#include <DHT.h>';
  generator.definitions_[`decl_dht_${pin}`] = `DHT dht${pin}(${pin}, DHT11);`;
  generator.sketch.setup(`init_dht_${pin}`, `dht${pin}.begin();`);
  const method = reading === 'temperature' ? 'readTemperature()' : 'readHumidity()';
  return [`dht${pin}.${method}`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_analog_sensor'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '34');
  return [`analogRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_potentiometer'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '34');
  return [`analogRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_rain_sensor'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '34');
  const mode = block.getFieldValue('MODE');
  if (mode === 'DIGITAL') {
    return [`digitalRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
  } else {
    return [`analogRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
  }
};

forBlock['esp32_ldr_sensor'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '34');
  return [`analogRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_ir_sensor'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '4');
  return [`digitalRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_pir_sensor'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '4');
  return [`digitalRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_hall_module_value'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '4');
  return [`digitalRead(${pin})`, ArduinoOrder.FUNCTION_CALL];
};

forBlock['esp32_hall_module_detected'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '4');
  return [`(digitalRead(${pin}) == LOW)`, ArduinoOrder.EQUALITY];
};

forBlock['esp32_hall_module_wait'] = function (block, generator) {
  const pin = readPin(block, generator, 'PIN', '4');
  generator.registerPin(pin, 'INPUT');
  return `while (digitalRead(${pin}) == HIGH) { delay(10); }\n`;
};
