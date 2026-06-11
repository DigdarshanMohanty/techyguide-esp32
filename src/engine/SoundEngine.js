// Minimal Web Audio API sound engine — singleton used by all block handlers

const SOUND_URLS = {
  'Meow':  'https://cdn.freesound.org/previews/399/399934_4921277-lq.mp3',
  'Grunt': 'https://cdn.freesound.org/previews/266/266025_4921277-lq.mp3',
  'Pop':   'https://cdn.freesound.org/previews/81/81720_1022651-lq.mp3',
};

class SoundEngine {
  constructor() {
    this._ctx        = null;
    this._sources    = new Map(); // spriteId → AudioBufferSourceNode[]
    this._volume     = 100;
    this._effects    = { PITCH: 0, PAN: 0 };
    this._audioCache = new Map(); // url → AudioBuffer
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._ctx;
  }

  async _loadBuffer(url) {
    if (this._audioCache.has(url)) return this._audioCache.get(url);
    try {
      const res  = await fetch(url);
      const data = await res.arrayBuffer();
      const buf  = await this._getCtx().decodeAudioData(data);
      this._audioCache.set(url, buf);
      return buf;
    } catch (e) {
      console.warn('[SoundEngine] Failed to load sound:', url, e.message);
      return null;
    }
  }

  async play(url, spriteId, loop = false) {
    const ctx = this._getCtx();
    const buf = await this._loadBuffer(url);
    if (!buf) return;

    const source  = ctx.createBufferSource();
    source.buffer = buf;
    source.loop   = loop;

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, (this._effects.PAN || 0) / 100));

    const gain = ctx.createGain();
    gain.gain.value = this._volume / 100;

    source.connect(panner);
    panner.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);

    if (!this._sources.has(spriteId)) this._sources.set(spriteId, []);
    this._sources.get(spriteId).push(source);

    return new Promise(resolve => {
      source.onended = () => {
        const list = this._sources.get(spriteId) || [];
        const idx  = list.indexOf(source);
        if (idx !== -1) list.splice(idx, 1);
        resolve();
      };
    });
  }

  stopAll() {
    for (const [, sources] of this._sources) {
      sources.forEach(s => { try { s.stop(); } catch (_) {} });
    }
    this._sources.clear();
  }

  stopForSprite(spriteId) {
    const sources = this._sources.get(spriteId) || [];
    sources.forEach(s => { try { s.stop(); } catch (_) {} });
    this._sources.set(spriteId, []);
  }

  setVolume(vol)            { this._volume = Math.max(0, Math.min(100, vol)); }
  changeVolume(delta)       { this.setVolume(this._volume + delta); }
  getVolume()               { return this._volume; }
  setEffect(name, val)      { this._effects[name] = val; }
  changeEffect(name, delta) { this._effects[name] = (this._effects[name] || 0) + delta; }
  clearEffects()            { this._effects = { PITCH: 0, PAN: 0 }; }

  resolveUrl(name, sprite) {
    return SOUND_URLS[name] || sprite?.sounds?.[name] || null;
  }
}

export const soundEngine = new SoundEngine();
