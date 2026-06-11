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

forBlock['esp32_camera_init'] = function (block, generator) {
  const quality = block.getFieldValue('QUALITY') || '10';
  generator.definitions_['include_camera'] = '#include "esp_camera.h"';
  generator.sketch.global('camera_ready', 'bool _cam_ready = false;');
  generator.sketch.setup('camera_init',
`camera_config_t config;
config.ledc_channel = LEDC_CHANNEL_0;
config.ledc_timer   = LEDC_TIMER_0;
config.pin_d0 = 5; config.pin_d1 = 18; config.pin_d2 = 19; config.pin_d3 = 21;
config.pin_d4 = 36; config.pin_d5 = 39; config.pin_d6 = 34; config.pin_d7 = 35;
config.pin_xclk = 0; config.pin_pclk = 22; config.pin_vsync = 25; config.pin_href = 23;
config.pin_sscb_sda = 26; config.pin_sscb_scl = 27; config.pin_pwdn = 32; config.pin_reset = -1;
config.xclk_freq_hz = 20000000;
config.pixel_format = PIXFORMAT_JPEG;
config.frame_size   = FRAMESIZE_VGA;
config.jpeg_quality = ${quality};
config.fb_count = 1;
esp_err_t err = esp_camera_init(&config);
_cam_ready = (err == ESP_OK);`);
  return '';
};

forBlock['esp32_camera_ready'] = function (block, generator) {
  generator.definitions_['include_camera'] = '#include "esp_camera.h"';
  return [`_cam_ready`, ArduinoOrder.ATOMIC];
};

forBlock['esp32_camera_save_image'] = function (block, generator) {
  const filename = block.getFieldValue('FILENAME') || 'photo.jpg';
  generator.definitions_['include_camera'] = '#include "esp_camera.h"';
  return `if (_cam_ready) {\n  camera_fb_t* fb = esp_camera_fb_get();\n  if (fb) {\n    // Save to SD card as "${filename}"\n    esp_camera_fb_return(fb);\n  }\n}\n`;
};

forBlock['esp32_camera_stream'] = function (block, generator) {
  const port = block.getFieldValue('PORT') || '80';
  generator.definitions_['include_camera'] = '#include "esp_camera.h"';
  generator.definitions_['include_server'] = '#include <WebServer.h>';
  generator.sketch.global('cam_server', `WebServer _cam_server(${port});`);
  generator.sketch.setup('cam_stream_begin', `_cam_server.begin();\nSerial.println("Camera stream on port ${port}");`);
  return `_cam_server.handleClient();\n`;
};
