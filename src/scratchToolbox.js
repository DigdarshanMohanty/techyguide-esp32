/**
 * Scratch-style toolbox definition.
 * Categories in Scratch 3.0 order with matching colors.
 */

export const scratchToolbox = {
  kind: 'categoryToolbox',
  contents: [
    // ── Motion ─────────────────────────────────────
    {
      kind: 'category',
      name: 'Motion',
      colour: '#4C97FF',
      contents: [
        { kind: 'block', type: 'move_steps', inputs: { STEPS: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'turn_right', inputs: { DEGREES: { shadow: { type: 'math_number', fields: { NUM: 15 } } } } },
        { kind: 'block', type: 'turn_left', inputs: { DEGREES: { shadow: { type: 'math_number', fields: { NUM: 15 } } } } },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'go_to_xy', inputs: {
          X: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
          Y: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
        }},
        { kind: 'block', type: 'glide_to_xy', inputs: {
          SECS: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
          X: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
          Y: { shadow: { type: 'math_number', fields: { NUM: 0 } } },
        }},
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'point_in_direction', inputs: { DIRECTION: { shadow: { type: 'math_number', fields: { NUM: 90 } } } } },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'change_x', inputs: { DX: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'set_x', inputs: { X: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } },
        { kind: 'block', type: 'change_y', inputs: { DY: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'set_y', inputs: { Y: { shadow: { type: 'math_number', fields: { NUM: 0 } } } } },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'x_position' },
        { kind: 'block', type: 'y_position' },
        { kind: 'block', type: 'direction_reporter' },
      ],
    },
    // ── Looks ──────────────────────────────────────
    {
      kind: 'category',
      name: 'Looks',
      colour: '#9966FF',
      contents: [
        { kind: 'block', type: 'say_for_secs', inputs: {
          MESSAGE: { shadow: { type: 'text', fields: { TEXT: 'Hello!' } } },
          SECS: { shadow: { type: 'math_number', fields: { NUM: 2 } } },
        }},
        { kind: 'block', type: 'say_block', inputs: {
          MESSAGE: { shadow: { type: 'text', fields: { TEXT: 'Hello!' } } },
        }},
        { kind: 'block', type: 'think_for_secs', inputs: {
          MESSAGE: { shadow: { type: 'text', fields: { TEXT: 'Hmm...' } } },
          SECS: { shadow: { type: 'math_number', fields: { NUM: 2 } } },
        }},
        { kind: 'block', type: 'think_block', inputs: {
          MESSAGE: { shadow: { type: 'text', fields: { TEXT: 'Hmm...' } } },
        }},
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'switch_costume', inputs: {
          COSTUME: { shadow: { type: 'text', fields: { TEXT: 'cat' } } },
        }},
        { kind: 'block', type: 'next_costume' },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'change_size', inputs: { CHANGE: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'set_size', inputs: { SIZE: { shadow: { type: 'math_number', fields: { NUM: 100 } } } } },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'show_block' },
        { kind: 'block', type: 'hide_block' },
      ],
    },
    // ── Events ─────────────────────────────────────
    {
      kind: 'category',
      name: 'Events',
      colour: '#FFBF00',
      contents: [
        { kind: 'block', type: 'when_flag_clicked' },
        { kind: 'block', type: 'when_key_pressed' },
        { kind: 'block', type: 'when_sprite_clicked' },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'broadcast_block', inputs: {
          MESSAGE: { shadow: { type: 'text', fields: { TEXT: 'message1' } } },
        }},
        { kind: 'block', type: 'broadcast_and_wait', inputs: {
          MESSAGE: { shadow: { type: 'text', fields: { TEXT: 'message1' } } },
        }},
        { kind: 'block', type: 'when_receive' },
      ],
    },
    // ── Control ────────────────────────────────────
    {
      kind: 'category',
      name: 'Control',
      colour: '#FFAB19',
      contents: [
        { kind: 'block', type: 'wait_seconds', inputs: { DURATION: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'repeat_block', inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 10 } } } } },
        { kind: 'block', type: 'forever_block' },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'if_block' },
        { kind: 'block', type: 'if_else_block' },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'stop_all' },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'create_clone' },
        { kind: 'block', type: 'when_clone_starts' },
        { kind: 'block', type: 'delete_clone' },
      ],
    },
    // ── Sensing ────────────────────────────────────
    {
      kind: 'category',
      name: 'Sensing',
      colour: '#5CB1D6',
      contents: [
        { kind: 'block', type: 'touching' },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'ask_and_wait', inputs: {
          QUESTION: { shadow: { type: 'text', fields: { TEXT: "What's your name?" } } },
        }},
        { kind: 'block', type: 'answer_block' },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'key_pressed' },
        { kind: 'block', type: 'mouse_x' },
        { kind: 'block', type: 'mouse_y' },
      ],
    },
    // ── Operators (reuse built-in math/logic) ──────
    {
      kind: 'category',
      name: 'Operators',
      colour: '#59C059',
      contents: [
        { kind: 'block', type: 'math_arithmetic', inputs: {
          A: { shadow: { type: 'math_number', fields: { NUM: '' } } },
          B: { shadow: { type: 'math_number', fields: { NUM: '' } } },
        }},
        { kind: 'block', type: 'math_random_int', inputs: {
          FROM: { shadow: { type: 'math_number', fields: { NUM: 1 } } },
          TO: { shadow: { type: 'math_number', fields: { NUM: 10 } } },
        }},
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_operation' },
        { kind: 'block', type: 'logic_negate' },
        { kind: 'sep', gap: '20' },
        { kind: 'block', type: 'text_join' },
        { kind: 'block', type: 'text_length', inputs: {
          VALUE: { shadow: { type: 'text', fields: { TEXT: 'apple' } } },
        }},
        { kind: 'block', type: 'text', fields: { TEXT: 'hello' } },
        { kind: 'block', type: 'math_number', fields: { NUM: 0 } },
        { kind: 'block', type: 'math_modulo', inputs: {
          DIVIDEND: { shadow: { type: 'math_number', fields: { NUM: '' } } },
          DIVISOR: { shadow: { type: 'math_number', fields: { NUM: '' } } },
        }},
        { kind: 'block', type: 'math_round', inputs: {
          NUM: { shadow: { type: 'math_number', fields: { NUM: '' } } },
        }},
      ],
    },
    // ── Variables ──────────────────────────────────
    {
      kind: 'category',
      name: 'Variables',
      colour: '#FF8C1A',
      custom: 'VARIABLE',
    },
    // ── My Blocks (Functions) ─────────────────────
    {
      kind: 'category',
      name: 'My Blocks',
      colour: '#FF6680',
      custom: 'PROCEDURE',
    },
  ],
};
