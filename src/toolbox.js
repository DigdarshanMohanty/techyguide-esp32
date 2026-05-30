// esp32 board-mode toolbox definition for blockly
import { colour } from "blockly/blocks";

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
        
        { kind: "label", text: "ESP32", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_when_starts" },
        { kind: "block", type: "esp32_read_digital_pin" },
        { kind: "block", type: "esp32_read_analog_pin" },
        { kind: "block", type: "esp32_set_digital_pin" },
        { kind: "block", type: "esp32_set_pwm_pin" },
        { kind: "block", type: "esp32_get_touch_pin" },
        { kind: "block", type: "esp32_get_hall_sensor" },
        { kind: "block", type: "esp32_get_bt_mac" },
        { kind: "block", type: "esp32_map_value" },

        { kind: "label", text: "General", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "print_block" },
        { kind: "block", type: "add_text" },
        { kind: "block", type: "wait_block" },
        { kind: "block", type: "digital_write" },

        { kind: "label", text: "Actuators", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_enable_servo" },
        { kind: "block", type: "esp32_set_servo_angle" },
        { kind: "block", type: "esp32_rotate_servo" },
        { kind: "block", type: "esp32_detach_servo" },
        { kind: "block", type: "esp32_free_motor" },
        { kind: "block", type: "esp32_enable_motor" },
        { kind: "block", type: "esp32_set_relay" },
        { kind: "block", type: "esp32_relay_toggle" },
        { kind: "block", type: "esp32_relay_state" },
        { kind: "block", type: "esp32_enable_led_control" },
        { kind: "block", type: "esp32_set_led_brightness" },
        { kind: "block", type: "esp32_pin_state_monitor" },

        { kind: "label", text: "Sensors", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_ultrasonic" },
        { kind: "block", type: "esp32_pir_sensor" },
        { kind: "block", type: "esp32_ir_sensor" },
        { kind: "block", type: "esp32_rain_sensor" },
        { kind: "block", type: "esp32_ldr_sensor" },
        { kind: "block", type: "esp32_dht" },
        { kind: "block", type: "esp32_digital_sensor" },
        { kind: "block", type: "esp32_analog_sensor" },
        { kind: "block", type: "esp32_potentiometer" },
        { kind: "block", type: "esp32_hall_magnet_detected" },

        { kind: "label", text: "Hall Sensor Module", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_hall_module_value" },
        { kind: "block", type: "esp32_hall_module_detected" },
        { kind: "block", type: "esp32_hall_module_wait" },

        { kind: "label", text: "MPU6050 / Gyroscope", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_mpu_init" },
        { kind: "block", type: "esp32_mpu_accel" },
        { kind: "block", type: "esp32_mpu_gyro" },
        { kind: "block", type: "esp32_mpu_temp" },
        { kind: "block", type: "esp32_mpu_tilt" },

        { kind: "label", text: "Heart Sensor", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_heart_init" },
        { kind: "block", type: "esp32_heart_value" },
        { kind: "block", type: "esp32_heart_bpm" },
        { kind: "block", type: "esp32_heart_pulse_detected" },

        { kind: "label", text: "LCD Display", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_lcd_init" },
        { kind: "block", type: "esp32_lcd_print" },
        { kind: "block", type: "esp32_lcd_clear" },
        { kind: "block", type: "esp32_lcd_set_cursor" },
        { kind: "block", type: "esp32_lcd_backlight" },

        { kind: "label", text: "L298N Motor Driver", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_l298n_init" },
        { kind: "block", type: "esp32_l298n_motor_forward" },
        { kind: "block", type: "esp32_l298n_motor_backward" },
        { kind: "block", type: "esp32_l298n_motor_speed" },
        { kind: "block", type: "esp32_l298n_stop_motor" },
        { kind: "block", type: "esp32_l298n_stop_all" },

        { kind: "label", text: "Inputs Module", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_tactile_switch" },
        { kind: "block", type: "esp32_wait_until_pressed" },
        { kind: "block", type: "esp32_when_switch_pressed" },
        { kind: "block", type: "esp32_slide_switch" },
        { kind: "block", type: "esp32_slide_switch_is_on" },
        { kind: "block", type: "esp32_slide_switch_is_off" },

        { kind: "label", text: "Communication", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_bt_serial_baud" },
        { kind: "block", type: "esp32_set_serial_pins" },
        { kind: "block", type: "esp32_bt_configure" },
        { kind: "block", type: "esp32_set_serial_baud" },
        { kind: "block", type: "esp32_serial_available" },
        { kind: "block", type: "esp32_serial_read" },
        { kind: "block", type: "esp32_serial_read_number" },
        { kind: "block", type: "esp32_serial_read_string" },
        { kind: "block", type: "esp32_serial_write" },

        { kind: "label", text: "Bluetooth", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_bt_data_available" },
        { kind: "block", type: "esp32_bt_read" },
        { kind: "block", type: "esp32_bt_send" },

        { kind: "label", text: "Terminal Module", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_terminal_data" },
        { kind: "block", type: "esp32_terminal_number" },
        { kind: "block", type: "esp32_terminal_send" },

        { kind: "label", text: "Notification & Music", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_send_notification" },
        { kind: "block", type: "esp32_clear_notification" },
        { kind: "block", type: "esp32_play_music" },
        { kind: "block", type: "esp32_stop_music" },

        { kind: "label", text: "Camera Module", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_camera_init" },
        { kind: "block", type: "esp32_camera_flash" },
        { kind: "block", type: "esp32_rotate_camera" },
        { kind: "block", type: "esp32_capture_image" },
        { kind: "block", type: "esp32_camera_save_image" },
        { kind: "block", type: "esp32_camera_stream" },
        { kind: "block", type: "esp32_camera_ready" },

        { kind: "label", text: "IoT Module", "web-class": "esp32-subcategory-label" },
        { kind: "block", type: "esp32_create_file" },
        { kind: "block", type: "esp32_log_data" },
        { kind: "block", type: "esp32_stop_logger" },

        // { kind: "label", text: "Dabble", "web-class": "esp32-subcategory-label" },
        // { kind: "block", type: "esp32_dabble_set_bt" },
        // { kind: "block", type: "esp32_dabble_refresh" },
        // { kind: "block", type: "esp32_gamepad_pressed" },
        // { kind: "block", type: "esp32_gamepad_angle" },
        // { kind: "block", type: "esp32_phone_sensor" },
        // { kind: "block", type: "esp32_color_detector_grid" },
        // { kind: "block", type: "esp32_color_detector_value" },
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
