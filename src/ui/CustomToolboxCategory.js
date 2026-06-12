import * as Blockly from 'blockly';

const CATEGORY_COLOURS = {
  'Motion':    '#4C97FF',
  'Looks':     '#9966FF',
  'Sound':     '#CF63CF',
  'Events':    '#FFBF00',
  'Control':   '#FFAB19',
  'Sensing':   '#5CB1D6',
  'Operators': '#59C059',
  'Variables': '#FF8C1A',
  'ESP32':     '#FF6680',
  'My Blocks': '#FF6680',
};

const CATEGORY_LABELS = {
  'My Blocks': 'Mine',
  'Operators': 'Ops',
  'Variables': 'Vars',
};

const CATEGORY_ICONS = {
  'Motion':    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  'Looks':     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3" fill="white" stroke="none"/></svg>`,
  'Sound':     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="white"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`,
  'Events':    `<svg width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>`,
  'Control':   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 8 12 12 14 14"/></svg>`,
  'Sensing':   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  'Operators': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><line x1="12" y1="5" x2="12" y2="19"/></svg>`,
  'Variables': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M17.5 14v7M14 17.5h7"/></svg>`,
  'ESP32':     `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>`,
  'My Blocks': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
};

export class CustomToolboxCategory extends Blockly.ToolboxCategory {
  constructor(categoryDef, toolbox, opt_parent) {
    super(categoryDef, toolbox, opt_parent);
  }

  /** @override */
  createDom_() {
    // 1. Run super — this sets up htmlDiv_, rowDiv_, and ALL internal Blockly
    //    state including the click ID that the toolbox uses for dispatching
    super.createDom_();

    const name   = this.name_;
    const colour = CATEGORY_COLOURS[name] || '#888888';
    const icon   = CATEGORY_ICONS[name]   || '';
    const label  = CATEGORY_LABELS[name]  || name;

    // 2. In Blockly v12, htmlDiv_ === rowDiv_ (same element).
    //    The toolbox assigned a click ID to htmlDiv_ DURING super().
    //    We must NOT use innerHTML = '' because that wipes child nodes
    //    but preserves attributes — however the real issue is that
    //    super() builds children Blockly needs for its own state tracking.
    //
    //    SAFE APPROACH: append our visual elements as children.
    //    Remove only Blockly's visual children (colour strip, label span).
    //    Keep any element that has an ID (that's the click target anchor).

    // Remove Blockly's default visual children — but preserve ID-bearing nodes
    const children = Array.from(this.htmlDiv_.children);
    for (const child of children) {
      // Keep elements with IDs — Blockly uses these for click routing
      if (!child.id) {
        child.remove();
      }
    }

    // 3. Fix height constraint — super() sets inline height:22px via JS
    this.htmlDiv_.style.height       = 'auto';
    this.htmlDiv_.style.minHeight    = '0';
    this.htmlDiv_.style.padding      = '6px 0';

    // 4. Append our visual pill AFTER any ID-bearing Blockly children
    const pill = document.createElement('div');
    pill.className = 'tg-cat-pill';
    pill.innerHTML = `
      <div class="tg-cat-circle" style="background:${colour}">
        ${icon}
      </div>
      <span class="tg-cat-label">${label}</span>
    `;
    this.htmlDiv_.appendChild(pill);

    this._categoryColour = colour;
    return this.htmlDiv_;
  }

  /** @override */
  addColourBorder_(_colour) {}

  /** @override */
  setSelected(isSelected) {
    const pill   = this.htmlDiv_?.querySelector('.tg-cat-pill');
    const circle = this.htmlDiv_?.querySelector('.tg-cat-circle');

    if (pill)   pill.classList.toggle('tg-cat-pill--active', isSelected);
    if (circle) circle.classList.toggle('tg-cat-circle--active', isSelected);

    if (this.htmlDiv_) {
      Blockly.utils.aria.setState(
        this.htmlDiv_,
        Blockly.utils.aria.State.SELECTED,
        isSelected,
      );
    }
  }
}

Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX_ITEM,
  Blockly.ToolboxCategory.registrationName,
  CustomToolboxCategory,
  true,
);