/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { colour } from "blockly/blocks";

/*
This toolbox contains nearly every single built-in block that Blockly offers,
in addition to the custom block 'add_text' this sample app adds.
You probably don't need every single block, and should consider either rewriting
your toolbox from scratch, or carefully choosing whether you need each block
listed here.
*/

export const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Logic",
      categorystyle: "logic_category",
      contents: [
        {
          kind: "block",
          type: "controls_if",
        },
        {
          kind: "block",
          type: "logic_compare",
        },
        {
          kind: "block",
          type: "logic_operation",
        },
        {
          kind: "block",
          type: "logic_negate",
        },
        {
          kind: "block",
          type: "logic_boolean",
        },
        {
          kind: "block",
          type: "logic_null",
        },
        {
          kind: "block",
          type: "logic_ternary",
        },
      ],
    },
    {
      kind: "category",
      name: "Loops",
      categorystyle: "loop_category",
      contents: [
        {
          kind: "block",
          color: "#9966FF",
          type: "controls_repeat_ext",
          inputs: {
            TIMES: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 10,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "controls_whileUntil",
        },
        {
          kind: "block",
          type: "controls_for",
          inputs: {
            FROM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 1,
                },
              },
            },
            TO: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 10,
                },
              },
            },
            BY: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 1,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "controls_forEach",
        },
        {
          kind: "block",
          type: "controls_flow_statements",
        },
      ],
    },
    {
      kind: "category",
      name: "Math",
      categorystyle: "math_category",
      contents: [
        {
          kind: "block",
          type: "math_number",
          fields: {
            NUM: 123,
          },
        },
        {
          kind: "block",
          type: "math_arithmetic",
          inputs: {
            A: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 1,
                },
              },
            },
            B: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 1,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_single",
          inputs: {
            NUM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 9,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_trig",
          inputs: {
            NUM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 45,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_constant",
        },
        {
          kind: "block",
          type: "math_number_property",
          inputs: {
            NUMBER_TO_CHECK: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 0,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_round",
          fields: {
            OP: "ROUND",
          },
          inputs: {
            NUM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 3.1,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_on_list",
          fields: {
            OP: "SUM",
          },
        },
        {
          kind: "block",
          type: "math_modulo",
          inputs: {
            DIVIDEND: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 64,
                },
              },
            },
            DIVISOR: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 10,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_constrain",
          inputs: {
            VALUE: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 50,
                },
              },
            },
            LOW: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 1,
                },
              },
            },
            HIGH: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 100,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_random_int",
          inputs: {
            FROM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 1,
                },
              },
            },
            TO: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 100,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "math_random_float",
        },
        {
          kind: "block",
          type: "math_atan2",
          inputs: {
            X: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 1,
                },
              },
            },
            Y: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 1,
                },
              },
            },
          },
        },
      ],
    },
    {
      kind: "category",
      name: "Text",
      categorystyle: "text_category",
      contents: [
        {
          kind: "block",
          type: "text",
        },
        {
          kind: "block",
          type: "text_join",
        },
        {
          kind: "block",
          type: "text_append",
          inputs: {
            TEXT: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_length",
          inputs: {
            VALUE: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_isEmpty",
          inputs: {
            VALUE: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_indexOf",
          inputs: {
            VALUE: {
              block: {
                type: "variables_get",
              },
            },
            FIND: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_charAt",
          inputs: {
            VALUE: {
              block: {
                type: "variables_get",
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_getSubstring",
          inputs: {
            STRING: {
              block: {
                type: "variables_get",
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_changeCase",
          inputs: {
            TEXT: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_trim",
          inputs: {
            TEXT: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_count",
          inputs: {
            SUB: {
              shadow: {
                type: "text",
              },
            },
            TEXT: {
              shadow: {
                type: "text",
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_replace",
          inputs: {
            FROM: {
              shadow: {
                type: "text",
              },
            },
            TO: {
              shadow: {
                type: "text",
              },
            },
            TEXT: {
              shadow: {
                type: "text",
              },
            },
          },
        },
        {
          kind: "block",
          type: "text_reverse",
          inputs: {
            TEXT: {
              shadow: {
                type: "text",
              },
            },
          },
        },
        {
          kind: "block",
          type: "add_text",
          inputs: {
            TEXT: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: "abc",
                },
              },
            },
          },
        },
      ],
    },
    {
      kind: "category",
      name: "Lists",
      categorystyle: "list_category",
      contents: [
        {
          kind: "block",
          type: "lists_create_with",
        },
        {
          kind: "block",
          type: "lists_repeat",
          inputs: {
            NUM: {
              shadow: {
                type: "math_number",
                fields: {
                  NUM: 5,
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "lists_length",
        },
        {
          kind: "block",
          type: "lists_isEmpty",
        },
        {
          kind: "block",
          type: "lists_indexOf",
          inputs: {
            VALUE: {
              block: {
                type: "variables_get",
              },
            },
          },
        },
        {
          kind: "block",
          type: "lists_getIndex",
          inputs: {
            VALUE: {
              block: {
                type: "variables_get",
              },
            },
          },
        },
        {
          kind: "block",
          type: "lists_setIndex",
          inputs: {
            LIST: {
              block: {
                type: "variables_get",
              },
            },
          },
        },
        {
          kind: "block",
          type: "lists_getSublist",
          inputs: {
            LIST: {
              block: {
                type: "variables_get",
              },
            },
          },
        },
        {
          kind: "block",
          type: "lists_split",
          inputs: {
            DELIM: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: ",",
                },
              },
            },
          },
        },
        {
          kind: "block",
          type: "lists_sort",
        },
        {
          kind: "block",
          type: "lists_reverse",
        },
      ],
    },
    {
      kind: "sep",
    },
    {
      kind: "category",
      name:'ESP32',
      categorystyle: "esp32_category",
      contents: [
        // ── ESP32 Core ──
        { kind: "label", text: "ESP32" },
        { kind: "block", type: "esp32_when_starts" },
        { kind: "block", type: "esp32_read_digital_pin" },
        { kind: "block", type: "esp32_read_analog_pin" },
        { kind: "block", type: "esp32_set_digital_pin" },
        { kind: "block", type: "esp32_set_pwm_pin" },
        { kind: "block", type: "esp32_get_touch_pin" },
        { kind: "block", type: "esp32_get_hall_sensor" },
        { kind: "block", type: "esp32_get_bt_mac" },
        { kind: "block", type: "esp32_map_value" },

        // ── Existing blocks ──
        { kind: "label", text: "General" },
        { kind: "block", type: "print_block" },
        { kind: "block", type: "add_text" },
        { kind: "block", type: "wait_block" },
        { kind: "block", type: "digital_write" },

        // ── Actuators ──
        { kind: "label", text: "Actuators" },
        { kind: "block", type: "esp32_enable_servo" },
        { kind: "block", type: "esp32_set_servo_angle" },
        { kind: "block", type: "esp32_free_motor" },
        { kind: "block", type: "esp32_enable_motor" },
        { kind: "block", type: "esp32_set_relay" },
        { kind: "block", type: "esp32_enable_led_control" },
        { kind: "block", type: "esp32_set_led_brightness" },
        { kind: "block", type: "esp32_pin_state_monitor" },

        // ── Sensors ──
        { kind: "label", text: "Sensors" },
        { kind: "block", type: "esp32_ultrasonic" },
        { kind: "block", type: "esp32_digital_sensor" },
        { kind: "block", type: "esp32_dht" },
        { kind: "block", type: "esp32_analog_sensor" },
        { kind: "block", type: "esp32_potentiometer" },

        // ── Inputs Module ──
        { kind: "label", text: "Inputs Module" },
        { kind: "block", type: "esp32_tactile_switch" },
        { kind: "block", type: "esp32_slide_switch" },

        // ── Communication ──
        { kind: "label", text: "Communication" },
        { kind: "block", type: "esp32_bt_serial_baud" },
        { kind: "block", type: "esp32_set_serial_pins" },
        { kind: "block", type: "esp32_bt_configure" },
        { kind: "block", type: "esp32_set_serial_baud" },
        { kind: "block", type: "esp32_serial_available" },
        { kind: "block", type: "esp32_serial_read" },
        { kind: "block", type: "esp32_serial_read_number" },
        { kind: "block", type: "esp32_serial_read_string" },
        { kind: "block", type: "esp32_serial_write" },

        // ── Bluetooth ──
        { kind: "label", text: "Bluetooth" },
        { kind: "block", type: "esp32_bt_data_available" },
        { kind: "block", type: "esp32_bt_read" },
        { kind: "block", type: "esp32_bt_send" },

        // ── Terminal Module ──
        { kind: "label", text: "Terminal Module" },
        { kind: "block", type: "esp32_terminal_data" },
        { kind: "block", type: "esp32_terminal_number" },
        { kind: "block", type: "esp32_terminal_send" },

        // ── Notification & Music ──
        { kind: "label", text: "Notification & Music" },
        { kind: "block", type: "esp32_send_notification" },
        { kind: "block", type: "esp32_clear_notification" },
        { kind: "block", type: "esp32_play_music" },
        { kind: "block", type: "esp32_stop_music" },

        // ── Camera Module ──
        { kind: "label", text: "Camera Module" },
        { kind: "block", type: "esp32_camera_flash" },
        { kind: "block", type: "esp32_rotate_camera" },
        { kind: "block", type: "esp32_capture_image" },

        // ── IoT / Data Logger ──
        { kind: "label", text: "IoT Module" },
        { kind: "block", type: "esp32_create_file" },
        { kind: "block", type: "esp32_log_data" },
        { kind: "block", type: "esp32_stop_logger" },

        // ── Dabble / Gamepad ──
        { kind: "label", text: "Dabble" },
        { kind: "block", type: "esp32_dabble_set_bt" },
        { kind: "block", type: "esp32_dabble_refresh" },
        { kind: "block", type: "esp32_gamepad_pressed" },
        { kind: "block", type: "esp32_gamepad_angle" },
        { kind: "block", type: "esp32_phone_sensor" },
        { kind: "block", type: "esp32_color_detector_grid" },
        { kind: "block", type: "esp32_color_detector_value" },
      ]
    },
    {
      kind: "category",
      name: "Variables",
      categorystyle: "variable_category",
      custom: "VARIABLE",
    },
    {
      kind: "category",
      name: "Functions",
      categorystyle: "procedure_category",
      custom: "PROCEDURE",
    },
  ],
};
