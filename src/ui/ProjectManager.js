// src/ui/ProjectManager.js
// ═══════════════════════════════════════════════════════════
//  ProjectManager — Save, Load, and New Project
//
//  Storage strategy (in priority order):
//  1. Auto-save  → localStorage key 'tg_autosave' every 30s + on change
//  2. Manual save → downloads a .techyguide.json file to disk
//  3. Open       → loads a .techyguide.json file from disk
//  4. New        → confirms with user, then clears workspace + sprites
// ═══════════════════════════════════════════════════════════

import * as Blockly from 'blockly';
import spriteStore from '../engine/SpriteStore.js';

// ── Constants ─────────────────────────────────────────────
const AUTOSAVE_KEY      = 'tg_autosave';
const AUTOSAVE_META_KEY = 'tg_autosave_meta';
const AUTOSAVE_INTERVAL = 30_000; // 30 seconds
const FILE_EXTENSION    = '.techyguide.json';
const FORMAT_VERSION    = 1;

// ── State ──────────────────────────────────────────────────
let _workspace      = null;
let _autosaveTimer  = null;
let _isDirty        = false;
let _currentProject = null; // { name, savedAt } | null

// ── Init ───────────────────────────────────────────────────

/**
 * Call once after Blockly workspace is initialised.
 * @param {Blockly.Workspace} workspace
 */
export function initProjectManager(workspace) {
  _workspace = workspace;

  const structural = [
    Blockly.Events.BLOCK_CREATE,
    Blockly.Events.BLOCK_DELETE,
    Blockly.Events.BLOCK_MOVE,
    Blockly.Events.BLOCK_CHANGE,
    Blockly.Events.BLOCK_DRAG,
  ];

  workspace.addChangeListener((e) => {
    if (structural.includes(e.type)) {
      _setDirty(true);
    }
  });

  _autosaveTimer = setInterval(_autoSave, AUTOSAVE_INTERVAL);

  _restoreAutoSave();
}

// ── Project serialisation ──────────────────────────────────

function _serialiseProject(projectName = 'Untitled Project') {
  if (!_workspace) throw new Error('Workspace not initialised');

  const workspaceXml = Blockly.Xml.domToText(
    Blockly.Xml.workspaceToDom(_workspace)
  );

  const sprites = spriteStore.getAllSprites?.() ?? [];
  const spriteData = sprites.map(s => ({
    id:            s.id,
    name:          s.name,
    x:             s.x,
    y:             s.y,
    direction:     s.direction,
    size:          s.size,
    visible:       s.visible,
    rotationStyle: s.rotationStyle,
    costumes:      s.costumes ?? [],
    sounds:        s.sounds   ?? [],
    workspaceState: s.workspaceState ?? null,
  }));

  const backdrop = spriteStore.getCurrentBackdrop?.() ?? null;

  return {
    version:   FORMAT_VERSION,
    name:      projectName,
    savedAt:   new Date().toISOString(),
    workspace: workspaceXml,
    sprites:   spriteData,
    backdrop:  backdrop,
  };
}

function _deserialiseProject(data) {
  if (!_workspace) throw new Error('Workspace not initialised');
  if (data.version !== FORMAT_VERSION) {
    console.warn('[ProjectManager] Version mismatch — attempting load anyway');
  }

  _workspace.clear();
  spriteStore.clearAll?.();

  if (data.workspace?.trim()) {
    try {
      Blockly.Xml.domToWorkspace(
        Blockly.utils.xml.textToDom(data.workspace),
        _workspace
      );
    } catch (e) {
      console.error('[ProjectManager] Failed to restore workspace:', e);
    }
  }

  if (Array.isArray(data.sprites)) {
    for (const s of data.sprites) {
      const sprite = spriteStore.addSprite?.(s.name, {
        costumeSrc: s.costumes?.[0]?.src,
      });
      if (sprite) {
        sprite.x             = s.x             ?? 0;
        sprite.y             = s.y             ?? 0;
        sprite.direction     = s.direction     ?? 90;
        sprite.size          = s.size          ?? 100;
        sprite.visible       = s.visible       ?? true;
        sprite.rotationStyle = s.rotationStyle ?? 'all around';
        if (s.workspaceState) {
          spriteStore.saveWorkspaceState?.(sprite.id, s.workspaceState);
        }
      }
    }
  }

  if (data.backdrop) {
    spriteStore.setBackdrop?.(data.backdrop);
  }

  _currentProject = { name: data.name, savedAt: data.savedAt };
  _setDirty(false);
  _updateTitleBar();
}

// ── Auto-save ──────────────────────────────────────────────

function _autoSave() {
  if (!_isDirty || !_workspace) return;
  try {
    const name = _currentProject?.name ?? 'Untitled Project';
    const data = _serialiseProject(name);
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    localStorage.setItem(AUTOSAVE_META_KEY, JSON.stringify({
      savedAt: data.savedAt,
      name:    data.name,
    }));
    _setDirty(false);
    console.log('[ProjectManager] Auto-saved at', data.savedAt);
  } catch (e) {
    console.warn('[ProjectManager] Auto-save failed:', e.message);
  }
}

function _restoreAutoSave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const meta = JSON.parse(localStorage.getItem(AUTOSAVE_META_KEY) ?? '{}');
    const when = meta.savedAt
      ? new Date(meta.savedAt).toLocaleString()
      : 'unknown time';

    const blocks = _workspace?.getAllBlocks(false) ?? [];
    if (blocks.length > 0) return;

    const restore = confirm(
      `A previous project "${meta.name ?? 'Untitled'}" was auto-saved at ${when}.\n\nRestore it?`
    );
    if (restore) {
      _deserialiseProject(data);
      _showToast('Project restored from auto-save');
    }
  } catch (e) {
    console.warn('[ProjectManager] Auto-save restore failed:', e.message);
  }
}

// ── Public API ─────────────────────────────────────────────

/**
 * Save project to disk as a .techyguide.json file.
 */
export function saveProjectToFile() {
  try {
    const name = _currentProject?.name ?? _promptProjectName();
    const data = _serialiseProject(name);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);

    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}${FILE_EXTENSION}`;
    a.click();

    URL.revokeObjectURL(url);
    _currentProject = { name, savedAt: data.savedAt };
    _setDirty(false);
    _updateTitleBar();
    _showToast(`Saved as "${a.download}"`);
  } catch (e) {
    console.error('[ProjectManager] Save failed:', e);
    _showToast('Save failed — check console', 'error');
  }
}

/**
 * Open a file picker to load a .techyguide.json project.
 */
export function openProjectFromFile() {
  if (_isDirty) {
    const ok = confirm('You have unsaved changes. Open a different project anyway?');
    if (!ok) return;
  }

  const input    = document.createElement('input');
  input.type     = 'file';
  input.accept   = '.json,.techyguide.json';
  input.onchange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      _deserialiseProject(data);
      _showToast(`Opened "${data.name ?? file.name}"`);
    } catch (err) {
      console.error('[ProjectManager] Open failed:', err);
      _showToast('Failed to open file — invalid format', 'error');
    }
  };
  input.click();
}

/**
 * Create a new empty project. Confirms if there are unsaved changes.
 */
export function newProject() {
  if (_isDirty) {
    const choice = confirm(
      'You have unsaved changes.\n\nSave before creating a new project?'
    );
    if (choice) {
      saveProjectToFile();
      return;
    }
    const discard = confirm('Discard changes and create new project?');
    if (!discard) return;
  }

  _workspace?.clear();
  spriteStore.clearAll?.();
  _currentProject = null;
  _setDirty(false);
  _updateTitleBar();
  _showToast('New project created');
}

// ── Helpers ────────────────────────────────────────────────

function _setDirty(dirty) {
  _isDirty = dirty;
  const indicator = document.getElementById('unsavedIndicator');
  if (indicator) indicator.style.display = dirty ? 'inline' : 'none';
}

function _updateTitleBar() {
  const nameEl = document.getElementById('projectNameDisplay');
  if (nameEl) {
    nameEl.textContent = _currentProject?.name ?? 'Untitled Project';
  }
}

function _promptProjectName() {
  return prompt('Project name:', _currentProject?.name ?? 'My ESP32 Project')
      ?? 'My ESP32 Project';
}

function _showToast(message, type = 'success') {
  document.getElementById('tg-toast')?.remove();

  const toast = document.createElement('div');
  toast.id    = 'tg-toast';
  toast.textContent = message;
  toast.style.cssText = [
    'position:fixed',
    'bottom:24px',
    'left:50%',
    'transform:translateX(-50%)',
    `background:${type === 'error' ? '#FC2F2F' : '#1E1E3F'}`,
    'color:#fff',
    'padding:10px 20px',
    'border-radius:8px',
    'font-size:13px',
    'font-weight:600',
    'z-index:9999',
    'box-shadow:0 4px 16px rgba(0,0,0,0.25)',
    'transition:opacity 0.3s',
    'pointer-events:none',
  ].join(';');

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

export function getProjectName() {
  return _currentProject?.name ?? 'Untitled Project';
}

export function isDirty() {
  return _isDirty;
}
