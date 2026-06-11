// modal for selecting or uploading backdrops from the Scratch CDN library
import { fetchScratchBackdrops, fetchBackdropCategories } from './ScratchAssetLibrary.js';
import spriteStore from '../engine/SpriteStore.js';

let modalEl = null;

// Module-level state for CDN data — preserved across open/close cycles
let _backdrops   = [];
let _categories  = ['All'];
let _activeCategory = 'All';
let _searchQuery    = '';

export function openBackdropChooser() {
  if (modalEl) return;

  modalEl = document.createElement('div');
  modalEl.className = 'chooser-overlay';
  modalEl.innerHTML = `
    <div class="chooser-modal">
      <div class="chooser-header">
        <h3>Choose a Backdrop</h3>
        <button class="chooser-close" id="closeBackdropChooser">
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
               id="backdropSearchTop" placeholder="Search backdrops..." />
      </div>

      <div class="chooser-categories" id="backdropCategories">
        <!-- populated dynamically -->
      </div>

      <div class="chooser-body" id="backdropChooserBody">
        <div class="chooser-loading">
          <div class="chooser-spinner"></div>
          Loading backdrops...
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalEl);

  loadBackdrops();

  modalEl.querySelector('#closeBackdropChooser').addEventListener('click', close);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) close();
  });
  document.addEventListener('keydown', onEsc);

  // Bind top search input
  modalEl.querySelector('#backdropSearchTop')?.addEventListener('input', e => {
    _searchQuery = e.target.value;
    if (_backdrops.length > 0) renderLibraryGrid();
  });

  modalEl.querySelectorAll('.chooser-tab-btn').forEach(tab => {
    tab.addEventListener('click', () => {
      modalEl.querySelectorAll('.chooser-tab-btn').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (tab.dataset.tab === 'library') {
        if (_backdrops.length > 0) {
          renderLibraryGrid();
        } else {
          renderLoadingState();
          loadBackdrops();
        }
      } else {
        renderUploadPane();
      }
    });
  });

  requestAnimationFrame(() => modalEl.classList.add('open'));
}

function loadBackdrops() {
  fetchScratchBackdrops()
    .then(data => {
      _backdrops = data;
      if (isLibraryTabActive()) {
        renderCategoryPills();
        renderLibraryGrid();
      }
    })
    .catch(err => {
      if (isLibraryTabActive()) renderErrorState(err.message);
    });

  fetchBackdropCategories()
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
  const container = modalEl?.querySelector('#backdropCategories');
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
  const body = modalEl?.querySelector('#backdropChooserBody');
  if (!body) return;

  const currentBackdrop = spriteStore.getCurrentBackdrop();

  let filtered = _backdrops;
  if (_activeCategory !== 'All') {
    filtered = filtered.filter(b => b.tags.includes(_activeCategory));
  }
  if (_searchQuery.trim()) {
    const q = _searchQuery.toLowerCase();
    filtered = filtered.filter(b => b.name.toLowerCase().includes(q));
  }

  const gridHtml = filtered.length === 0
    ? '<div class="chooser-empty">No backdrops found</div>'
    : filtered.map(bd => {
        const isActive = currentBackdrop && currentBackdrop.name === bd.name;
        return `
          <div class="chooser-item backdrop-item ${isActive ? 'active' : ''}" data-backdrop-name="${bd.name}">
            <img src="${bd.value}" alt="${bd.name}" loading="lazy"
                 onerror="this.style.opacity='0.2'" />
            <span>${bd.name}</span>
          </div>
        `;
      }).join('');

  body.innerHTML = `<div class="chooser-grid backdrop-grid">${gridHtml}</div>`;

  body.querySelectorAll('.backdrop-item').forEach(item => {
    item.addEventListener('click', () => {
      const bd = _backdrops.find(b => b.name === item.dataset.backdropName);
      if (!bd) return;
      spriteStore.setBackdrop(bd);
      close();
    });
  });
}

function renderLoadingState() {
  const body = modalEl?.querySelector('#backdropChooserBody');
  if (body) body.innerHTML = '<div class="chooser-loading"><div class="chooser-spinner"></div>Loading backdrops...</div>';
}

function renderErrorState(msg) {
  const body = modalEl?.querySelector('#backdropChooserBody');
  if (!body) return;
  body.innerHTML = `
    <div class="chooser-error">
      Failed to load backdrops. Check your internet connection.
      <br><small>${msg || ''}</small>
      <button id="retryBtn">Retry</button>
    </div>
  `;
  body.querySelector('#retryBtn')?.addEventListener('click', () => {
    renderLoadingState();
    loadBackdrops();
  });
}

function renderUploadPane() {
  const body = modalEl.querySelector('#backdropChooserBody');
  body.innerHTML = `
    <div class="chooser-upload-area">
      <div class="upload-dropzone" id="backdropDropZone">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p>Drag & drop a backdrop image</p>
        <p class="upload-hint">or</p>
        <label class="upload-browse-btn">
          Browse Files
          <input type="file" accept="image/*" id="backdropFileInput" hidden />
        </label>
      </div>
    </div>
  `;

  const fileInput = body.querySelector('#backdropFileInput');
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleCustomUpload(file);
  });

  const dropZone = body.querySelector('#backdropDropZone');
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
    const bd = { name, type: 'image', value: dataUrl };
    spriteStore.addBackdropToLibrary(bd);
    spriteStore.setBackdrop(bd);
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
