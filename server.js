/**
 * server.js
 * Lightweight Express backend that wraps arduino-cli for
 * compiling and uploading Arduino sketches from the Blockly UI.
 *
 * Endpoints:
 *   GET  /api/arduino/ports   — list connected boards
 *   POST /api/arduino/upload  — compile & upload a sketch
 */

const express = require("express");
const cors = require("cors");
const { execSync, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = 3456;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Locate arduino-cli binary */
function findArduinoCli() {
  try {
    return execSync("which arduino-cli", { encoding: "utf-8" }).trim();
  } catch {
    // Homebrew default on Apple Silicon
    const fallback = "/opt/homebrew/bin/arduino-cli";
    if (fs.existsSync(fallback)) return fallback;
    throw new Error(
      "arduino-cli not found. Install it with: brew install arduino-cli"
    );
  }
}

const ARDUINO_CLI = findArduinoCli();
console.log(`Using arduino-cli at: ${ARDUINO_CLI}`);

// ── GET /api/arduino/ports ───────────────────────────────────────────────────

app.get("/api/arduino/ports", (req, res) => {
  try {
    const raw = execSync(`${ARDUINO_CLI} board list --format json`, {
      encoding: "utf-8",
      timeout: 10000,
    });

    const parsed = JSON.parse(raw);

    // arduino-cli v1.x wraps in { detected_ports: [...] }
    const detectedPorts = parsed.detected_ports || parsed || [];

    const ports = detectedPorts
      .filter((entry) => entry.port)
      .map((entry) => {
        const p = entry.port;
        const board =
          entry.matching_boards && entry.matching_boards.length > 0
            ? entry.matching_boards[0]
            : null;
        return {
          address: p.address || p.label,
          protocol: p.protocol || "serial",
          boardName: board ? board.name : "Unknown",
          fqbn: board ? board.fqbn : null,
        };
      });

    res.json({ ports });
  } catch (err) {
    console.error("Error listing ports:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/arduino/upload ─────────────────────────────────────────────────

app.post("/api/arduino/upload", (req, res) => {
  const { code, port, fqbn } = req.body;

  if (!code || !port) {
    return res.status(400).json({ error: "Missing 'code' or 'port' in body" });
  }

  const boardFqbn = fqbn || "arduino:avr:uno";

  // Create a temporary sketch directory
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "arduino-sketch-"));
  const sketchName = "sketch";
  const sketchDir = path.join(tmpDir, sketchName);
  const sketchFile = path.join(sketchDir, `${sketchName}.ino`);

  try {
    fs.mkdirSync(sketchDir, { recursive: true });
    fs.writeFileSync(sketchFile, code, "utf-8");

    console.log(`Compiling sketch in ${sketchDir}...`);
    console.log(`--- Sketch Code ---\n${code}\n--- End Code ---`);

    // ── Compile ──
    const compileOutput = execSync(
      `${ARDUINO_CLI} compile --fqbn ${boardFqbn} "${sketchDir}"`,
      { encoding: "utf-8", timeout: 60000, stdio: ["pipe", "pipe", "pipe"] }
    );
    console.log("Compile OK");

    // ── Upload ──
    console.log(`Uploading to ${port}...`);
    const uploadOutput = execSync(
      `${ARDUINO_CLI} upload -p "${port}" --fqbn ${boardFqbn} "${sketchDir}"`,
      { encoding: "utf-8", timeout: 30000, stdio: ["pipe", "pipe", "pipe"] }
    );
    console.log("Upload OK");

    // Clean up
    fs.rmSync(tmpDir, { recursive: true, force: true });

    res.json({
      success: true,
      output:
        "✓ Compiled and uploaded successfully!\n\n" +
        (compileOutput || "") +
        (uploadOutput || ""),
    });
  } catch (err) {
    // Clean up on error too
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}

    const msg = err.stderr || err.stdout || err.message || String(err);
    console.error("Compile/Upload error:", msg);
    res.status(500).json({ error: msg });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🔧 Arduino Upload Server running on http://localhost:${PORT}`);
  console.log(`   GET  /api/arduino/ports   — list connected boards`);
  console.log(`   POST /api/arduino/upload  — compile & upload sketch\n`);
});
