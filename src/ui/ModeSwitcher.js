// ModeSwitcher — builds the modern navbar and handles mode/view toggling
import { refreshIcons } from './icons';

let currentMode = 'scratch'; // 'scratch' | 'board'
let currentBoardView = 'stage'; // 'stage' | 'code'
let selectedBoard = null; // 'i-bot' | 't-bot'
let onModeChangeCallback = null;
let onViewChangeCallback = null;

// ── Toast notification ──────────────────────────────
export function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';

  toast.style.cssText = `
    position: fixed; top: 24px; left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: #fff; color: #1a1a1a;
    border-left: 4px solid var(--accent);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    padding: 12px 24px; border-radius: 10px;
    display: flex; align-items: center; gap: 10px;
    font-family: var(--font-ui); font-size: 14px; font-weight: 600;
    z-index: 9999; opacity: 0;
    transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  `;

  toast.innerHTML = `
    <i data-lucide="info" style="width:18px;height:18px;color:var(--accent);flex-shrink:0;"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);
  refreshIcons();

  void toast.offsetWidth;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Board options ───────────────────────────────────
const BOARDS = [
  {
    id: 'i-bot',
    name: 'i-Bot',
    desc: 'ESP32-based robot',
    img: 'https://cdn.sparkfun.com/assets/learn_tutorials/8/4/6/ESP32_Thing_Pinout.png',
  },
  {
    id: 't-bot',
    name: 'T-Bot',
    desc: 'ESP32 WROOM module',
    img: 'https://cdn.sparkfun.com/assets/learn_tutorials/8/4/6/ESP32_Thing_Pinout.png',
  },
];

// ── Init ────────────────────────────────────────────
export function initModeSwitcher(onModeChange, onViewChange) {
  onModeChangeCallback = onModeChange;
  onViewChangeCallback = onViewChange;

  const header = document.getElementById('appHeader');
  if (!header) return;

  // ══════════════════════════════════════════════════
  //  LEFT SECTION — Logo
  // ══════════════════════════════════════════════════
  const leftSection = document.createElement('div');
  leftSection.className = 'nav-section nav-section--left';

  const logo = document.createElement('div');
  logo.className = 'header-logo';
  logo.setAttribute('data-tooltip', 'TechyGuide Home');
  logo.innerHTML = `
    <img src="/logo-ByQhDDdF.webp" alt="TechyGuide">
  `;
  leftSection.appendChild(logo);

  // ══════════════════════════════════════════════════
  //  CENTER SECTION — Board Dropdown + Connect
  // ══════════════════════════════════════════════════
  const centerSection = document.createElement('div');
  centerSection.className = 'nav-section nav-section--center';

  // ── Board Dropdown ──
  const boardWrap = document.createElement('div');
  boardWrap.className = 'board-dropdown-wrap';

  const boardBtn = document.createElement('button');
  boardBtn.className = 'nav-btn nav-btn--board';
  boardBtn.id = 'boardToggleBtn';
  boardBtn.setAttribute('data-tooltip', 'Select Board');
  boardBtn.innerHTML = `
    <i data-lucide="cpu" style="width:16px;height:16px;"></i>
    <span id="boardBtnLabel">Board</span>
    <i class="btn-chevron" data-lucide="chevron-down" style="width:14px;height:14px;"></i>
  `;

  const boardPanel = document.createElement('div');
  boardPanel.className = 'board-dropdown-panel';
  boardPanel.id = 'boardDropdownPanel';

  BOARDS.forEach(board => {
    const card = document.createElement('div');
    card.className = 'board-card';
    card.dataset.boardId = board.id;
    card.innerHTML = `
      <img class="board-card-img" src="${board.img}" alt="${board.name}">
      <div class="board-card-name">${board.name}</div>
      <div class="board-card-desc">${board.desc}</div>
    `;

    card.addEventListener('click', () => {
      selectedBoard = board.id;

      // Keep label as Board
      // const label = document.getElementById('boardBtnLabel');
      // if (label) label.textContent = board.name;

      // Update card selection
      boardPanel.querySelectorAll('.board-card').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');

      // Close dropdown
      boardPanel.classList.remove('is-visible');
      boardBtn.classList.remove('is-open');

      // Switch to board mode
      _switchMode('board');
    });

    boardPanel.appendChild(card);
  });

  // Toggle dropdown
  boardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = boardPanel.classList.contains('is-visible');
    boardPanel.classList.toggle('is-visible', !isOpen);
    boardBtn.classList.toggle('is-open', !isOpen);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!boardWrap.contains(e.target)) {
      boardPanel.classList.remove('is-visible');
      boardBtn.classList.remove('is-open');
    }
  });

  boardWrap.appendChild(boardBtn);
  boardWrap.appendChild(boardPanel);

  // ── Connect Button ──
  const connectBtn = document.createElement('button');
  connectBtn.className = 'nav-btn nav-btn--connect';
  connectBtn.id = 'connectBtn';
  connectBtn.setAttribute('data-tooltip', 'Connect Device');
  connectBtn.innerHTML = `
    <i data-lucide="plug" style="width:16px;height:16px;"></i>
    <span id="connectBtnLabel">Connect</span>
    <span class="status-dot"></span>
  `;

  centerSection.appendChild(boardWrap);
  centerSection.appendChild(connectBtn);

  // ══════════════════════════════════════════════════
  //  RIGHT SECTION — View Toggle + Upload
  // ══════════════════════════════════════════════════
  const rightSection = document.createElement('div');
  rightSection.className = 'nav-section nav-section--right';

  // ── View Toggle (Scratch-style tabs) ──
  const tabGroup = document.createElement('div');
  tabGroup.className = 'header-tab-group';
  tabGroup.id = 'headerViewGroup';
  tabGroup.innerHTML = `
    <button class="header-tab active" id="headerStageBtn" data-view="stage">
      <i data-lucide="monitor" style="width:15px;height:15px;"></i>
      Stage
    </button>
    <button class="header-tab" id="headerCodeBtn" data-view="code">
      <i data-lucide="code-2" style="width:15px;height:15px;"></i>
      Code
    </button>
  `;

  // ── Upload Button ──
  const uploadBtn = document.createElement('button');
  uploadBtn.className = 'nav-btn nav-btn--upload';
  uploadBtn.id = 'headerUploadBtn';
  uploadBtn.style.display = 'none';
  uploadBtn.setAttribute('data-tooltip', 'Upload Code');
  uploadBtn.innerHTML = `
    <i data-lucide="upload" style="width:15px;height:15px;"></i>
    Upload
  `;

  rightSection.appendChild(tabGroup);
  rightSection.appendChild(uploadBtn);

  // ══════════════════════════════════════════════════
  //  ASSEMBLE
  // ══════════════════════════════════════════════════
  header.appendChild(leftSection);
  header.appendChild(centerSection);
  header.appendChild(rightSection);

  // Wire view toggle
  document.getElementById('headerStageBtn')?.addEventListener('click', () => _setView('stage'));
  document.getElementById('headerCodeBtn')?.addEventListener('click', () => _setView('code'));

  // Render Lucide icons
  refreshIcons();
}

// ── Mode switching ──────────────────────────────────
function _switchMode(newMode) {
  if (newMode === currentMode) return;
  currentMode = newMode;

  const body = document.body;
  const scratchPane = document.getElementById('scratchPane');
  const boardPane = document.getElementById('boardPane');
  const scratchControls = document.getElementById('scratchControls');
  const viewGroup = document.getElementById('headerViewGroup');
  const uploadBtn = document.getElementById('headerUploadBtn');
  const boardBtn = document.getElementById('boardToggleBtn');
  const boardBtnLabel = document.getElementById('boardBtnLabel');

  if (newMode === 'scratch') {
    body.classList.remove('mode-board');
    body.classList.add('mode-scratch');
    if (scratchPane) scratchPane.style.display = 'flex';
    if (boardPane) boardPane.style.display = 'none';
    if (scratchControls) scratchControls.style.display = 'flex';
    if (uploadBtn) uploadBtn.style.display = 'none';
    if (boardBtnLabel) boardBtnLabel.textContent = 'Board';

    _setView('stage');
  } else {
    body.classList.remove('mode-scratch');
    body.classList.add('mode-board');
    if (scratchPane) scratchPane.style.display = 'none';
    if (boardPane) boardPane.style.display = 'flex';
    if (scratchControls) scratchControls.style.display = 'none';
    if (uploadBtn) uploadBtn.style.display = 'flex';
    if (boardBtnLabel) boardBtnLabel.textContent = 'Board';

    _setView('code');
  }

  if (onModeChangeCallback) {
    onModeChangeCallback(newMode);
  }
}

// ── View switching ──────────────────────────────────
function _setView(view) {
  if (view === currentBoardView) return;
  currentBoardView = view;

  const stageBtn = document.getElementById('headerStageBtn');
  const codeBtn = document.getElementById('headerCodeBtn');

  if (view === 'stage') {
    stageBtn?.classList.add('active');
    codeBtn?.classList.remove('active');
  } else {
    codeBtn?.classList.add('active');
    stageBtn?.classList.remove('active');
  }

  if (onViewChangeCallback) onViewChangeCallback(view);
}

// ── Public getters ──────────────────────────────────
export function getCurrentMode() {
  return currentMode === 'scratch' ? 'scratch' : currentMode;
}

export function getCurrentBoardView() {
  return currentBoardView;
}
