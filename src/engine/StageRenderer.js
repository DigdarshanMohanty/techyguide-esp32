/**
 * StageRenderer — Renders sprites on a 480×360 stage using PixiJS v8.
 * Uses Scratch coordinate system: center-origin, x: -240..240, y: -180..180.
 */

import { Application, Sprite as PixiSprite, Graphics, Text, TextStyle, Container, Texture, Assets } from 'pixi.js';
import spriteStore from './SpriteStore.js';

export class StageRenderer {
  constructor(containerEl) {
    this.containerEl = containerEl;
    this.width = 480;
    this.height = 360;
    this.sprites = [];
    this.backdrop = '#ffffff';

    // Mouse tracking (Scratch coordinates)
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;

    // Click callbacks
    this._onSpriteClick = null;
    this._onStageClick = null;

    // PixiJS state
    this.app = null;
    this._pixiSprites = new Map();       // spriteId → PIXI.Sprite
    this._penContainer = null;           // Graphics layer for pen trails
    this._spriteContainer = null;        // Container for all sprite display objects
    this._bubbleContainer = null;        // Container for speech bubbles
    this._bubbleObjects = new Map();     // spriteId → { container, bg, text, tail }
    this._penGraphics = null;
  }

  /**
   * Initialize the PixiJS application (async in v8).
   */
  async init() {
    this.app = new Application();
    await this.app.init({
      width: this.width,
      height: this.height,
      background: this.backdrop,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Mount canvas into container
    this.containerEl.appendChild(this.app.canvas);
    this.app.canvas.style.width = '100%';
    this.app.canvas.style.height = '100%';

    // Create layered containers: pen → sprites → bubbles
    this._penContainer = new Container();
    this._spriteContainer = new Container();
    this._bubbleContainer = new Container();
    this.app.stage.addChild(this._penContainer);
    this.app.stage.addChild(this._spriteContainer);
    this.app.stage.addChild(this._bubbleContainer);

    // Pen trails graphics object
    this._penGraphics = new Graphics();
    this._penContainer.addChild(this._penGraphics);

    // Mouse tracking via PixiJS events
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;

    this.app.stage.on('pointermove', (e) => {
      const pos = e.global;
      this.mouseX = Math.round(pos.x - 240);
      this.mouseY = Math.round(180 - pos.y);
    });

    this.app.stage.on('pointerdown', () => { this.mouseDown = true; });
    this.app.stage.on('pointerup', () => { this.mouseDown = false; });

    // Stage click (background only)
    this.app.stage.on('pointerdown', (e) => {
      if (e.target === this.app.stage && this._onStageClick) {
        this._onStageClick();
      }
    });

    // Start sync loop via ticker
    this.app.ticker.add(() => this._syncFrame());
  }

  /**
   * Set the sprite list to render (from SpriteStore).
   */
  setSprites(sprites) {
    this.sprites = sprites;
  }

  /**
   * Start the render loop (noop — PixiJS ticker handles this).
   */
  start() {
    // PixiJS auto-renders via its internal ticker
  }

  /**
   * Stop the render loop.
   */
  stop() {
    if (this.app) this.app.ticker.stop();
  }

  /**
   * Each frame: sync sprite data model → PIXI display objects.
   */
  _syncFrame() {
    this._syncPenTrails();
    this._syncSpriteDisplayObjects();
    this._syncBubbles();
  }

  /**
   * Sync pen trails to the pen graphics layer.
   */
  _syncPenTrails() {
    const g = this._penGraphics;
    g.clear();

    for (const sprite of this.sprites) {
      for (const trail of sprite.penTrails) {
        const p1 = this._toPixi(trail.x1, trail.y1);
        const p2 = this._toPixi(trail.x2, trail.y2);
        g.moveTo(p1.x, p1.y);
        g.lineTo(p2.x, p2.y);
        g.stroke({ width: trail.size, color: trail.color });
      }
    }
  }

  /**
   * Create / update / remove PIXI.Sprite display objects to match the data model.
   */
  _syncSpriteDisplayObjects() {
    const activeIds = new Set();

    for (let i = 0; i < this.sprites.length; i++) {
      const sprite = this.sprites[i];
      activeIds.add(sprite.id);

      let pixiSprite = this._pixiSprites.get(sprite.id);

      if (!pixiSprite) {
        // Create new PIXI.Sprite
        pixiSprite = new PixiSprite();
        pixiSprite.anchor.set(0.5);
        pixiSprite.eventMode = 'static';
        pixiSprite.cursor = 'pointer';
        pixiSprite._spriteRef = sprite;
        pixiSprite._dragging = false;

        // ── Drag & Drop ──
        pixiSprite.on('pointerdown', (e) => {
          e.stopPropagation();
          pixiSprite._dragging = true;
          pixiSprite._dragOffset = {
            x: e.global.x - pixiSprite.x,
            y: e.global.y - pixiSprite.y,
          };
          pixiSprite.alpha = 0.85;
          if (this._onSpriteClick) this._onSpriteClick(sprite);
        });

        pixiSprite.on('globalpointermove', (e) => {
          if (!pixiSprite._dragging) return;
          const newX = e.global.x - pixiSprite._dragOffset.x;
          const newY = e.global.y - pixiSprite._dragOffset.y;
          pixiSprite.x = newX;
          pixiSprite.y = newY;
          // Sync back to Scratch data model
          sprite.x = Math.round(newX - 240);
          sprite.y = Math.round(180 - newY);
          // Update sprite panel live
          spriteStore._emit('update', sprite);
        });

        const endDrag = () => {
          if (!pixiSprite._dragging) return;
          pixiSprite._dragging = false;
          pixiSprite.alpha = sprite.opacity;
          // Final update so panel shows correct X/Y
          spriteStore._emit('update', sprite);
        };
        pixiSprite.on('pointerup', endDrag);
        pixiSprite.on('pointerupoutside', endDrag);

        this._spriteContainer.addChild(pixiSprite);
        this._pixiSprites.set(sprite.id, pixiSprite);
      }

      // Update texture from costume
      const costumeImg = sprite.getCostumeImage();
      if (costumeImg && costumeImg.complete && costumeImg.naturalWidth > 0) {
        const tex = Texture.from(costumeImg);
        if (pixiSprite.texture !== tex) {
          pixiSprite.texture = tex;
        }
      }

      // Sync position (Scratch → Pixi coordinates) — skip if user is dragging
      if (!pixiSprite._dragging) {
        const pos = this._toPixi(sprite.x, sprite.y);
        pixiSprite.x = pos.x;
        pixiSprite.y = pos.y;
      }

      // Sync rotation (Scratch direction: 0=up, 90=right → Pixi radians)
      pixiSprite.rotation = ((sprite.direction - 90) * Math.PI) / 180;

      // Sync scale
      const scale = sprite.size / 100;
      pixiSprite.scale.set(scale);

      // Sync visibility & alpha
      pixiSprite.visible = sprite.visible;
      pixiSprite.alpha = sprite.opacity;

      // Z-order
      pixiSprite.zIndex = i;
    }

    // Remove display objects for sprites that no longer exist
    for (const [id, pixiSprite] of this._pixiSprites) {
      if (!activeIds.has(id)) {
        this._spriteContainer.removeChild(pixiSprite);
        pixiSprite.destroy();
        this._pixiSprites.delete(id);
      }
    }

    this._spriteContainer.sortChildren();
  }

  /**
   * Sync speech/think bubbles.
   */
  _syncBubbles() {
    const activeIds = new Set();

    for (const sprite of this.sprites) {
      if (!sprite.visible || !sprite.sayBubble) {
        // Remove bubble if it exists
        if (this._bubbleObjects.has(sprite.id)) {
          this._removeBubble(sprite.id);
        }
        continue;
      }

      // Check expiry
      if (sprite.sayBubble.expiresAt && Date.now() > sprite.sayBubble.expiresAt) {
        sprite.clearBubble();
        this._removeBubble(sprite.id);
        continue;
      }

      activeIds.add(sprite.id);
      const bubble = sprite.sayBubble;
      const pos = this._toPixi(sprite.x, sprite.y);

      let obj = this._bubbleObjects.get(sprite.id);

      if (!obj || obj._lastText !== bubble.text || obj._lastType !== bubble.type) {
        // Recreate bubble
        this._removeBubble(sprite.id);

        const style = new TextStyle({
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          fill: '#333333',
        });
        const textObj = new Text({ text: bubble.text, style });
        const padding = 10;
        const bubbleW = textObj.width + padding * 2;
        const bubbleH = 28;

        const bg = new Graphics();
        bg.roundRect(0, 0, bubbleW, bubbleH, 8);
        bg.fill('#ffffff');
        bg.stroke({ width: 1.5, color: '#c4c4c4' });

        // Tail
        const tail = new Graphics();
        if (bubble.type === 'think') {
          tail.circle(8, bubbleH + 6, 4);
          tail.fill('#ffffff');
          tail.stroke({ width: 1.5, color: '#c4c4c4' });
          tail.circle(3, bubbleH + 14, 2.5);
          tail.fill('#ffffff');
          tail.stroke({ width: 1.5, color: '#c4c4c4' });
        } else {
          tail.moveTo(8, bubbleH);
          tail.lineTo(4, bubbleH + 10);
          tail.lineTo(18, bubbleH);
          tail.closePath();
          tail.fill('#ffffff');
          tail.stroke({ width: 1.5, color: '#c4c4c4' });
        }

        textObj.x = padding;
        textObj.y = (bubbleH - textObj.height) / 2;

        const container = new Container();
        container.addChild(bg, tail, textObj);

        this._bubbleContainer.addChild(container);
        obj = { container, _lastText: bubble.text, _lastType: bubble.type };
        this._bubbleObjects.set(sprite.id, obj);
      }

      // Position bubble above sprite
      obj.container.x = pos.x + 20;
      obj.container.y = pos.y - 50;
    }

    // Clean up bubbles for deleted sprites
    for (const [id] of this._bubbleObjects) {
      if (!this.sprites.find(s => s.id === id)) {
        this._removeBubble(id);
      }
    }
  }

  _removeBubble(spriteId) {
    const obj = this._bubbleObjects.get(spriteId);
    if (obj) {
      this._bubbleContainer.removeChild(obj.container);
      obj.container.destroy({ children: true });
      this._bubbleObjects.delete(spriteId);
    }
  }

  /**
   * Convert Scratch coordinates to PixiJS pixel coordinates.
   */
  _toPixi(sx, sy) {
    return {
      x: 240 + sx,
      y: 180 - sy,
    };
  }

  /**
   * Convert PixiJS pixel coordinates to Scratch coordinates.
   */
  _fromPixi(px, py) {
    return {
      x: px - 240,
      y: 180 - py,
    };
  }

  onSpriteClick(callback) {
    this._onSpriteClick = callback;
  }

  onStageClick(callback) {
    this._onStageClick = callback;
  }

  /**
   * Get the PixiJS app instance (for thumbnail extraction, etc.).
   */
  getApp() {
    return this.app;
  }
}
