import { boardRegistry } from '../../boards/BoardRegistry';

/**
 * Centralized registry for all Arduino sketch sections.
 * Created fresh on every code generation pass.
 */
export class SketchRegistry {
  constructor() {
    /** @type {Set<string>} — #include and #define lines (order-preserving, unique) */
    this._includes = new Set();

    /** @type {Map<string, string>} — Global declarations (keyed for dedup) */
    this._globals = new Map();

    /** @type {Map<string, string>} — setup() body lines (keyed for dedup) */
    this._setup = new Map();

    /** @type {Map<string, string>} — Helper function definitions (keyed for dedup) */
    this._functions = new Map();

    /** @type {Map<string, string>} — Pin configuration: "pin_mode" → "pinMode(pin, MODE);" */
    this._pins = new Map();
  }

  // ── Includes ───────────────────────────────────────

  /**
   * Add a #include or #define line. Automatically deduplicated.
   * @param {string} line — e.g. '#include <WiFi.h>'
   */
  include(line) {
    this._includes.add(line.trim());
  }

  /** @returns {string[]} Ordered, deduplicated include lines */
  getIncludes() {
    return [...this._includes];
  }

  // ── Globals ────────────────────────────────────────

  /**
   * Add a global variable/object declaration.
   * Same key = same declaration (last-write-wins, prevents duplicates).
   * @param {string} key  — unique identifier, e.g. 'decl_servo1'
   * @param {string} code — e.g. 'Servo servo1;'
   */
  global(key, code) {
    this._globals.set(key, code.trim());
  }

  /** @returns {string[]} Ordered global declarations */
  getGlobals() {
    return [...this._globals.values()];
  }

  // ── Setup ──────────────────────────────────────────

  /**
   * Add initialization code for setup().
   * Same key = same code (prevents duplicates).
   * @param {string} key  — unique identifier, e.g. 'serial_begin'
   * @param {string} code — e.g. 'Serial.begin(115200);'
   */
  setup(key, code) {
    this._setup.set(key, code.trim());
  }

  /** @returns {string[]} Ordered setup lines */
  getSetup() {
    return [...this._setup.values()];
  }

  // ── Functions ──────────────────────────────────────

  /**
   * Add a helper function definition. Deduplicated by key.
   * @param {string} key  — unique identifier, e.g. 'func_read_ultrasonic'
   * @param {string} code — Full function definition
   */
  func(key, code) {
    this._functions.set(key, code);
  }

  /** @returns {string[]} Ordered function definitions */
  getFunctions() {
    return [...this._functions.values()];
  }

  // ── Pin Configuration ──────────────────────────────

  /**
   * Configure a pin mode. Automatically deduplicated per pin+mode.
   * Generates `pinMode(pin, mode);` in setup().
   * @param {string|number} pin  — Pin number
   * @param {'INPUT'|'OUTPUT'|'INPUT_PULLUP'} mode
   */
  pin(pin, mode) {
    // Validate against board definition
    if (boardRegistry.isReserved(pin)) {
      console.warn(
        `[SketchRegistry] Pin ${pin} is reserved: ${boardRegistry.getReservedReason(pin)}`
      );
    }
    if (mode === 'OUTPUT' && boardRegistry.isInputOnly(pin)) {
      console.warn(
        `[SketchRegistry] Pin ${pin} is input-only — OUTPUT mode will not work`
      );
    }

    // Key ensures same pin+mode = single pinMode call
    this._pins.set(`${pin}_${mode}`, `pinMode(${pin}, ${mode});`);
  }

  /**
   * @returns {string[]} Deduplicated pinMode() calls for setup()
   */
  getPinSetup() {
    return [...this._pins.values()];
  }
}
