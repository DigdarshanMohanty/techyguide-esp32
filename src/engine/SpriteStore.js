/**
 * SpriteStore — Central state manager for all sprites.
 * Tracks the sprite list, selected sprite, and per-sprite Blockly workspace state.
 */

import { Sprite } from './SpriteEngine.js';

class SpriteStore {
  constructor() {
    this.sprites = [];
    this.selectedSpriteId = null;
    this._listeners = [];

    // ── Backdrop state ──
    this._backdrops = [];         // user-added backdrops
    this._currentBackdrop = null; // { name, type, value }
  }

  /**
   * Subscribe to sprite store changes.
   * @param {Function} listener - called with (event, data) 
   *   Events: 'add', 'remove', 'select', 'update'
   */
  on(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  _emit(event, data) {
    this._listeners.forEach(l => l(event, data));
  }

  /**
   * Add a new sprite with a default name.
   * @returns {Sprite} the new sprite
   */
  addSprite(name, options = {}) {
    const sprite = new Sprite(name, options);

    // Re-render UI when this sprite's asynchronous costume image loads
    sprite.onCostumeLoad = () => this._emit('update', sprite);

    this.sprites.push(sprite);

    if (this.sprites.length === 1) {
      this.selectedSpriteId = sprite.id;
    }

    this._emit('add', sprite);
    return sprite;
  }

  /**
   * Remove a sprite by ID.
   */
  removeSprite(id) {
    const idx = this.sprites.findIndex(s => s.id === id);
    if (idx === -1) return;

    const removed = this.sprites.splice(idx, 1)[0];

    // If we removed the selected sprite, select another
    if (this.selectedSpriteId === id) {
      this.selectedSpriteId = this.sprites.length > 0 ? this.sprites[0].id : null;
      if (this.selectedSpriteId) {
        this._emit('select', this.getSelectedSprite());
      }
    }

    this._emit('remove', removed);
  }

  /**
   * Select a sprite by ID.
   */
  selectSprite(id) {
    const sprite = this.sprites.find(s => s.id === id);
    if (!sprite) return;

    this.selectedSpriteId = id;
    this._emit('select', sprite);
  }

  /**
   * Get the currently selected sprite.
   */
  getSelectedSprite() {
    return this.sprites.find(s => s.id === this.selectedSpriteId) || null;
  }

  /**
   * Get a sprite by ID.
   */
  getSpriteById(id) {
    return this.sprites.find(s => s.id === id) || null;
  }

  /**
   * Get all sprites.
   */
  getAllSprites() {
    return this.sprites;
  }

  /**
   * Save a Blockly workspace state for a sprite.
   */
  saveWorkspaceState(spriteId, state) {
    const sprite = this.getSpriteById(spriteId);
    if (sprite) {
      sprite.workspaceState = state;
    }
  }

  /**
   * Get the saved workspace state for a sprite.
   */
  getWorkspaceState(spriteId) {
    const sprite = this.getSpriteById(spriteId);
    return sprite ? sprite.workspaceState : null;
  }

  /**
   * Reset all sprites to initial state (for green flag / project reset).
   */
  resetAll() {
    this.sprites.forEach(s => {
      s.x = 0;
      s.y = 0;
      s.direction = 90;
      s.size = 100;
      s.visible = true;
      s.sayBubble = null;
      s.penTrails = [];
    });
    this._emit('update', null);
  }

  // ── Backdrop Management ──────────────────────────────

  /**
   * Set the current backdrop.
   * @param {{ name: string, type: string, value: string }} backdropDef
   */
  setBackdrop(backdropDef) {
    this._currentBackdrop = backdropDef;
    this._emit('backdrop', backdropDef);
  }

  /**
   * Get the current backdrop definition.
   */
  getCurrentBackdrop() {
    return this._currentBackdrop;
  }

  /**
   * Add a custom backdrop to the library.
   */
  addBackdropToLibrary(backdropDef) {
    this._backdrops.push(backdropDef);
  }

  /**
   * Get all user-added backdrops.
   */
  getBackdrops() {
    return this._backdrops;
  }

  /**
   * Get all backdrop names (built-in not tracked here; used by event blocks).
   */
  getBackdropNames() {
    const names = [];
    if (this._currentBackdrop) names.push(this._currentBackdrop.name);
    this._backdrops.forEach(b => {
      if (!names.includes(b.name)) names.push(b.name);
    });
    return names;
  }
}

// Singleton instance
const spriteStore = new SpriteStore();
export default spriteStore;
