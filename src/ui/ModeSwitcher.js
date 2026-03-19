/**
 * ModeSwitcher — Dropdown to toggle between Scratch mode and Board mode (i-bot / t-bot).
 * Default is Scratch. When a board is selected, ESP32 code + upload panels appear.
 */

const MODES = [
  { id: 'scratch', label: 'Scratch', icon: '🐱' },
  { id: 'i-bot',   label: 'i-bot',   icon: '🤖' },
  { id: 't-bot',   label: 't-bot',   icon: '🤖' },
];

let currentMode = 'scratch';
let onModeChangeCallback = null;

/**
 * Create and mount the mode-switcher dropdown in the header.
 * @param {Function} onModeChange - callback(newMode) called when mode changes
 */
export function initModeSwitcher(onModeChange) {
  onModeChangeCallback = onModeChange;

  const header = document.getElementById('appHeader');
  if (!header) return;

  // ── Logo ───────────────────────────────
  const logo = document.createElement('div');
  logo.className = 'header-logo';
  logo.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="6" fill="#4C97FF"/>
      <text x="14" y="20" text-anchor="middle" fill="white" font-size="16" font-weight="bold">S</text>
    </svg>
    <span>TechyGuide</span>
  `;

  // ── Dropdown ───────────────────────────
  const dropdownWrap = document.createElement('div');
  dropdownWrap.className = 'mode-dropdown-wrap';

  const select = document.createElement('select');
  select.id = 'modeSwitcher';
  select.className = 'mode-dropdown';

  MODES.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.icon}  ${m.label}`;
    if (m.id === 'scratch') opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener('change', (e) => {
    const newMode = e.target.value;
    switchMode(newMode);
  });

  dropdownWrap.appendChild(select);

  // ── Controls removed from header; now on stage container ──

  header.appendChild(logo);
  header.appendChild(dropdownWrap);
}

/**
 * Switch between Scratch mode and Board mode.
 */
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

/**
 * Get the currently active mode.
 */
export function getCurrentMode() {
  return currentMode;
}
