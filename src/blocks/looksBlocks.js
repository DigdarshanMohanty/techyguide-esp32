/**
 * Scratch-style Looks blocks for Blockly.
 */

export const looksBlocks = {};

looksBlocks['say_for_secs'] = {
  init: function() {
    this.jsonInit({
      type: 'say_for_secs',
      message0: 'say %1 for %2 seconds',
      args0: [
        { type: 'input_value', name: 'MESSAGE' },
        { type: 'input_value', name: 'SECS', check: 'Number' },
      ],
      previousStatement: null, nextStatement: null, colour: '#9966FF',
      tooltip: 'Say a message for a time',
    });
  }
};

looksBlocks['say_block'] = {
  init: function() {
    this.jsonInit({
      type: 'say_block',
      message0: 'say %1',
      args0: [{ type: 'input_value', name: 'MESSAGE' }],
      previousStatement: null, nextStatement: null, colour: '#9966FF',
      tooltip: 'Say a message',
    });
  }
};

looksBlocks['think_for_secs'] = {
  init: function() {
    this.jsonInit({
      type: 'think_for_secs',
      message0: 'think %1 for %2 seconds',
      args0: [
        { type: 'input_value', name: 'MESSAGE' },
        { type: 'input_value', name: 'SECS', check: 'Number' },
      ],
      previousStatement: null, nextStatement: null, colour: '#9966FF',
    });
  }
};

looksBlocks['think_block'] = {
  init: function() {
    this.jsonInit({
      type: 'think_block',
      message0: 'think %1',
      args0: [{ type: 'input_value', name: 'MESSAGE' }],
      previousStatement: null, nextStatement: null, colour: '#9966FF',
    });
  }
};

looksBlocks['switch_costume'] = {
  init: function() {
    this.jsonInit({
      type: 'switch_costume',
      message0: 'switch costume to %1',
      args0: [{ type: 'input_value', name: 'COSTUME' }],
      previousStatement: null, nextStatement: null, colour: '#9966FF',
    });
  }
};

looksBlocks['next_costume'] = {
  init: function() {
    this.jsonInit({
      type: 'next_costume',
      message0: 'next costume',
      previousStatement: null, nextStatement: null, colour: '#9966FF',
    });
  }
};

looksBlocks['change_size'] = {
  init: function() {
    this.jsonInit({
      type: 'change_size',
      message0: 'change size by %1',
      args0: [{ type: 'input_value', name: 'CHANGE', check: 'Number' }],
      previousStatement: null, nextStatement: null, colour: '#9966FF',
    });
  }
};

looksBlocks['set_size'] = {
  init: function() {
    this.jsonInit({
      type: 'set_size',
      message0: 'set size to %1 %%',
      args0: [{ type: 'input_value', name: 'SIZE', check: 'Number' }],
      previousStatement: null, nextStatement: null, colour: '#9966FF',
    });
  }
};

looksBlocks['show_block'] = {
  init: function() {
    this.jsonInit({
      type: 'show_block',
      message0: 'show',
      previousStatement: null, nextStatement: null, colour: '#9966FF',
    });
  }
};

looksBlocks['hide_block'] = {
  init: function() {
    this.jsonInit({
      type: 'hide_block',
      message0: 'hide',
      previousStatement: null, nextStatement: null, colour: '#9966FF',
    });
  }
};
