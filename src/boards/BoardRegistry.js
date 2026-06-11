// ═══════════════════════════════════════════════════════════════
//  BoardRegistry — Centralized Board Pin Query System
// ═══════════════════════════════════════════════════════════════
//
//  Singleton that holds the active board definition and provides
//  pin query methods in Blockly dropdown format: [["label","value"],...]
//
//  All block definition files import from here instead of
//  maintaining their own hardcoded PIN_OPTIONS arrays.
//
//  Usage:
//    import { boardRegistry } from '../../boards/BoardRegistry';
//    const pins = boardRegistry.getDigitalPins();
//    // → [["2","2"],["4","4"],["5","5"],...]

import esp32DevKit from './esp32-devkit';

// ── Pin Capabilities Enum ────────────────────────────
export const PinCapability = Object.freeze({
  DIGITAL:    'digital',
  ANALOG:     'analog',
  PWM:        'pwm',
  TOUCH:      'touch',
  DAC:        'dac',
  INPUT_ONLY: 'inputOnly',
});

class BoardRegistry {
  constructor() {
    this._board = null;
    this._boards = new Map();

    // ── Pin dropdown caches ──────────────────────────
    // Computed once per board switch, not on every block init.
    this._cache = {
      digital: null,
      analog: null,
      pwm: null,
      touch: null,
      dac: null,
    };

    // Register built-in boards
    this.registerBoard(esp32DevKit);

    // Set default board
    this.setBoard('esp32-devkit-v1');
  }

  // ── Board Management ───────────────────────────────

  /**
   * Register a board definition.
   * @param {Object} boardDef — board definition object (must have .id)
   */
  registerBoard(boardDef) {
    if (!boardDef?.id) throw new Error('Board definition must have an id');
    this._boards.set(boardDef.id, boardDef);
  }

  /**
   * Set the active board by ID.
   * Invalidates all cached dropdown arrays.
   * @param {string} boardId
   */
  setBoard(boardId) {
    const board = this._boards.get(boardId);
    if (!board) throw new Error(`Unknown board: ${boardId}`);
    this._board = board;
    this._invalidateCache();
  }

  /**
   * Get the active board definition.
   * @returns {Object}
   */
  getBoard() {
    return this._board;
  }

  /**
   * Get the active board ID.
   * @returns {string}
   */
  getBoardId() {
    return this._board?.id || null;
  }

  /**
   * Get all registered board IDs.
   * @returns {string[]}
   */
  getAvailableBoards() {
    return Array.from(this._boards.keys());
  }

  // ── Pin Query Methods ──────────────────────────────
  //
  // Every method returns Blockly dropdown format:
  //   [["label", "value"], ["label", "value"], ...]
  //
  // Results are cached per board — computed once, reused forever.

  /**
   * General-purpose digital I/O pins.
   * @returns {string[][]}
   */
  getDigitalPins() {
    if (!this._cache.digital) {
      this._cache.digital = this._gpioToDropdown(this._board.pins.digital);
    }
    return this._cache.digital;
  }

  /**
   * ADC-capable analog input pins.
   * @returns {string[][]}
   */
  getAnalogPins() {
    if (!this._cache.analog) {
      this._cache.analog = this._gpioToDropdown(this._board.pins.analog);
    }
    return this._cache.analog;
  }

  /**
   * PWM-capable output pins.
   * @returns {string[][]}
   */
  getPwmPins() {
    if (!this._cache.pwm) {
      this._cache.pwm = this._gpioToDropdown(this._board.pins.pwm);
    }
    return this._cache.pwm;
  }

  /**
   * Capacitive touch pins with Tn labels.
   * @returns {string[][]} e.g. [["T0 (GPIO 4)","4"],["T2 (GPIO 2)","2"],...]
   */
  getTouchPins() {
    if (!this._cache.touch) {
      this._cache.touch = this._board.pins.touch.map(
        t => [`${t.label} (GPIO ${t.gpio})`, String(t.gpio)]
      );
    }
    return this._cache.touch;
  }

  /**
   * DAC output pins.
   * @returns {string[][]}
   */
  getDacPins() {
    if (!this._cache.dac) {
      this._cache.dac = this._gpioToDropdown(this._board.pins.dac);
    }
    return this._cache.dac;
  }

  /**
   * Get pins for a specific capability.
   * @param {string} capability — one of PinCapability values
   * @returns {string[][]}
   */
  getPinsForCapability(capability) {
    switch (capability) {
      case PinCapability.DIGITAL:    return this.getDigitalPins();
      case PinCapability.ANALOG:     return this.getAnalogPins();
      case PinCapability.PWM:        return this.getPwmPins();
      case PinCapability.TOUCH:      return this.getTouchPins();
      case PinCapability.DAC:        return this.getDacPins();
      case PinCapability.INPUT_ONLY: return this._gpioToDropdown(this._board.pins.inputOnly);
      default: return this.getDigitalPins();
    }
  }

  // ── Pin Validation ─────────────────────────────────

  /**
   * Check if a GPIO number supports a given capability.
   * @param {number|string} pin
   * @param {string} capability — one of PinCapability values
   * @returns {boolean}
   */
  isValidPin(pin, capability) {
    const num = Number(pin);
    const pinList = this._board.pins[capability];
    if (!pinList) return false;

    // Touch pins are objects with .gpio
    if (capability === PinCapability.TOUCH) {
      return pinList.some(t => t.gpio === num);
    }
    return pinList.includes(num);
  }

  /**
   * Check if a GPIO is reserved (flash, USB, boot).
   * @param {number|string} pin
   * @returns {boolean}
   */
  isReserved(pin) {
    return Number(pin) in this._board.reserved;
  }

  /**
   * Get the reason a pin is reserved.
   * @param {number|string} pin
   * @returns {string|null}
   */
  getReservedReason(pin) {
    return this._board.reserved[Number(pin)] || null;
  }

  /**
   * Check if a pin is input-only (no output driver).
   * @param {number|string} pin
   * @returns {boolean}
   */
  isInputOnly(pin) {
    return this._board.pins.inputOnly.includes(Number(pin));
  }

  /**
   * Get all capabilities of a specific pin.
   * @param {number|string} pin
   * @returns {string[]} — array of PinCapability values
   */
  getPinCapabilities(pin) {
    const num = Number(pin);
    const caps = [];

    if (this._board.pins.digital.includes(num))  caps.push(PinCapability.DIGITAL);
    if (this._board.pins.analog.includes(num))   caps.push(PinCapability.ANALOG);
    if (this._board.pins.pwm.includes(num))      caps.push(PinCapability.PWM);
    if (this._board.pins.dac.includes(num))       caps.push(PinCapability.DAC);
    if (this._board.pins.inputOnly.includes(num)) caps.push(PinCapability.INPUT_ONLY);
    if (this._board.pins.touch.some(t => t.gpio === num)) caps.push(PinCapability.TOUCH);

    return caps;
  }

  // ── Peripheral Queries ─────────────────────────────

  /**
   * Get I2C default pins.
   * @returns {{ sda: number, scl: number }}
   */
  getI2CPins() {
    return { ...this._board.peripherals.i2c };
  }

  /**
   * Get SPI default pins.
   * @returns {{ mosi: number, miso: number, sck: number, cs: number }}
   */
  getSPIPins() {
    return { ...this._board.peripherals.spi };
  }

  /**
   * Get UART pins by index (0, 1, 2).
   * @param {number} index
   * @returns {{ tx: number, rx: number }|null}
   */
  getUARTPins(index) {
    const key = `uart${index}`;
    return this._board.peripherals[key]
      ? { ...this._board.peripherals[key] }
      : null;
  }

  /**
   * Get upload configuration for the active board.
   * @returns {Object}
   */
  getUploadConfig() {
    return { ...this._board.upload };
  }

  /**
   * Get the Arduino CLI FQBN string.
   * @returns {string}
   */
  getFQBN() {
    return this._board.fqbn;
  }

  // ── Internal Helpers ───────────────────────────────

  /**
   * Convert an array of GPIO numbers to Blockly dropdown format.
   * @param {number[]} gpioArray
   * @returns {string[][]} [["2","2"],["4","4"],...]
   */
  _gpioToDropdown(gpioArray) {
    return gpioArray.map(pin => [String(pin), String(pin)]);
  }

  /**
   * Clear all cached dropdown arrays.
   * Called when the active board changes.
   */
  _invalidateCache() {
    this._cache.digital = null;
    this._cache.analog = null;
    this._cache.pwm = null;
    this._cache.touch = null;
    this._cache.dac = null;
  }
}

// ── Singleton Export ──────────────────────────────────
export const boardRegistry = new BoardRegistry();
