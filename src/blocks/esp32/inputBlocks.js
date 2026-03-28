import * as Blockly from "blockly/core";

const tactileSwitch = {
  type: "esp32_tactile_switch",
  message0: "is tactile switch %1 pressed?",
  args0: [{ type: "field_dropdown", name: "SWITCH", options: [["1","1"],["2","2"],["3","3"],["4","4"]] }],
  output: "Boolean", colour: 30,
  tooltip: "Check if a tactile switch is pressed"
};

const slideSwitch = {
  type: "esp32_slide_switch",
  message0: "is slide switch %1 %2 ?",
  args0: [
    { type: "field_dropdown", name: "SWITCH", options: [["1","1"],["2","2"]] },
    { type: "field_dropdown", name: "POS", options: [["left","LEFT"],["right","RIGHT"]] }
  ],
  output: "Boolean", colour: 30,
  tooltip: "Check slide switch position"
};

export const inputBlocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  tactileSwitch, slideSwitch
]);
