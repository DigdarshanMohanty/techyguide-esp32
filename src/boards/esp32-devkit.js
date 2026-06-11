// ═══════════════════════════════════════════════════════════════
//  Board Definition — ESP32 DevKit V1 (ESP-WROOM-32)
// ═══════════════════════════════════════════════════════════════
//
//  Canonical source of truth for ALL pin capabilities on this board.
//  Every Blockly pin dropdown, every generator pin validation, and
//  every conflict check reads from this file.
//
//  Datasheet: https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf

const esp32DevKit = {
  // ── Identity ──────────────────────────────────────
  id: 'esp32-devkit-v1',
  name: 'ESP32 DevKit V1',
  mcu: 'ESP32',
  variant: 'ESP-WROOM-32',
  fqbn: 'esp32:esp32:esp32',  // Arduino CLI fully-qualified board name

  // ── Pin Capabilities ──────────────────────────────
  //
  // Each array lists GPIO numbers that support the named capability.
  // Blocks query these arrays to populate their dropdowns.
  //
  pins: {
    // General-purpose digital I/O
    // Excludes reserved/flash pins (0,1,3,6-11)
    digital: [2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],

    // ADC-capable pins (12-bit, 0-4095)
    // ADC1: GPIO 32-39 (usable with WiFi)
    // ADC2: GPIO 0,2,4,12-15,25-27 (NOT usable with WiFi)
    analog: [32, 33, 34, 35, 36, 39],

    // PWM-capable pins (all digital pins support LEDC PWM)
    pwm: [2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],

    // Capacitive touch pins (T0-T9)
    // Map: touch label → GPIO number
    touch: [
      { label: 'T0',  gpio: 4  },
      { label: 'T2',  gpio: 2  },
      { label: 'T3',  gpio: 15 },
      { label: 'T4',  gpio: 13 },
      { label: 'T5',  gpio: 12 },
      { label: 'T6',  gpio: 14 },
      { label: 'T7',  gpio: 27 },
      { label: 'T8',  gpio: 33 },
      { label: 'T9',  gpio: 32 },
    ],

    // DAC output pins (8-bit, 0-255)
    dac: [25, 26],

    // Input-only pins (no output driver)
    inputOnly: [34, 35, 36, 39],
  },

  // ── Fixed Peripheral Pins ─────────────────────────
  peripherals: {
    i2c:   { sda: 21, scl: 22 },
    spi:   { mosi: 23, miso: 19, sck: 18, cs: 5 },
    uart0: { tx: 1,  rx: 3 },    // USB serial (reserved)
    uart1: { tx: 10, rx: 9 },    // Typically on flash pins
    uart2: { tx: 17, rx: 16 },
  },

  // ── Reserved Pins ─────────────────────────────────
  //
  // These GPIOs should NOT appear in user-facing dropdowns.
  // They are either used by the flash chip, USB serial, or
  // have boot-strapping side effects.
  //
  reserved: {
    0:  'Boot button / strapping pin',
    1:  'TX0 — USB serial output',
    3:  'RX0 — USB serial input',
    6:  'Flash SPI CLK',
    7:  'Flash SPI D0',
    8:  'Flash SPI D1',
    9:  'Flash SPI D2',
    10: 'Flash SPI D3',
    11: 'Flash SPI CMD',
  },

  // ── Onboard Peripherals ───────────────────────────
  onboard: {
    led: 2,               // Built-in blue LED
    hall: 'internal',      // Built-in hall effect sensor (no GPIO)
    cameraFlash: 4,        // AI-Thinker CAM module flash LED
  },

  // ── Upload Configuration ──────────────────────────
  upload: {
    baudRate: 115200,
    flashMode: 'dio',
    flashFreq: '80m',
    flashSize: '4MB',
    partitionScheme: 'default',
  },
};

export default esp32DevKit;
