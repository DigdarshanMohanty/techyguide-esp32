// Sprite Store

import { Sprite } from './SpriteEngine.js';
import eventBus, { Events } from './EventBus.js';

class SpriteStore {
  constructor() {
    this.sprites = [];
    this.selectedSpriteId = null;
    this._listeners = [];

    this._backdrops = [];         
    this._currentBackdrop = null; 
  }

  on(listener) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  _emit(event, data) {
    this._listeners.forEach(l => l(event, data));
  }

  addSprite(name, options = {}) {
    const sprite = new Sprite(name, options);

    sprite.onCostumeLoad = () => this._emit('update', sprite);

    this.sprites.push(sprite);

    if (this.sprites.length === 1) {
      this.selectedSpriteId = sprite.id;
    }

    this._emit('add', sprite);
    return sprite;
  }

  removeSprite(id) {
    const idx = this.sprites.findIndex(s => s.id === id);
    if (idx === -1) return;

    const removed = this.sprites.splice(idx, 1)[0];

    if (this.selectedSpriteId === id) {
      this.selectedSpriteId = this.sprites.length > 0 ? this.sprites[0].id : null;
      if (this.selectedSpriteId) {
        this._emit('select', this.getSelectedSprite());
      }
    }

    this._emit('remove', removed);
  }

  selectSprite(id) {
    const sprite = this.sprites.find(s => s.id === id);
    if (!sprite) return;

    this.selectedSpriteId = id;
    this._emit('select', sprite);
  }

  getSelectedSprite() {
    return this.sprites.find(s => s.id === this.selectedSpriteId) || null;
  }

  getSpriteById(id) {
    return this.sprites.find(s => s.id === id) || null;
  }

  getAllSprites() {
    return this.sprites;
  }

  saveWorkspaceState(spriteId, state) {
    const sprite = this.getSpriteById(spriteId);
    if (sprite) {
      sprite.workspaceState = state;
    }
  }

  getWorkspaceState(spriteId) {
    const sprite = this.getSpriteById(spriteId);
    return sprite ? sprite.workspaceState : null;
  }

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

  setBackdrop(backdropDef) {
    this._currentBackdrop = backdropDef;
    this._emit('backdrop', backdropDef);
    eventBus.emit(Events.BACKDROP_SWITCHED, backdropDef.name);
  }

  cloneSprite(id) {
    const original = this.getSpriteById(id);
    if (!original) return null;
    const clone = new Sprite(original.name + '_clone', {
      x: original.x, y: original.y,
      direction: original.direction,
      size: original.size,
      costumeSrc: original.getCurrentCostume()?.src,
    });
    clone._parentId = id;
    clone.isClone   = true;
    clone.onCostumeLoad = () => this._emit('update', clone);
    this.sprites.push(clone);
    this._emit('add', clone);
    return clone;
  }

  deleteClone(id) {
    const sprite = this.getSpriteById(id);
    if (!sprite || !sprite.isClone) return;
    const idx = this.sprites.findIndex(s => s.id === id);
    if (idx !== -1) this.sprites.splice(idx, 1);
    this._emit('remove', sprite);
  }

  moveToFront(id) {
    const idx = this.sprites.findIndex(s => s.id === id);
    if (idx === -1) return;
    const [sprite] = this.sprites.splice(idx, 1);
    this.sprites.push(sprite);
    this._emit('update', sprite);
  }

  moveToBack(id) {
    const idx = this.sprites.findIndex(s => s.id === id);
    if (idx === -1) return;
    const [sprite] = this.sprites.splice(idx, 1);
    this.sprites.unshift(sprite);
    this._emit('update', sprite);
  }

  changeLayer(id, delta) {
    const idx = this.sprites.findIndex(s => s.id === id);
    if (idx === -1) return;
    const newIdx = Math.max(0, Math.min(this.sprites.length - 1, idx + delta));
    const [sprite] = this.sprites.splice(idx, 1);
    this.sprites.splice(newIdx, 0, sprite);
    this._emit('update', sprite);
  }

  clearAll() {
    const ids = this.sprites.map(s => s.id);
    for (const id of ids) {
      this.removeSprite(id);
    }
    this._currentBackdrop = null;
    this.selectedSpriteId = null;
    this._emit('reset', null);
  }

  getCurrentBackdrop() {
    return this._currentBackdrop;
  }

  addBackdropToLibrary(backdropDef) {
    this._backdrops.push(backdropDef);
  }

  getBackdrops() {
    return this._backdrops;
  }

  getBackdropNames() {
    const names = [];
    if (this._currentBackdrop) names.push(this._currentBackdrop.name);
    this._backdrops.forEach(b => {
      if (!names.includes(b.name)) names.push(b.name);
    });
    return names;
  }
}

const spriteStore = new SpriteStore();
export default spriteStore;
