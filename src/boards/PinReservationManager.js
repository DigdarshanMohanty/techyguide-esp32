// ═══════════════════════════════════════════════════════════════
//  PinReservationManager — Runtime Pin Conflict Tracker
// ═══════════════════════════════════════════════════════════════
//
//  Watches the Blockly workspace for pin usage and tracks which
//  blocks are using which GPIO pins. Detects conflicts when the
//  same pin is used for incompatible purposes (e.g., input + output).
//
//  Integrates with validateWorkspace.js to surface pin conflicts
//  as warnings during code generation and upload.
//
//  Usage:
//    import { pinReservationManager } from '../../boards/PinReservationManager';
//    pinReservationManager.scanWorkspace(workspace);
//    const conflicts = pinReservationManager.getConflicts();

import { boardRegistry } from './BoardRegistry';

// ── Pin Usage Categories ────────────────────────────
export const PinUsage = Object.freeze({
  DIGITAL_IN:   'DIGITAL_IN',
  DIGITAL_OUT:  'DIGITAL_OUT',
  ANALOG_IN:    'ANALOG_IN',
  PWM_OUT:      'PWM_OUT',
  SERVO:        'SERVO',
  MOTOR_DIR:    'MOTOR_DIR',
  MOTOR_PWM:    'MOTOR_PWM',
  RELAY:        'RELAY',
  I2C_SDA:      'I2C_SDA',
  I2C_SCL:      'I2C_SCL',
  SENSOR:       'SENSOR',
  TOUCH:        'TOUCH',
  LED:          'LED',
});

// ── Block → Usage Mapping ───────────────────────────
// Maps block types to { fields: [...], usage: PinUsage }
const BLOCK_PIN_MAP = {
  // OUTPUT blocks
  esp32_set_digital_pin:    { fields: ['PIN'], usage: PinUsage.DIGITAL_OUT },
  esp32_set_pwm_pin:        { fields: ['PIN'], usage: PinUsage.PWM_OUT },
  esp32_enable_servo:       { fields: ['PIN'], usage: PinUsage.SERVO },
  esp32_set_servo_angle:    { fields: ['PIN'], usage: PinUsage.SERVO },
  esp32_rotate_servo:       { fields: ['PIN'], usage: PinUsage.SERVO },
  esp32_detach_servo:       { fields: ['PIN'], usage: PinUsage.SERVO },
  esp32_enable_motor:       { fields: ['DIR1', 'DIR2'], usage: PinUsage.MOTOR_DIR, extra: [{ field: 'PWM', usage: PinUsage.MOTOR_PWM }] },
  esp32_set_relay:          { fields: ['PIN'], usage: PinUsage.RELAY },
  esp32_relay_toggle:       { fields: ['PIN'], usage: PinUsage.RELAY },
  esp32_set_led_brightness: { fields: ['PIN'], usage: PinUsage.LED },

  // L298N — all 6 pins are outputs
  esp32_l298n_init:         { fields: ['IN1', 'IN2', 'ENA', 'IN3', 'IN4', 'ENB'], usage: PinUsage.MOTOR_DIR },

  // INPUT blocks
  esp32_read_digital_pin:   { fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_read_analog_pin:    { fields: ['PIN'], usage: PinUsage.ANALOG_IN },
  esp32_get_touch_pin:      { fields: ['PIN'], usage: PinUsage.TOUCH },
  esp32_ultrasonic:         { fields: ['TRIG'], usage: PinUsage.DIGITAL_OUT, extra: [{ field: 'ECHO', usage: PinUsage.DIGITAL_IN }] },
  esp32_digital_sensor:     { fields: ['PIN'], usage: PinUsage.SENSOR },
  esp32_dht:                { fields: ['PIN'], usage: PinUsage.SENSOR },
  esp32_analog_sensor:      { fields: ['PIN'], usage: PinUsage.ANALOG_IN },
  esp32_potentiometer:      { fields: ['PIN'], usage: PinUsage.ANALOG_IN },
  esp32_pir_sensor:         { fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_ir_sensor:          { fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_rain_sensor:        { fields: ['PIN'], usage: PinUsage.ANALOG_IN },
  esp32_ldr_sensor:         { fields: ['PIN'], usage: PinUsage.ANALOG_IN },
  esp32_hall_module_value:  { fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_hall_module_detected: { fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_hall_module_wait:   { fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_heart_init:         { fields: ['PIN'], usage: PinUsage.ANALOG_IN },
  esp32_tactile_switch:     { fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_wait_until_pressed: { fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_when_switch_pressed:{ fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_slide_switch:       { fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_slide_switch_is_on: { fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_slide_switch_is_off:{ fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
  esp32_relay_state:        { fields: ['PIN'], usage: PinUsage.DIGITAL_IN },
};

// ── Direction classification ────────────────────────
const OUTPUT_USAGES = new Set([
  PinUsage.DIGITAL_OUT, PinUsage.PWM_OUT, PinUsage.SERVO,
  PinUsage.MOTOR_DIR, PinUsage.MOTOR_PWM, PinUsage.RELAY, PinUsage.LED,
]);
const INPUT_USAGES = new Set([
  PinUsage.DIGITAL_IN, PinUsage.ANALOG_IN, PinUsage.SENSOR,
  PinUsage.TOUCH,
]);


class PinReservationManager {
  constructor() {
    // pin (string) → Map<blockId, { usage, blockType }>
    this._reservations = new Map();
  }

  /**
   * Reserve a pin for a specific block and usage.
   * @param {string} pin — GPIO number as string
   * @param {string} blockId — Blockly block ID
   * @param {string} usage — one of PinUsage values
   * @param {string} blockType — block type name (for diagnostics)
   */
  reserve(pin, blockId, usage, blockType) {
    const key = String(pin);
    if (!this._reservations.has(key)) {
      this._reservations.set(key, new Map());
    }
    this._reservations.get(key).set(blockId, { usage, blockType });
  }

  /**
   * Release all reservations for a specific block.
   * @param {string} blockId
   */
  release(blockId) {
    for (const [, blockMap] of this._reservations) {
      blockMap.delete(blockId);
    }
  }

  /**
   * Clear all reservations (call before full rescan).
   */
  clear() {
    this._reservations.clear();
  }

  /**
   * Get all pin conflicts in the current reservation state.
   * A conflict occurs when the same GPIO is used as both INPUT and OUTPUT,
   * or when a reserved pin (flash, USB) is used.
   * @returns {Array<{ pin: string, message: string, blockIds: string[] }>}
   */
  getConflicts() {
    const conflicts = [];

    for (const [pin, blockMap] of this._reservations) {
      if (blockMap.size === 0) continue;

      // Check reserved pins
      if (boardRegistry.isReserved(pin)) {
        const reason = boardRegistry.getReservedReason(pin);
        const blockIds = [...blockMap.keys()];
        conflicts.push({
          pin,
          message: `GPIO ${pin} is reserved: ${reason}`,
          blockIds,
        });
        continue;
      }

      // Check input-only pins used as output
      if (boardRegistry.isInputOnly(pin)) {
        const hasOutput = [...blockMap.values()].some(r => OUTPUT_USAGES.has(r.usage));
        if (hasOutput) {
          const blockIds = [...blockMap.keys()];
          conflicts.push({
            pin,
            message: `GPIO ${pin} is input-only and cannot be used as output`,
            blockIds,
          });
        }
      }

      // Check direction conflicts (same pin used as input AND output)
      const usages = [...blockMap.values()];
      const hasInput = usages.some(r => INPUT_USAGES.has(r.usage));
      const hasOutput = usages.some(r => OUTPUT_USAGES.has(r.usage));

      if (hasInput && hasOutput) {
        const blockIds = [...blockMap.keys()];
        const usageNames = [...new Set(usages.map(r => r.usage))].join(', ');
        conflicts.push({
          pin,
          message: `GPIO ${pin} has conflicting usages: ${usageNames}`,
          blockIds,
        });
      }
    }

    return conflicts;
  }

  /**
   * Get usage information for a specific pin.
   * @param {string} pin
   * @returns {Array<{ blockId: string, usage: string, blockType: string }>}
   */
  getPinUsage(pin) {
    const blockMap = this._reservations.get(String(pin));
    if (!blockMap) return [];
    return [...blockMap.entries()].map(([blockId, info]) => ({
      blockId,
      ...info,
    }));
  }

  /**
   * Scan an entire Blockly workspace and rebuild all reservations.
   * Call this on workspace change events.
   * @param {Blockly.Workspace} workspace
   */
  scanWorkspace(workspace) {
    this.clear();

    const allBlocks = workspace.getAllBlocks(false);

    for (const block of allBlocks) {
      const mapping = BLOCK_PIN_MAP[block.type];
      if (!mapping) continue;

      // Process primary fields
      for (const fieldName of mapping.fields) {
        const pinValue = block.getFieldValue(fieldName);
        if (pinValue !== null && pinValue !== undefined) {
          this.reserve(String(pinValue), block.id, mapping.usage, block.type);
        }
      }

      // Process extra field-usage pairs (e.g., ultrasonic TRIG vs ECHO)
      if (mapping.extra) {
        for (const { field, usage } of mapping.extra) {
          const pinValue = block.getFieldValue(field);
          if (pinValue !== null && pinValue !== undefined) {
            this.reserve(String(pinValue), block.id, usage, block.type);
          }
        }
      }
    }
  }
}

// ── Singleton Export ──────────────────────────────────
export const pinReservationManager = new PinReservationManager();
