// ═══════════════════════════════════════════════════════════
//  Arduino Compile Server — Express + arduino-cli
//  Listens on port 3100, accepts .ino source, returns .bin
// ═══════════════════════════════════════════════════════════
//
//  Setup:
//    npm install express cors
//    arduino-cli core install esp32:esp32
//    node compile-server.js

const express = require('express');
const cors    = require('cors');
const { exec } = require('child_process');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');

const app  = express();
const PORT = process.env.PORT || 3100;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Shared cleanup helper — never throws
function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
}

app.post('/compile', (req, res) => {
  const { code, fqbn = 'esp32:esp32:esp32' } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'No code provided' });
  }

  // Only allow esp32 boards
  if (!/^esp32:esp32:[a-z0-9_]+$/.test(fqbn)) {
    return res.status(400).json({ error: 'Invalid board FQBN' });
  }

  // Create temp dirs
  let tmpDir;
  try {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sketch-'));
  } catch (e) {
    return res.status(500).json({ error: 'Failed to create temp directory', detail: e.message });
  }

  const sketchDir = path.join(tmpDir, 'sketch');
  const buildDir  = path.join(tmpDir, 'build');

  try {
    fs.mkdirSync(sketchDir, { recursive: true });
    fs.mkdirSync(buildDir,  { recursive: true });
    fs.writeFileSync(path.join(sketchDir, 'sketch.ino'), code, 'utf8');

    const lines = code.split('\n');
    const preview = lines.slice(0, 30).join('\n');
    console.log(`[compile] fqbn=${fqbn} | lines=${lines.length}`);
    console.log(`[compile] preview:\n${preview}`);
    if (lines.length > 30) console.log('[compile] ... (truncated)');
  } catch (e) {
    cleanup(tmpDir);
    return res.status(500).json({ error: 'Failed to write sketch', detail: e.message });
  }

  const sketchFile = path.join(sketchDir, 'sketch.ino');
  const cmd = [
    'arduino-cli compile',
    `--fqbn ${fqbn}`,
    `--output-dir "${buildDir}"`,
    `"${sketchFile}"`,
  ].join(' ');

  // 5 minute timeout — first ESP32 compile builds the core cache (~3 min)
  exec(cmd, { timeout: 300000 }, (err, stdout, stderr) => {

    // ── Step 1: check compile result BEFORE touching the filesystem ──
    if (err) {
      cleanup(tmpDir);
      return res.status(400).json({
        error: 'Compilation failed',
        stdout: stdout || '',
        stderr: stderr || err.message,
      });
    }

    // ── Step 2: compile succeeded — read the binary ──
    let binFile;
    try {
      binFile = fs.readdirSync(buildDir)
        .find(f => f.endsWith('.bin') && !f.endsWith('.bootloader.bin'));
    } catch (readErr) {
      cleanup(tmpDir);
      return res.status(500).json({
        error: 'Could not read build directory after compile',
        detail: readErr.message,
        stdout: stdout || '',
        stderr: stderr || '',
      });
    }

    if (!binFile) {
      cleanup(tmpDir);
      return res.status(500).json({
        error: 'Compile succeeded but no .bin file found',
        stdout: stdout || '',
        stderr: stderr || '',
      });
    }

    // ── Step 3: read binary, THEN clean up ──
    let binary;
    try {
      binary = fs.readFileSync(path.join(buildDir, binFile));
    } catch (readErr) {
      cleanup(tmpDir);
      return res.status(500).json({
        error: 'Failed to read compiled binary',
        detail: readErr.message,
      });
    }

    cleanup(tmpDir); // cleanup only after binary is safely in memory

    res.json({
      binary: binary.toString('base64'),
      stdout: stdout || '',
      stderr: stderr || '',
    });
  });
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Catch unhandled errors so the server never crashes
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException] Server kept alive:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection] Server kept alive:', reason);
});

app.listen(PORT, () => {
  console.log(`Compile server running on http://localhost:${PORT}`);
  console.log('Prerequisites: arduino-cli installed + esp32:esp32 core');
});