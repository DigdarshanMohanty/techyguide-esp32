// sprite properties bar, sprite list, and backdrop list ui
import * as Blockly from 'blockly';
import spriteStore from '../engine/SpriteStore';
import { openSpriteChooser } from './SpriteChooserModal';
import { openBackdropChooser } from './BackdropChooserModal';

export function initSpritePanel(ws) {
  const container = document.getElementById('spritePanelContainer');
  if (!container) return;

  container.innerHTML = `
    <!-- Sprite properties bar -->
    <div class="sprite-props-bar">
      <div class="props-row">
        <div class="prop-field name-field">
          <label class="prop-label">Sprite</label>
          <input type="text" id="propName" class="prop-input" autocomplete="off" />
        </div>
        <div class="prop-field coord-field">
          <label class="prop-label">x</label>
          <input type="number" id="propX" class="prop-input prop-num" />
        </div>
        <div class="prop-field coord-field">
          <label class="prop-label">y</label>
          <input type="number" id="propY" class="prop-input prop-num" />
        </div>
      </div>
      <div class="props-row">
        <div class="prop-field">
          <label class="prop-label">Show</label>
          <div class="show-toggle">
            <button id="propShow" class="show-btn active" title="Show">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button id="propHide" class="show-btn" title="Hide">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="prop-field">
          <label class="prop-label">Size</label>
          <input type="number" id="propSize" class="prop-input prop-num" min="1" max="1000" />
        </div>
        <div class="prop-field">
          <label class="prop-label">Direction</label>
          <input type="number" id="propDir" class="prop-input prop-num" />
        </div>
      </div>
    </div>

    <!-- Sprite tray + stage section -->
    <div class="sprite-stage-tray">
      <!-- Sprite list area -->
      <div class="sprite-tray-area">
        <div id="spriteList" class="sprite-list"></div>
        <button class="add-sprite-btn" id="addSpriteBtn" title="Choose a Sprite">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v8M8 12h8"/>
          </svg>
        </button>
      </div>

      <!-- Stage / backdrop section -->
      <div class="stage-tray-area">
        <div class="stage-tray-label">
          <span class="tray-title">Stage</span>
          <span class="tray-sub" id="backdropCount">1 backdrop</span>
        </div>
        <div class="backdrop-preview-card" id="backdropPreview">
          <div class="backdrop-preview-inner" id="backdropPreviewInner"></div>
        </div>
        <button class="add-backdrop-btn" id="addBackdropBtn" title="Choose a Backdrop">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  bindEvents();
  renderPanel();

  spriteStore.on((event) => {
    renderPanel();
    if (event === 'backdrop') {
      updateBackdropPreview();
    }
  });
}

function bindEvents() {
  const propName = document.getElementById('propName');
  const propX    = document.getElementById('propX');
  const propY    = document.getElementById('propY');
  const propSize = document.getElementById('propSize');
  const propDir  = document.getElementById('propDir');
  const propShow = document.getElementById('propShow');
  const propHide = document.getElementById('propHide');
  const addSpriteBtn   = document.getElementById('addSpriteBtn');
  const addBackdropBtn = document.getElementById('addBackdropBtn');

  const updateProp = (fn) => {
    const s = spriteStore.getSelectedSprite();
    if (s) { fn(s); spriteStore._emit('update', s); }
  };

  propName.addEventListener('change', (e) => updateProp(s => s.name = e.target.value));
  propX.addEventListener('change',    (e) => updateProp(s => s.setX(Number(e.target.value))));
  propY.addEventListener('change',    (e) => updateProp(s => s.setY(Number(e.target.value))));
  propSize.addEventListener('change', (e) => updateProp(s => s.setSize(Number(e.target.value))));
  propDir.addEventListener('change',  (e) => updateProp(s => s.direction = Number(e.target.value)));

  propShow.addEventListener('click', () => updateProp(s => s.visible = true));
  propHide.addEventListener('click', () => updateProp(s => s.visible = false));

  addSpriteBtn.addEventListener('click',   () => openSpriteChooser());
  addBackdropBtn.addEventListener('click', () => openBackdropChooser());
}

function updateBackdropPreview() {
  const preview = document.getElementById('backdropPreviewInner');
  if (!preview) return;
  const bd = spriteStore.getCurrentBackdrop();
  if (!bd) { preview.style.background = '#fff'; return; }
  if (bd.type === 'color' || bd.type === 'gradient') {
    preview.style.background = bd.value;
  } else if (bd.type === 'svg' || bd.type === 'image') {
    preview.style.background = `url("${bd.value}") center/cover no-repeat`;
  }
}

function renderPanel() {
  const s = spriteStore.getSelectedSprite();
  if (s) {
    document.getElementById('propName').value = s.name;
    document.getElementById('propX').value    = Math.round(s.x);
    document.getElementById('propY').value    = Math.round(s.y);
    document.getElementById('propSize').value = Math.round(s.size);
    document.getElementById('propDir').value  = Math.round(s.direction);
    document.getElementById('propShow').classList.toggle('active',  s.visible);
    document.getElementById('propHide').classList.toggle('active', !s.visible);
  } else {
    ['propName','propX','propY','propSize','propDir'].forEach(id => {
      document.getElementById(id).value = '';
    });
  }

  const list = document.getElementById('spriteList');
  if (!list) return;
  list.innerHTML = '';

  const sprites = spriteStore.getAllSprites();
  const canDelete = sprites.length > 1;

  sprites.forEach(sprite => {
    const isSelected = sprite.id === s?.id;
    const safeName   = sprite.name
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const img = sprite.getCostumeImage();
    const imgSrc = img?.src || '';

    const card = document.createElement('div');
    card.className = `sprite-card${isSelected ? ' selected' : ''}`;
    card.innerHTML = imgSrc
      ? `<img class="sprite-card-img" src="${imgSrc}" alt="${safeName}" />`
      : `<div class="sprite-card-img sprite-card-placeholder"></div>`;
    card.innerHTML += `<span class="sprite-card-name">${safeName}</span>`;
    if (canDelete) {
      card.innerHTML += `<button class="sprite-card-delete" data-id="${sprite.id}" title="Delete">✕</button>`;
    }

    card.addEventListener('click', (e) => {
      const delTarget = e.target.closest('.sprite-card-delete');
      if (delTarget) {
        e.stopPropagation();
        if (ws && sprite.id === spriteStore.selectedSpriteId) {
          spriteStore.saveWorkspaceState(sprite.id, Blockly.serialization.workspaces.save(ws));
        }
        spriteStore.removeSprite(sprite.id);
        return;
      }
      spriteStore.selectSprite(sprite.id);
    });

    list.appendChild(card);
  });

  updateBackdropPreview();
}
