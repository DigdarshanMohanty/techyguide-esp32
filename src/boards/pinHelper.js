// ═══════════════════════════════════════════════════════════════
//  Pin Value Helper — Backward-Compatible Pin Reading
// ═══════════════════════════════════════════════════════════════
//
//  Reads a pin value from a Blockly block, supporting both:
//    - Legacy: field_dropdown (getFieldValue)
//    - New:    input_value with shadow blocks (valueToCode)
//
//  Usage in generators:
//    import { readPin } from '../../boards/pinHelper';
//    const pin = readPin(block, generator, 'PIN', '2');

/**
 * Read a pin value from either a field or an input connection.
 *
 * Tries valueToCode first (new input_value blocks),
 * then falls back to getFieldValue (legacy field_dropdown blocks).
 *
 * @param {Blockly.Block} block — the block being generated
 * @param {Blockly.Generator} generator — the active generator
 * @param {string} fieldName — the input/field name (e.g. 'PIN', 'TRIG')
 * @param {string} fallback — default value if nothing is connected
 * @param {number} order — operator precedence (defaults to ATOMIC/highest)
 * @returns {string} — pin number as string
 */
export function readPin(block, generator, fieldName, fallback = '2', order) {
  // Determine the correct Order constant based on generator type
  const orderValue = order ?? 0; // ATOMIC = 0 in both Arduino and Python

  // Try input_value first (new: shadow or plugged block)
  const fromInput = generator.valueToCode(block, fieldName, orderValue);
  if (fromInput && fromInput.trim() !== '') {
    return fromInput.trim();
  }

  // Fall back to field_dropdown (legacy blocks / serialized workspaces)
  const fromField = block.getFieldValue(fieldName);
  if (fromField !== null && fromField !== undefined) {
    return String(fromField);
  }

  return fallback;
}
