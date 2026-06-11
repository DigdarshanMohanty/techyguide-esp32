// ═══════════════════════════════════════════════════════════════
//  Arduino C++ Generator — ESP32 LCD I2C Blocks
// ═══════════════════════════════════════════════════════════════
//
//  Block           │ Include             │ Global    │ Setup             │ Loop
//  ────────────────┼─────────────────────┼───────────┼───────────────────┼──────
//  lcd_init        │ Wire, LCD_I2C       │ lcd obj   │ Wire+lcd.init     │
//  lcd_print       │                     │           │                   │ lcd.print
//  lcd_clear       │                     │           │                   │ lcd.clear
//  lcd_set_cursor  │                     │           │                   │ lcd.setCursor
//  lcd_backlight   │                     │           │                   │ lcd.backlight

import { ArduinoOrder } from '../../arduinoGenerator';

export const forBlock = Object.create(null);

// ── LCD Init ─────────────────────────────────────────
forBlock['esp32_lcd_init'] = function (block, generator) {
  const sda = block.getFieldValue('SDA');
  const scl = block.getFieldValue('SCL');
  const addr = block.getFieldValue('ADDR');
  generator.sketch.include('#include <Wire.h>');
  generator.sketch.include('#include <LiquidCrystal_I2C.h>');
  generator.sketch.global('lcd_obj', `LiquidCrystal_I2C lcd(${addr}, 16, 2);`);
  generator.sketch.setup('lcd_wire', `Wire.begin(${sda}, ${scl});`);
  generator.sketch.setup('lcd_init', 'lcd.init();\nlcd.backlight();');
  return '';
};

// ── LCD Print ────────────────────────────────────────
forBlock['esp32_lcd_print'] = function (block, generator) {
  const text = generator.valueToCode(block, 'TEXT', ArduinoOrder.NONE) || '""';
  const row = block.getFieldValue('ROW');
  const col = block.getFieldValue('COL');
  return `lcd.setCursor(${col}, ${row});\nlcd.print(String(${text}));\n`;
};

// ── LCD Clear ────────────────────────────────────────
forBlock['esp32_lcd_clear'] = function (block, generator) {
  return `lcd.clear();\n`;
};

// ── LCD Set Cursor ───────────────────────────────────
forBlock['esp32_lcd_set_cursor'] = function (block, generator) {
  const row = block.getFieldValue('ROW');
  const col = block.getFieldValue('COL');
  return `lcd.setCursor(${col}, ${row});\n`;
};

// ── LCD Backlight ────────────────────────────────────
forBlock['esp32_lcd_backlight'] = function (block, generator) {
  const state = block.getFieldValue('STATE');
  return state === '1' ? `lcd.backlight();\n` : `lcd.noBacklight();\n`;
};
