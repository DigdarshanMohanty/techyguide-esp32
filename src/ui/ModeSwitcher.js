// board mode selector — switches between scratch, esp32, and arduino modes
const BOARDS = [
  { id: 'scratch', label: 'Scratch', icon: '', description: 'Visual coding' },
  { id: 'i-bot',   label: 'i-bot',   icon: '', description: 'TechyGuide i-bot' },
  { id: 't-bot',   label: 't-bot',   icon: '', description: 'TechyGuide t-bot' },
  { id: 'esp32',   label: 'ESP32',   icon: '', description: 'Espressif ESP32' },
  { id: 'arduino-uno',  label: 'Arduino Uno',  icon: '', description: 'ATmega328P' },
  { id: 'arduino-mega', label: 'Arduino Mega', icon: '', description: 'ATmega2560' },
  { id: 'arduino-nano', label: 'Arduino Nano', icon: '', description: 'ATmega328P Mini' },
];

let currentMode = 'scratch';
let onModeChangeCallback = null;
let boardOverlay = null;
let boardBtnLabel = null;

export function initModeSwitcher(onModeChange) {
  onModeChangeCallback = onModeChange;

  const header = document.getElementById('appHeader');
  if (!header) return;

  const logo = document.createElement('div');
  logo.className = 'header-logo';
  logo.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="4" fill="#00897B"/>
      <text x="14" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">T</text>
    </svg>
    <span style="color:#00897B;">Techy</span><span style="color:#E8950F;">Guide</span>
  `;

  const boardBtn = document.createElement('button');
  boardBtn.className = 'header-btn';
  boardBtn.id = 'boardSelectorBtn';
  boardBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
    <span id="boardBtnLabel">Scratch</span>
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style="margin-left:2px;">
      <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  boardBtn.addEventListener('click', () => openBoardModal());

  const spacer = document.createElement('div');
  spacer.className = 'header-spacer';

  header.appendChild(logo);
  header.appendChild(boardBtn);
  header.appendChild(spacer);

  boardBtnLabel = document.getElementById('boardBtnLabel');

  _createBoardModal();
}

function _createBoardModal() {
  boardOverlay = document.createElement('div');
  boardOverlay.className = 'modal-overlay';
  boardOverlay.id = 'boardModalOverlay';

  boardOverlay.innerHTML = `
    <div class="modal-content" style="width:480px;">
      <div class="modal-header">
        <h3>Select Board</h3>
        <button class="modal-close" id="boardModalClose"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </div>
      <div class="modal-body">
        <div class="board-grid" id="boardGrid">
          ${BOARDS.map(b => `
            <div class="board-item ${b.id === currentMode ? 'active' : ''}" data-board="${b.id}">
              <div class="board-icon">${b.icon}</div>
              <span class="board-name">${b.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(boardOverlay);

  boardOverlay.querySelector('#boardModalClose').addEventListener('click', closeBoardModal);
  boardOverlay.addEventListener('click', (e) => {
    if (e.target === boardOverlay) closeBoardModal();
  });

  boardOverlay.querySelectorAll('.board-item').forEach(item => {
    item.addEventListener('click', () => {
      const boardId = item.dataset.board;
      _selectBoard(boardId);
    });
  });
}

function _selectBoard(boardId) {
  const board = BOARDS.find(b => b.id === boardId);
  if (!board) return;

  boardOverlay.querySelectorAll('.board-item').forEach(item => {
    item.classList.toggle('active', item.dataset.board === boardId);
  });

  if (boardBtnLabel) {
    boardBtnLabel.textContent = board.label;
  }

  const newMode = boardId === 'scratch' ? 'scratch' : boardId;
  switchMode(newMode);

  setTimeout(() => closeBoardModal(), 150);
}

function switchMode(newMode) {
  if (newMode === currentMode) return;
  currentMode = newMode;

  const body = document.body;
  const scratchPane = document.getElementById('scratchPane');
  const boardPane = document.getElementById('boardPane');
  const scratchControls = document.getElementById('scratchControls');

  if (newMode === 'scratch') {
    body.classList.remove('mode-board');
    body.classList.add('mode-scratch');
    if (scratchPane) scratchPane.style.display = 'flex';
    if (boardPane) boardPane.style.display = 'none';
    if (scratchControls) scratchControls.style.display = 'flex';
  } else {
    body.classList.remove('mode-scratch');
    body.classList.add('mode-board');
    if (scratchPane) scratchPane.style.display = 'none';
    if (boardPane) boardPane.style.display = 'flex';
    if (scratchControls) scratchControls.style.display = 'none';
  }

  if (onModeChangeCallback) {
    onModeChangeCallback(newMode);
  }
}

export function openBoardModal() {
  if (!boardOverlay) return;
  
  boardOverlay.querySelectorAll('.board-item').forEach(item => {
    item.classList.toggle('active', item.dataset.board === currentMode);
  });
  boardOverlay.offsetHeight; 
  boardOverlay.classList.add('open');
}

export function closeBoardModal() {
  if (boardOverlay) boardOverlay.classList.remove('open');
}

export function getCurrentMode() {
  
  return currentMode === 'scratch' ? 'scratch' : currentMode;
}
