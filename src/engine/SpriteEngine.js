/**
 * SpriteEngine — Core sprite data model for the Scratch-like environment.
 * Each sprite has position, direction, size, costumes, and visual state.
 */

let nextSpriteId = 1;

// ── Built-in Scratch Cat SVG (simplified) ─────────────
const SCRATCH_CAT_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <g fill="none" stroke="#000" stroke-width="1.5">
    <!-- Body -->
    <ellipse cx="48" cy="56" rx="28" ry="24" fill="#FFAB19"/>
    <!-- Head -->
    <circle cx="48" cy="32" r="20" fill="#FFAB19"/>
    <!-- Left ear -->
    <polygon points="32,18 24,2 38,14" fill="#FFAB19" stroke="#000"/>
    <polygon points="33,16 28,6 37,14" fill="#FF8C6B" stroke="none"/>
    <!-- Right ear -->
    <polygon points="64,18 72,2 58,14" fill="#FFAB19" stroke="#000"/>
    <polygon points="63,16 68,6 59,14" fill="#FF8C6B" stroke="none"/>
    <!-- Eyes -->
    <ellipse cx="40" cy="30" rx="4" ry="5" fill="white"/>
    <ellipse cx="56" cy="30" rx="4" ry="5" fill="white"/>
    <circle cx="41" cy="31" r="2" fill="#000"/>
    <circle cx="57" cy="31" r="2" fill="#000"/>
    <!-- Nose -->
    <ellipse cx="48" cy="36" rx="2.5" ry="1.5" fill="#FF6B6B"/>
    <!-- Mouth -->
    <path d="M44,38 Q48,42 52,38" stroke="#000" fill="none" stroke-width="1"/>
    <!-- Whiskers -->
    <line x1="20" y1="34" x2="36" y2="36" stroke="#000" stroke-width="0.8"/>
    <line x1="20" y1="38" x2="36" y2="38" stroke="#000" stroke-width="0.8"/>
    <line x1="60" y1="36" x2="76" y2="34" stroke="#000" stroke-width="0.8"/>
    <line x1="60" y1="38" x2="76" y2="38" stroke="#000" stroke-width="0.8"/>
    <!-- Feet -->
    <ellipse cx="36" cy="78" rx="8" ry="5" fill="#FFAB19"/>
    <ellipse cx="60" cy="78" rx="8" ry="5" fill="#FFAB19"/>
    <!-- Tail -->
    <path d="M72,60 Q85,50 80,38" stroke="#FFAB19" fill="none" stroke-width="5"/>
    <path d="M72,60 Q85,50 80,38" stroke="#000" fill="none" stroke-width="1.5"/>
  </g>
</svg>`)}`;

export class Sprite {
  constructor(name, options = {}) {
    this.id = nextSpriteId++;
    this.name = name || `Sprite${this.id}`;

    // ── Position & orientation (Scratch coordinate system) ──
    this.x = options.x || 0;           // center-origin: -240 to 240
    this.y = options.y || 0;           // center-origin: -180 to 180
    this.direction = options.direction || 90; // degrees, 0=up, 90=right (Scratch convention)
    this.size = options.size || 100;    // percentage, 100 = normal

    // ── Visual state ──
    this.visible = true;
    this.costumes = [];
    this.currentCostumeIndex = 0;
    this.sayBubble = null;      // { text, type: 'say'|'think', expiresAt }
    this.opacity = 1;

    // ── Pen ──
    this.penDown = false;
    this.penColor = '#4C97FF';
    this.penSize = 1;
    this.penTrails = [];  // [{x1, y1, x2, y2, color, size}]

    // ── Costume image cache ──
    this._costumeImages = new Map();
    this._loaded = false;

    // ── Workspace state (Blockly JSON) ──
    this.workspaceState = null;

    // Add default cat costume
    this.addCostume('cat', SCRATCH_CAT_SVG);
  }

  // ── Costume management ─────────────────────────────
  addCostume(name, src) {
    this.costumes.push({ name, src });
    // Preload image
    const img = new Image();
    img.src = src;
    img.onload = () => {
      this._costumeImages.set(name, img);
      this._loaded = true;
    };
    return this;
  }

  getCurrentCostume() {
    return this.costumes[this.currentCostumeIndex] || null;
  }

  getCostumeImage() {
    const costume = this.getCurrentCostume();
    if (!costume) return null;
    return this._costumeImages.get(costume.name) || null;
  }

  switchCostume(nameOrIndex) {
    if (typeof nameOrIndex === 'number') {
      this.currentCostumeIndex = ((nameOrIndex - 1) % this.costumes.length + this.costumes.length) % this.costumes.length;
    } else {
      const idx = this.costumes.findIndex(c => c.name === nameOrIndex);
      if (idx !== -1) this.currentCostumeIndex = idx;
    }
  }

  nextCostume() {
    if (this.costumes.length > 0) {
      this.currentCostumeIndex = (this.currentCostumeIndex + 1) % this.costumes.length;
    }
  }

  // ── Movement ───────────────────────────────────────
  moveSteps(steps) {
    const radians = (this.direction - 90) * (Math.PI / 180);
    const oldX = this.x;
    const oldY = this.y;
    this.x += steps * Math.cos(radians);
    this.y += steps * Math.sin(radians);
    this._clampToStage();
    if (this.penDown) {
      this.penTrails.push({
        x1: oldX, y1: oldY,
        x2: this.x, y2: this.y,
        color: this.penColor, size: this.penSize
      });
    }
  }

  goToXY(x, y) {
    const oldX = this.x;
    const oldY = this.y;
    this.x = x;
    this.y = y;
    if (this.penDown) {
      this.penTrails.push({
        x1: oldX, y1: oldY,
        x2: this.x, y2: this.y,
        color: this.penColor, size: this.penSize
      });
    }
  }

  turnRight(degrees) {
    this.direction = (this.direction + degrees) % 360;
  }

  turnLeft(degrees) {
    this.direction = (this.direction - degrees + 360) % 360;
  }

  pointInDirection(deg) {
    this.direction = deg;
  }

  changeX(dx) {
    this.x += dx;
    this._clampToStage();
  }

  changeY(dy) {
    this.y += dy;
    this._clampToStage();
  }

  setX(x) { this.x = x; this._clampToStage(); }
  setY(y) { this.y = y; this._clampToStage(); }

  _clampToStage() {
    this.x = Math.max(-240, Math.min(240, this.x));
    this.y = Math.max(-180, Math.min(180, this.y));
  }

  // ── Looks ──────────────────────────────────────────
  say(text, seconds = 0) {
    this.sayBubble = {
      text: String(text),
      type: 'say',
      expiresAt: seconds > 0 ? Date.now() + seconds * 1000 : null
    };
  }

  think(text, seconds = 0) {
    this.sayBubble = {
      text: String(text),
      type: 'think',
      expiresAt: seconds > 0 ? Date.now() + seconds * 1000 : null
    };
  }

  clearBubble() {
    this.sayBubble = null;
  }

  changeSize(amount) {
    this.size = Math.max(5, this.size + amount);
  }

  setSize(percent) {
    this.size = Math.max(5, percent);
  }

  show() { this.visible = true; }
  hide() { this.visible = false; }

  // ── Sensing ────────────────────────────────────────
  isTouchingEdge() {
    const halfW = 24 * (this.size / 100);
    const halfH = 24 * (this.size / 100);
    return (
      this.x - halfW <= -240 || this.x + halfW >= 240 ||
      this.y - halfH <= -180 || this.y + halfH >= 180
    );
  }

  distanceTo(otherSprite) {
    const dx = this.x - otherSprite.x;
    const dy = this.y - otherSprite.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ── Glide (returns a promise for async execution) ──
  glideToXY(x, y, seconds) {
    return new Promise((resolve) => {
      const startX = this.x;
      const startY = this.y;
      const startTime = Date.now();
      const duration = seconds * 1000;

      const step = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Ease in-out
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        this.x = startX + (x - startX) * eased;
        this.y = startY + (y - startY) * eased;

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          this.x = x;
          this.y = y;
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }
}

export { SCRATCH_CAT_SVG };
