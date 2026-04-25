// Arduino C++ generator for ESP32 camera blocks
import { ArduinoOrder } from '../../arduinoGenerator';

export const forBlock = Object.create(null);

forBlock['esp32_camera_flash'] = function (block, generator) {
  const flash = block.getFieldValue('FLASH');
  const quality = block.getFieldValue('QUALITY');
  generator.definitions_['include_camera'] = '#include "esp_camera.h"';
  const flashVal = flash === 'on' ? 'HIGH' : 'LOW';
  const qualityMap = { high: 10, medium: 20, low: 35 };
  const q = qualityMap[quality] || 10;
  return `// Camera init: quality=${q}, flash=${flashVal}\n// Configure camera pins before calling camera_init()\n`;
};

forBlock['esp32_rotate_camera'] = function (block, generator) {
  const side = block.getFieldValue('SIDE');
  generator.definitions_['include_camera'] = '#include "esp_camera.h"';
  const flip = side === 'front' ? '1' : '0';
  return `sensor_t* s = esp_camera_sensor_get();\ns->set_vflip(s, ${flip});\n`;
};

forBlock['esp32_capture_image'] = function (block, generator) {
  generator.definitions_['include_camera'] = '#include "esp_camera.h"';
  return `camera_fb_t* fb = esp_camera_fb_get();\nif (fb) esp_camera_fb_return(fb);\n`;
};
