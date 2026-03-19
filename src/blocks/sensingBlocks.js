/**
 * Scratch-style Sensing blocks for Blockly.
 */

export const sensingBlocks = {};

sensingBlocks['touching'] = {
  init: function() {
    this.jsonInit({
      type: 'touching',
      message0: 'touching %1 ?',
      args0: [{
        type: 'field_dropdown',
        name: 'TOUCHMENU',
        options: [
          ['mouse-pointer', '_mouse_'],
          ['edge', '_edge_'],
        ],
      }],
      output: 'Boolean',
      colour: '#5CB1D6',
      tooltip: 'Is the sprite touching something?',
    });
  }
};

sensingBlocks['mouse_x'] = {
  init: function() {
    this.jsonInit({
      type: 'mouse_x',
      message0: 'mouse x',
      output: 'Number',
      colour: '#5CB1D6',
    });
  }
};

sensingBlocks['mouse_y'] = {
  init: function() {
    this.jsonInit({
      type: 'mouse_y',
      message0: 'mouse y',
      output: 'Number',
      colour: '#5CB1D6',
    });
  }
};

sensingBlocks['key_pressed'] = {
  init: function() {
    this.jsonInit({
      type: 'key_pressed',
      message0: 'key %1 pressed?',
      args0: [{
        type: 'field_dropdown',
        name: 'KEY',
        options: [
          ['space', 'space'], ['up arrow', 'ArrowUp'], ['down arrow', 'ArrowDown'],
          ['left arrow', 'ArrowLeft'], ['right arrow', 'ArrowRight'],
          ['a', 'a'], ['w', 'w'], ['s', 's'], ['d', 'd'],
        ],
      }],
      output: 'Boolean',
      colour: '#5CB1D6',
    });
  }
};

sensingBlocks['ask_and_wait'] = {
  init: function() {
    this.jsonInit({
      type: 'ask_and_wait',
      message0: 'ask %1 and wait',
      args0: [{ type: 'input_value', name: 'QUESTION' }],
      previousStatement: null,
      nextStatement: null,
      colour: '#5CB1D6',
    });
  }
};

sensingBlocks['answer_block'] = {
  init: function() {
    this.jsonInit({
      type: 'answer_block',
      message0: 'answer',
      output: 'String',
      colour: '#5CB1D6',
    });
  }
};
