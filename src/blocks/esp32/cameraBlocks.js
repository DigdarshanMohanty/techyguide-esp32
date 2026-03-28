import * as Blockly from "blockly/core";

const cameraFlash = {
  type: "esp32_camera_flash",
  message0: "set camera flash to %1 , quality to %2 & zoom to %3 %%",
  args0: [
    { type: "field_dropdown", name: "FLASH", options: [["on","on"],["off","off"]] },
    { type: "field_dropdown", name: "QUALITY", options: [["high","high"],["medium","medium"],["low","low"]] },
    { type: "field_number", name: "ZOOM", value: 0, min: 0, max: 100 }
  ],
  previousStatement: null, nextStatement: null,
  colour: 300, tooltip: "Configure camera flash and quality"
};

const rotateCamera = {
  type: "esp32_rotate_camera",
  message0: "rotate camera to %1 side",
  args0: [{ type: "field_dropdown", name: "SIDE", options: [["rear","rear"],["front","front"]] }],
  previousStatement: null, nextStatement: null,
  colour: 300, tooltip: "Switch between front and rear camera"
};

const captureImage = {
  type: "esp32_capture_image",
  message0: "Capture image on camera",
  previousStatement: null, nextStatement: null,
  colour: 300, tooltip: "Capture an image from the camera"
};

export const cameraBlocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  cameraFlash, rotateCamera, captureImage
]);
