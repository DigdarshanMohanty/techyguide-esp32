// Fetches sprite + backdrop data from the official Scratch CDN.
// Results are cached in memory after first fetch — subsequent modal opens are instant.

import { SPRITE_LIBRARY } from './spriteLibrary.js';
import { BACKDROP_LIBRARY } from './backdropLibrary.js';

const SPRITES_JSON_URL =
  'https://raw.githubusercontent.com/scratchfoundation/scratch-gui/develop/src/lib/libraries/sprites.json';

const BACKDROPS_JSON_URL =
  'https://raw.githubusercontent.com/scratchfoundation/scratch-gui/develop/src/lib/libraries/backdrops.json';

const CDN_BASE = 'https://cdn.assets.scratch.mit.edu/internalapi/asset';

function cdnUrl(md5ext) {
  return `${CDN_BASE}/${md5ext}/get/`;
}

// Only generic, non-trademarked categories — Scratch mascots are excluded
const SAFE_SPRITE_TAGS = new Set([
  'animals', 'food', 'nature', 'fantasy',
  'things', 'transportation', 'sports', 'music',
  'space', 'underwater', 'insects', 'dinosaurs',
  'letters', 'numbers',
]);

let _spritesCache   = null;
let _backdropsCache = null;
let _spritesPromise   = null;
let _backdropsPromise = null;

/**
 * Fetch and cache the full Scratch sprite library.
 * Returns array of { name, category, tags, thumbnailUrl, costumes[{name, src}] }
 */
export async function fetchScratchSprites() {
  if (_spritesCache) return _spritesCache;
  if (_spritesPromise) return _spritesPromise;

  _spritesPromise = (async () => {
    try {
      const res = await fetch(SPRITES_JSON_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();

      _spritesCache = raw
        .filter(sprite => {
          const tags = (sprite.tags || []).map(t => t.toLowerCase());
          return tags.some(tag => SAFE_SPRITE_TAGS.has(tag));
        })
        .map(sprite => {
          const costumes = (sprite.costumes || []).map(c => ({
            name: c.name || 'costume1',
            src:  cdnUrl(c.md5ext),
          }));

          if (costumes.length === 0 && sprite.md5ext) {
            costumes.push({ name: sprite.name, src: cdnUrl(sprite.md5ext) });
          }

          return {
            name:         sprite.name,
            category:     sprite.tags?.[0] || 'Other',
            tags:         sprite.tags || [],
            thumbnailUrl: costumes[0]?.src || '',
            costumes,
          };
        });

      return _spritesCache;
    } catch (err) {
      console.warn('[ScratchAssetLibrary] CDN unavailable, using built-in library:', err.message);
      _spritesCache = SPRITE_LIBRARY.map(s => ({
        name:         s.name,
        category:     s.category,
        tags:         [s.category],
        thumbnailUrl: s.svg,
        costumes:     [{ name: s.name.toLowerCase(), src: s.svg }],
      }));
      return _spritesCache;
    } finally {
      _spritesPromise = null;
    }
  })();

  return _spritesPromise;
}

export async function fetchSpriteCategories() {
  const sprites = await fetchScratchSprites();
  const cats = new Set(sprites.map(s => s.category));
  return ['All', ...Array.from(cats).sort()];
}

/**
 * Fetch and cache the full Scratch backdrop library.
 * Returns array of { name, tags, type, value }
 */
export async function fetchScratchBackdrops() {
  if (_backdropsCache) return _backdropsCache;
  if (_backdropsPromise) return _backdropsPromise;

  _backdropsPromise = (async () => {
    try {
      const res = await fetch(BACKDROPS_JSON_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();

      _backdropsCache = raw.map(bd => ({
        name:  bd.name,
        tags:  bd.tags || [],
        type:  bd.md5ext?.endsWith('.svg') ? 'svg' : 'image',
        value: cdnUrl(bd.md5ext),
      }));

      return _backdropsCache;
    } catch (err) {
      console.warn('[ScratchAssetLibrary] CDN unavailable, using built-in library:', err.message);
      _backdropsCache = BACKDROP_LIBRARY;
      return _backdropsCache;
    } finally {
      _backdropsPromise = null;
    }
  })();

  return _backdropsPromise;
}

export async function fetchBackdropCategories() {
  const backdrops = await fetchScratchBackdrops();
  const cats = new Set(backdrops.flatMap(b => b.tags));
  return ['All', ...Array.from(cats).sort()];
}

export function clearAssetCache() {
  _spritesCache   = null;
  _backdropsCache = null;
}
