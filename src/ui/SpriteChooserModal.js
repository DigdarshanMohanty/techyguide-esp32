// modal for selecting or uploading sprites from the Scratch CDN library
import { fetchScratchSprites, fetchSpriteCategories } from './ScratchAssetLibrary.js';
import spriteStore from '../engine/SpriteStore.js';

let modalEl = null;

// Module-level state for CDN data — preserved across open/close cycles
let _sprites    = [];
let _categories = ['All'];
let _activeCategory = 'All';
let _searchQuery    = '';

export function openSpriteChooser() {
  if (modalEl) return;

  modalEl = document.createElement('div');
  modalEl.className = 'chooser-overlay';
  modalEl.innerHTML = `
    <div class="chooser-modal">
      <div class="chooser-header">
        <h3>Choose a Sprite</h3>
        <button class="chooser-close" id="closeSpriteChooser">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="chooser-tabs">
        <button class="chooser-tab-btn active" data-tab="library">Library</button>
        <button class="chooser-tab-btn" data-tab="upload">Upload</button>
      </div>

      <div class="chooser-controls">
        <input type="text" class="chooser-search-input"
               id="spriteSearchTop" placeholder="Search sprites..." />
      </div>

      <div class="chooser-categories" id="spriteCategories">
        <!-- populated dynamically -->
      </div>

      <div class="chooser-body" id="spriteChooserBody">
        <div class="chooser-loading">
          <div class="chooser-spinner"></div>
          Loading sprites...
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  loadSprites();

  modalEl.querySelector('#closeSpriteChooser').addEventListener('click', close);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) close();
  });
  document.addEventListener('keydown', onEsc);

  // Bind top search input
  modalEl.querySelector('#spriteSearchTop')?.addEventListener('input', e => {
    _searchQuery = e.target.value;
    if (_sprites.length > 0) renderLibraryGrid();
  });

  modalEl.querySelectorAll('.chooser-tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      modalEl.querySelectorAll('.chooser-tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'library') {
        if (_sprites.length > 0) {
          renderLibraryGrid();
        } else {
          renderLoadingState();
          loadSprites();
        }
      } else {
        renderUploadPane();
      }
    });
  });

  requestAnimationFrame(() => modalEl.classList.add('open'));
}

function loadSprites() {
  fetchScratchSprites()
    .then(data => {
      _sprites = data;
      if (isLibraryTabActive()) {
        renderCategoryPills();
        renderLibraryGrid();
      }
    })
    .catch(err => {
      if (isLibraryTabActive()) renderErrorState(err.message);
    });

  fetchSpriteCategories()
    .then(cats => {
      _categories = cats;
      if (isLibraryTabActive()) renderCategoryPills();
    });
}

function isLibraryTabActive() {
  if (!modalEl) return false;
  const activeTab = modalEl.querySelector('.chooser-tab-btn.active');
  return !activeTab || activeTab.dataset.tab === 'library';
}

function renderCategoryPills() {
  const container = modalEl?.querySelector('#spriteCategories');
  if (!container) return;
  container.innerHTML = _categories.map(cat => `
    <button class="category-pill ${cat === _activeCategory ? 'active' : ''}"
            data-category="${cat}">${cat}</button>
  `).join('');
  container.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      _activeCategory = pill.dataset.category;
      renderCategoryPills();
      renderLibraryGrid();
    });
  });
}

function renderLibraryGrid() {
  const body = modalEl?.querySelector('#spriteChooserBody');
  if (!body) return;

  let filtered = _sprites;
  if (_activeCategory !== 'All') {
    filtered = filtered.filter(s =>
      s.category === _activeCategory || s.tags.includes(_activeCategory)
    );
  }
  if (_searchQuery.trim()) {
    const q = _searchQuery.toLowerCase();
    filtered = filtered.filter(s => s.name.toLowerCase().includes(q));
  }

  const gridHtml = filtered.length === 0
    ? '<div class="chooser-empty">No sprites found</div>'
    : filtered.map(sprite => `
        <div class="chooser-item sprite-item" data-sprite-name="${sprite.name}">
          <img src="${sprite.thumbnailUrl}" alt="${sprite.name}" loading="lazy"
               onerror="this.style.opacity='0.2'" />
          <span>${sprite.name}</span>
        </div>
      `).join('');

  body.innerHTML = `<div class="chooser-grid">${gridHtml}</div>`;

  body.querySelectorAll('.sprite-item').forEach(item => {
    item.addEventListener('click', () => {
      const sprite = _sprites.find(s => s.name === item.dataset.spriteName);
      if (!sprite) return;
      addSpriteToProject(sprite);
      close();
    });
  });
}

function renderLoadingState() {
  const body = modalEl?.querySelector('#spriteChooserBody');
  if (body) body.innerHTML = '<div class="chooser-loading"><div class="chooser-spinner"></div>Loading sprites...</div>';
}

function renderErrorState(msg) {
  const body = modalEl?.querySelector('#spriteChooserBody');
  if (!body) return;
  body.innerHTML = `
    <div class="chooser-error">
      Failed to load sprites. Check your internet connection.
      <br><small>${msg || ''}</small>
      <button id="retryBtn">Retry</button>
    </div>
  `;
  body.querySelector('#retryBtn')?.addEventListener('click', () => {
    renderLoadingState();
    loadSprites();
  });
}

function addSpriteToProject(scratchSprite) {
  const i = spriteStore.getAllSprites().length + 1;
  const displayName = `${scratchSprite.name}${i > 1 ? i : ''}`;
  const sprite = spriteStore.addSprite(displayName, {
    costumeSrc: scratchSprite.costumes[0]?.src || scratchSprite.thumbnailUrl,
  });

  // Add remaining costumes if the sprite store supports it
  if (sprite && typeof sprite.addCostume === 'function') {
    for (let j = 1; j < scratchSprite.costumes.length; j++) {
      sprite.addCostume(scratchSprite.costumes[j].name, scratchSprite.costumes[j].src);
    }
  }
}

function renderUploadPane() {
  const body = modalEl.querySelector('#spriteChooserBody');
  body.innerHTML = `
    <div class="chooser-upload-area">
      <div class="upload-dropzone" id="spriteDropZone">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p>Drag & drop an image here</p>
        <p class="upload-hint">or</p>
        <label class="upload-browse-btn">
          Browse Files
          <input type="file" accept="image/*" id="spriteFileInput" hidden />
        </label>
      </div>
    </div>
  `;

  const fileInput = body.querySelector('#spriteFileInput');
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleCustomUpload(file);
  });

  const dropZone = body.querySelector('#spriteDropZone');
  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleCustomUpload(file);
  });
}

function handleCustomUpload(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const name = file.name.replace(/\.[^.]+$/, '') || 'Custom';
    spriteStore.addSprite(name, { costumeSrc: dataUrl });
    close();
  };
  reader.readAsDataURL(file);
}

function onEsc(e) {
  if (e.key === 'Escape') close();
}

function close() {
  if (!modalEl) return;
  modalEl.classList.remove('open');
  document.removeEventListener('keydown', onEsc);
  setTimeout(() => {
    if (modalEl && modalEl.parentNode) {
      modalEl.parentNode.removeChild(modalEl);
    }
    modalEl = null;
  }, 200);
}
