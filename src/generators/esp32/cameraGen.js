// python generator for esp32 camera blocks
import { Order } from "blockly/python";

export const forBlock = Object.create(null);

forBlock["esp32_camera_flash"] = function (block, generator) {
  const flash = block.getFieldValue("FLASH");
  const quality = block.getFieldValue("QUALITY");
  const zoom = block.getFieldValue("ZOOM");
  generator.definitions_["import_camera"] = "import camera";
  const flashVal = flash === "on" ? "True" : "False";
  const qualityMap = { high: 10, medium: 15, low: 20 };
  const q = qualityMap[quality] || 10;
  return `camera.init(0, format=camera.JPEG, fb_location=camera.PSRAM, quality=${q})\ncamera.flash(${flashVal})\n`;
};

forBlock["esp32_rotate_camera"] = function (block, generator) {
  const side = block.getFieldValue("SIDE");
  generator.definitions_["import_camera"] = "import camera";
  const flip = side === "front" ? "True" : "False";
  return `camera.flip(${flip})\n`;
};

forBlock["esp32_capture_image"] = function (block, generator) {
  generator.definitions_["import_camera"] = "import camera";
  return `_img = camera.capture()\n`;
};
