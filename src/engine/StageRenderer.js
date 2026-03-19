/**
 * StageRenderer — Draws sprites on a 480×360 HTML5 Canvas.
 * Uses Scratch coordinate system: center-origin, x: -240..240, y: -180..180.
 * Y-axis is inverted from canvas (positive Y = up in Scratch, down in canvas).
 */

export class StageRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 480;
    this.height = 360;
    this.sprites = [];
    this.backdrop = '#ffffff';
    this.running = false;

    // Mouse tracking (Scratch coordinates)
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;

    // Click callbacks
    this._onSpriteClick = null;
    this._onStageClick = null;

    this._initMouseTracking();
  }

  /**
   * Set the sprite list to render (from SpriteStore).
   */
  setSprites(sprites) {
    this.sprites = sprites;
  }

  /**
   * Start the render loop.
   */
  start() {
    if (this.running) return;
    this.running = true;
    this._loop();
  }

  /**
   * Stop the render loop.
   */
  stop() {
    this.running = false;
  }

  /**
   * One render frame.
   */
  _loop() {
    if (!this.running) return;
    this.render();
    requestAnimationFrame(() => this._loop());
  }

  /**
   * Render all sprites onto the canvas.
   */
  render() {
    const ctx = this.ctx;

    // ── Clear & draw backdrop ──
    ctx.fillStyle = this.backdrop;
    ctx.fillRect(0, 0, this.width, this.height);

    // ── Draw pen trails ──
    for (const sprite of this.sprites) {
      for (const trail of sprite.penTrails) {
        const p1 = this._toCanvas(trail.x1, trail.y1);
        const p2 = this._toCanvas(trail.x2, trail.y2);
        ctx.strokeStyle = trail.color;
        ctx.lineWidth = trail.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // ── Draw sprites in z-order ──
    for (const sprite of this.sprites) {
      if (!sprite.visible) continue;
      this._drawSprite(sprite);
    }

    // ── Draw speech bubbles on top ──
    for (const sprite of this.sprites) {
      if (!sprite.visible) continue;
      this._drawBubble(sprite);
    }
  }

  /**
   * Draw a single sprite.
   */
  _drawSprite(sprite) {
    const ctx = this.ctx;
    const pos = this._toCanvas(sprite.x, sprite.y);
    const scale = sprite.size / 100;
    const img = sprite.getCostumeImage();

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(((sprite.direction - 90) * Math.PI) / 180);
    ctx.globalAlpha = sprite.opacity;

    if (img && img.complete && img.naturalWidth > 0) {
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      // Fallback: draw a colored circle
      const r = 24 * scale;
      ctx.fillStyle = '#4C97FF';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(16 * scale)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐱', 0, 0);
    }

    ctx.restore();
  }

  /**
   * Draw a speech/think bubble above a sprite.
   */
  _drawBubble(sprite) {
    if (!sprite.sayBubble) return;

    // Check expiry
    if (sprite.sayBubble.expiresAt && Date.now() > sprite.sayBubble.expiresAt) {
      sprite.clearBubble();
      return;
    }

    const ctx = this.ctx;
    const pos = this._toCanvas(sprite.x, sprite.y);
    const text = sprite.sayBubble.text;
    const isThink = sprite.sayBubble.type === 'think';

    ctx.save();
    ctx.font = '12px Inter, sans-serif';
    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const padding = 10;
    const bubbleW = textW + padding * 2;
    const bubbleH = 28;
    const bubbleX = pos.x + 20;
    const bubbleY = pos.y - 50;

    // Bubble background
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#c4c4c4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const r = 8;
    ctx.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, r);
    ctx.fill();
    ctx.stroke();

    // Tail
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#c4c4c4';
    if (isThink) {
      // Think bubble: small circles
      ctx.beginPath();
      ctx.arc(bubbleX + 8, bubbleY + bubbleH + 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bubbleX + 3, bubbleY + bubbleH + 14, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Say bubble: triangle tail
      ctx.beginPath();
      ctx.moveTo(bubbleX + 8, bubbleY + bubbleH);
      ctx.lineTo(bubbleX + 4, bubbleY + bubbleH + 10);
      ctx.lineTo(bubbleX + 18, bubbleY + bubbleH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Text
    ctx.fillStyle = '#333';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bubbleX + padding, bubbleY + bubbleH / 2);

    ctx.restore();
  }

  /**
   * Convert Scratch coordinates to canvas pixel coordinates.
   * Scratch: center is (0,0), +x right, +y up
   * Canvas: top-left is (0,0), +x right, +y down
   */
  _toCanvas(sx, sy) {
    return {
      x: 240 + sx,
      y: 180 - sy
    };
  }

  /**
   * Convert canvas pixel coordinates to Scratch coordinates.
   */
  _fromCanvas(cx, cy) {
    return {
      x: cx - 240,
      y: 180 - cy
    };
  }

  /**
   * Initialize mouse tracking on the canvas.
   */
  _initMouseTracking() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;
      const pos = this._fromCanvas(cx, cy);
      this.mouseX = Math.round(pos.x);
      this.mouseY = Math.round(pos.y);
    });

    this.canvas.addEventListener('mousedown', () => { this.mouseDown = true; });
    this.canvas.addEventListener('mouseup', () => { this.mouseDown = false; });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;

      // Check if clicking on a sprite (reverse z-order to get top sprite first)
      for (let i = this.sprites.length - 1; i >= 0; i--) {
        const sprite = this.sprites[i];
        if (!sprite.visible) continue;
        const pos = this._toCanvas(sprite.x, sprite.y);
        const r = 24 * (sprite.size / 100);
        const dx = cx - pos.x;
        const dy = cy - pos.y;
        if (dx * dx + dy * dy <= r * r) {
          if (this._onSpriteClick) this._onSpriteClick(sprite);
          return;
        }
      }

      if (this._onStageClick) this._onStageClick();
    });
  }

  onSpriteClick(callback) {
    this._onSpriteClick = callback;
  }

  onStageClick(callback) {
    this._onStageClick = callback;
  }
}
