// Block Interpreter

import eventBus, { Events } from './EventBus.js';
import { soundEngine } from './SoundEngine.js';

class Thread {
  constructor(sprite, topBlock, interpreter) {
    this.sprite = sprite;
    this.topBlock = topBlock;
    this.interpreter = interpreter;
    this.running = false;
    this._cancelled = false;
  }

  async run() {
    this.running = true;
    this._cancelled = false;
    try {
      await this._executeBlock(this.topBlock);
    } catch (e) {
      if (e.message !== 'THREAD_STOPPED') {
        console.error('Thread error:', e);
      }
    }
    this.running = false;
  }

  stop() {
    this._cancelled = true;
    this.running = false;
  }

  _checkCancelled() {
    if (this._cancelled) throw new Error('THREAD_STOPPED');
  }

  async _executeBlock(block) {
    let current = block;
    while (current) {
      this._checkCancelled();
      await this._dispatch(current);
      current = current.getNextBlock();
    }
  }

  _evalValue(block, inputName, defaultValue) {
    const input = block.getInput(inputName);
    if (!input) return defaultValue;
    const targetBlock = input.connection?.targetBlock();
    if (!targetBlock) return defaultValue;
    return this._evalReporter(targetBlock);
  }

  _evalReporter(block) {
    if (!block) return '';

    const type = block.type;

    // Primitives
    if (type === 'math_number') return Number(block.getFieldValue('NUM')) || 0;
    if (type === 'text')        return block.getFieldValue('TEXT') || '';
    if (type === 'logic_boolean') return block.getFieldValue('BOOL') === 'TRUE';

    // Motion reporters
    if (type === 'x_position')        return this.sprite.x;
    if (type === 'y_position')        return this.sprite.y;
    if (type === 'direction_reporter') return this.sprite.direction;

    // Looks reporters
    if (type === 'size_reporter') return this.sprite.size;

    if (type === 'costume_reporter') {
      const prop = block.getFieldValue('NUMBER_NAME');
      if (prop === 'number') return this.sprite.currentCostumeIndex + 1;
      if (prop === 'name')   return this.sprite.getCurrentCostume()?.name || '';
      return '';
    }

    if (type === 'backdrop_reporter') {
      const store   = this.interpreter.spriteStore;
      const current = store.getCurrentBackdrop?.();
      const prop    = block.getFieldValue('NUMBER_NAME');
      if (prop === 'name')   return current?.name || '';
      if (prop === 'number') {
        const all = store.getBackdrops?.() || [];
        return all.findIndex(b => b.name === current?.name) + 1;
      }
      return '';
    }

    // Sound reporters
    if (type === 'volume_reporter') return soundEngine.getVolume();

    // Sensing reporters
    if (type === 'mouse_x') return this.interpreter.renderer?.mouseX || 0;
    if (type === 'mouse_y') return this.interpreter.renderer?.mouseY || 0;
    if (type === 'mouse_down') return this.interpreter.renderer?.mouseDown || false;
    if (type === 'answer_block') return this.interpreter.answer || '';
    if (type === 'loudness') return this.interpreter._loudness || 0;

    if (type === 'timer_reporter') {
      return Math.round(((Date.now() - this.interpreter._timerStart) / 1000) * 10) / 10;
    }

    if (type === 'current_date') {
      const menu = block.getFieldValue('CURRENTMENU');
      const now  = new Date();
      switch (menu) {
        case 'YEAR':      return now.getFullYear();
        case 'MONTH':     return now.getMonth() + 1;
        case 'DATE':      return now.getDate();
        case 'DAYOFWEEK': return now.getDay() + 1;
        case 'HOUR':      return now.getHours();
        case 'MINUTE':    return now.getMinutes();
        case 'SECOND':    return now.getSeconds();
        default:          return 0;
      }
    }

    if (type === 'days_since_2000') {
      const y2k = new Date('2000-01-01T00:00:00Z').getTime();
      return Math.floor((Date.now() - y2k) / 86400000);
    }

    if (type === 'username_reporter') return 'User';

    if (type === 'of_stage') {
      const prop  = block.getFieldValue('PROPERTY');
      const store = this.interpreter.spriteStore;
      if (prop === 'backdrop #') {
        const all = store.getBackdrops?.() || [];
        const cur = store.getCurrentBackdrop?.();
        return all.findIndex(b => b.name === cur?.name) + 1;
      }
      if (prop === 'backdrop name') return store.getCurrentBackdrop?.()?.name || '';
      if (prop === 'volume')        return soundEngine.getVolume();
      return '';
    }

    if (type === 'key_pressed') {
      const key = block.getFieldValue('KEY');
      return this.interpreter.keysDown.has(key);
    }

    if (type === 'touching') {
      const menu = block.getFieldValue('TOUCHMENU');
      if (menu === '_edge_') return this.sprite.isTouchingEdge();
      if (menu === '_mouse_') {
        const mx = this.interpreter.renderer?.mouseX || 0;
        const my = this.interpreter.renderer?.mouseY || 0;
        const dx = this.sprite.x - mx;
        const dy = this.sprite.y - my;
        return Math.sqrt(dx * dx + dy * dy) < 30 * (this.sprite.size / 100);
      }
      return false;
    }

    if (type === 'touching_color') return false;
    if (type === 'color_is_touching') return false;

    if (type === 'distance_to') {
      const menu = block.getFieldValue('DISTMENU');
      if (menu === '_mouse_') {
        const mx = this.interpreter.renderer?.mouseX || 0;
        const my = this.interpreter.renderer?.mouseY || 0;
        const dx = this.sprite.x - mx;
        const dy = this.sprite.y - my;
        return Math.round(Math.sqrt(dx * dx + dy * dy));
      }
      return 0;
    }

    // Math
    if (type === 'math_arithmetic') {
      const a  = this._evalValue(block, 'A', 0);
      const b  = this._evalValue(block, 'B', 0);
      const op = block.getFieldValue('OP');
      switch (op) {
        case 'ADD':      return a + b;
        case 'MINUS':    return a - b;
        case 'MULTIPLY': return a * b;
        case 'DIVIDE':   return b !== 0 ? a / b : 0;
        case 'POWER':    return Math.pow(a, b);
        default:         return 0;
      }
    }
    if (type === 'math_random_int') {
      const from = this._evalValue(block, 'FROM', 1);
      const to   = this._evalValue(block, 'TO', 10);
      return Math.floor(Math.random() * (to - from + 1)) + from;
    }
    if (type === 'math_modulo') {
      const dividend = this._evalValue(block, 'DIVIDEND', 0);
      const divisor  = this._evalValue(block, 'DIVISOR', 1);
      return divisor !== 0 ? dividend % divisor : 0;
    }
    if (type === 'math_round') {
      return Math.round(this._evalValue(block, 'NUM', 0));
    }

    // Logic
    if (type === 'logic_compare') {
      const a  = this._evalValue(block, 'A', 0);
      const b  = this._evalValue(block, 'B', 0);
      const op = block.getFieldValue('OP');
      switch (op) {
        case 'EQ':  return a == b;
        case 'NEQ': return a != b;
        case 'LT':  return a < b;
        case 'LTE': return a <= b;
        case 'GT':  return a > b;
        case 'GTE': return a >= b;
        default:    return false;
      }
    }
    if (type === 'logic_operation') {
      const a  = this._evalValue(block, 'A', false);
      const b  = this._evalValue(block, 'B', false);
      const op = block.getFieldValue('OP');
      return op === 'AND' ? a && b : a || b;
    }
    if (type === 'logic_negate') {
      return !this._evalValue(block, 'BOOL', false);
    }

    // Text
    if (type === 'text_join') {
      let result = '';
      let i = 0;
      while (block.getInput('ADD' + i)) {
        result += this._evalValue(block, 'ADD' + i, '');
        i++;
      }
      return result;
    }
    if (type === 'text_length') {
      return String(this._evalValue(block, 'VALUE', '')).length;
    }

    // Variables
    if (type === 'variables_get') {
      const varName = block.getFieldValue('VAR');
      return this.interpreter.variables[varName] ?? 0;
    }

    return '';
  }

  async _dispatch(block) {
    const type   = block.type;
    const sprite = this.sprite;

    switch (type) {

      // ── MOTION ─────────────────────────────────────────

      case 'move_steps':
        sprite.moveSteps(this._evalValue(block, 'STEPS', 10));
        await this._yieldFrame();
        break;

      case 'turn_right':
        sprite.turnRight(this._evalValue(block, 'DEGREES', 15));
        break;

      case 'turn_left':
        sprite.turnLeft(this._evalValue(block, 'DEGREES', 15));
        break;

      case 'go_to_xy':
        sprite.goToXY(
          this._evalValue(block, 'X', 0),
          this._evalValue(block, 'Y', 0)
        );
        break;

      case 'go_to': {
        const to = block.getFieldValue('TO');
        if (to === '_random_') {
          sprite.goToXY(
            Math.round((Math.random() * 480) - 240),
            Math.round((Math.random() * 360) - 180)
          );
        } else if (to === '_mouse_') {
          sprite.goToXY(
            this.interpreter.renderer?.mouseX || 0,
            this.interpreter.renderer?.mouseY || 0
          );
        }
        break;
      }

      case 'glide_to_xy': {
        const secs = this._evalValue(block, 'SECS', 1);
        await sprite.glideToXY(
          this._evalValue(block, 'X', 0),
          this._evalValue(block, 'Y', 0),
          secs
        );
        this._checkCancelled();
        break;
      }

      case 'glide_to': {
        const secs = this._evalValue(block, 'SECS', 1);
        const to   = block.getFieldValue('TO');
        let tx = sprite.x, ty = sprite.y;
        if (to === '_random_') {
          tx = Math.round((Math.random() * 480) - 240);
          ty = Math.round((Math.random() * 360) - 180);
        } else if (to === '_mouse_') {
          tx = this.interpreter.renderer?.mouseX || 0;
          ty = this.interpreter.renderer?.mouseY || 0;
        }
        await sprite.glideToXY(tx, ty, secs);
        this._checkCancelled();
        break;
      }

      case 'point_in_direction':
        sprite.pointInDirection(this._evalValue(block, 'DIRECTION', 90));
        break;

      case 'point_towards': {
        const towards = block.getFieldValue('TOWARDS');
        if (towards === '_mouse_') {
          const mx  = this.interpreter.renderer?.mouseX || 0;
          const my  = this.interpreter.renderer?.mouseY || 0;
          const dx  = mx - sprite.x;
          const dy  = my - sprite.y;
          sprite.pointInDirection(Math.atan2(dx, dy) * (180 / Math.PI));
        }
        break;
      }

      case 'change_x':
        sprite.changeX(this._evalValue(block, 'DX', 10));
        break;

      case 'change_y':
        sprite.changeY(this._evalValue(block, 'DY', 10));
        break;

      case 'set_x':
        sprite.setX(this._evalValue(block, 'X', 0));
        break;

      case 'set_y':
        sprite.setY(this._evalValue(block, 'Y', 0));
        break;

      case 'if_on_edge_bounce': {
        const halfW = 24 * (sprite.size / 100);
        const halfH = 24 * (sprite.size / 100);
        let bounced = false;
        if (sprite.x - halfW <= -240 || sprite.x + halfW >= 240) {
          const rad    = (sprite.direction - 90) * (Math.PI / 180);
          const newRad = Math.atan2(Math.sin(rad), -Math.cos(rad));
          sprite.direction = (newRad * (180 / Math.PI) + 90 + 360) % 360;
          bounced = true;
        }
        if (sprite.y - halfH <= -180 || sprite.y + halfH >= 180) {
          const rad    = (sprite.direction - 90) * (Math.PI / 180);
          const newRad = Math.atan2(-Math.sin(rad), Math.cos(rad));
          sprite.direction = (newRad * (180 / Math.PI) + 90 + 360) % 360;
          bounced = true;
        }
        if (bounced) {
          sprite.x = Math.max(-240 + halfW, Math.min(240 - halfW, sprite.x));
          sprite.y = Math.max(-180 + halfH, Math.min(180 - halfH, sprite.y));
        }
        break;
      }

      case 'set_rotation_style':
        sprite.rotationStyle = block.getFieldValue('STYLE');
        break;

      // ── LOOKS ──────────────────────────────────────────

      case 'say_for_secs': {
        const msg  = this._evalValue(block, 'MESSAGE', 'Hello!');
        const secs = this._evalValue(block, 'SECS', 2);
        sprite.say(msg, secs);
        await this._wait(secs * 1000);
        break;
      }

      case 'say_block':
        sprite.say(this._evalValue(block, 'MESSAGE', 'Hello!'));
        break;

      case 'think_for_secs': {
        const msg  = this._evalValue(block, 'MESSAGE', 'Hmm...');
        const secs = this._evalValue(block, 'SECS', 2);
        sprite.think(msg, secs);
        await this._wait(secs * 1000);
        break;
      }

      case 'think_block':
        sprite.think(this._evalValue(block, 'MESSAGE', 'Hmm...'));
        break;

      case 'switch_costume':
        sprite.switchCostume(this._evalValue(block, 'COSTUME', 'cat'));
        break;

      case 'next_costume':
        sprite.nextCostume();
        break;

      case 'change_size':
        sprite.changeSize(this._evalValue(block, 'CHANGE', 10));
        break;

      case 'set_size':
        sprite.setSize(this._evalValue(block, 'SIZE', 100));
        break;

      case 'show_block':
        sprite.show();
        break;

      case 'hide_block':
        sprite.hide();
        break;

      case 'switch_backdrop': {
        const name  = block.getFieldValue('BACKDROP');
        const store = this.interpreter.spriteStore;
        const all   = store.getBackdrops?.() || [];
        const cur   = store.getCurrentBackdrop?.();
        const pool  = cur ? [cur, ...all.filter(b => b.name !== cur.name)] : all;
        const bd    = pool.find(b => b.name === name);
        if (bd) store.setBackdrop(bd);
        break;
      }

      case 'next_backdrop': {
        const store = this.interpreter.spriteStore;
        const all   = store.getBackdrops?.() || [];
        if (all.length === 0) break;
        const cur = store.getCurrentBackdrop?.();
        const idx  = cur ? all.findIndex(b => b.name === cur.name) : -1;
        const next = all[(idx + 1) % all.length];
        if (next) store.setBackdrop(next);
        break;
      }

      case 'change_effect': {
        const effect = block.getFieldValue('EFFECT');
        const change = this._evalValue(block, 'CHANGE', 0);
        sprite.effects = sprite.effects || {};
        sprite.effects[effect] = (sprite.effects[effect] || 0) + change;
        if (effect === 'GHOST') sprite.effects[effect] = Math.max(0, Math.min(100, sprite.effects[effect]));
        break;
      }

      case 'set_effect': {
        const effect = block.getFieldValue('EFFECT');
        sprite.effects = sprite.effects || {};
        sprite.effects[effect] = this._evalValue(block, 'VALUE', 0);
        break;
      }

      case 'go_to_layer': {
        const frontBack = block.getFieldValue('FRONT_BACK');
        const store = this.interpreter.spriteStore;
        if (frontBack === 'front') store.moveToFront?.(sprite.id);
        else                       store.moveToBack?.(sprite.id);
        break;
      }

      case 'go_layers': {
        const dir   = block.getFieldValue('FORWARD_BACKWARD');
        const num   = this._evalValue(block, 'NUM', 1);
        const delta = dir === 'forward' ? num : -num;
        this.interpreter.spriteStore.changeLayer?.(sprite.id, delta);
        break;
      }

      case 'take_stage_snapshot': {
        const canvas = this.interpreter.renderer?.app?.canvas;
        if (canvas) {
          const url = canvas.toDataURL('image/png');
          const a   = document.createElement('a');
          a.href     = url;
          a.download = 'stage_snapshot.png';
          a.click();
        }
        break;
      }

      // ── SOUND ──────────────────────────────────────────

      case 'play_sound_until_done': {
        const name = block.getFieldValue('SOUND_MENU');
        const url  = soundEngine.resolveUrl(name, sprite);
        if (url) await soundEngine.play(url, sprite.id, false);
        this._checkCancelled();
        break;
      }

      case 'start_sound': {
        const name = block.getFieldValue('SOUND_MENU');
        const url  = soundEngine.resolveUrl(name, sprite);
        if (url) soundEngine.play(url, sprite.id, false);
        break;
      }

      case 'play_sound_from_url': {
        const url  = block.getFieldValue('URL');
        const loop = block.getFieldValue('LOOP') === 'loop';
        if (url) soundEngine.play(url, sprite.id, loop);
        break;
      }

      case 'stop_all_sounds':
        soundEngine.stopAll();
        break;

      case 'change_sound_effect': {
        const effect = block.getFieldValue('EFFECT');
        const value  = this._evalValue(block, 'VALUE', 0);
        soundEngine.changeEffect(effect, value);
        break;
      }

      case 'set_sound_effect': {
        const effect = block.getFieldValue('EFFECT');
        const value  = this._evalValue(block, 'VALUE', 0);
        soundEngine.setEffect(effect, value);
        break;
      }

      case 'clear_sound_effects':
        soundEngine.clearEffects();
        break;

      case 'change_volume': {
        const delta = this._evalValue(block, 'VOLUME', 0);
        sprite.volume = Math.max(0, Math.min(100, (sprite.volume ?? 100) + delta));
        soundEngine.changeVolume(delta);
        break;
      }

      case 'set_volume': {
        const vol = this._evalValue(block, 'VOLUME', 100);
        sprite.volume = Math.max(0, Math.min(100, vol));
        soundEngine.setVolume(vol);
        break;
      }

      // ── CONTROL ────────────────────────────────────────

      case 'wait_seconds': {
        await this._wait(this._evalValue(block, 'DURATION', 1) * 1000);
        break;
      }

      case 'wait_until': {
        while (true) {
          this._checkCancelled();
          if (this._evalValue(block, 'CONDITION', false)) break;
          await this._yieldFrame();
        }
        break;
      }

      case 'repeat_block': {
        const times = this._evalValue(block, 'TIMES', 10);
        const sub   = block.getInputTargetBlock('SUBSTACK');
        for (let i = 0; i < times; i++) {
          this._checkCancelled();
          if (sub) await this._executeBlock(sub);
          await this._yieldFrame();
        }
        break;
      }

      case 'repeat_until': {
        const sub = block.getInputTargetBlock('SUBSTACK');
        while (true) {
          this._checkCancelled();
          if (this._evalValue(block, 'CONDITION', false)) break;
          if (sub) await this._executeBlock(sub);
          await this._yieldFrame();
        }
        break;
      }

      case 'forever_block': {
        const sub = block.getInputTargetBlock('SUBSTACK');
        while (true) {
          this._checkCancelled();
          if (sub) await this._executeBlock(sub);
          await this._yieldFrame();
        }
        break;
      }

      case 'if_block': {
        if (this._evalValue(block, 'CONDITION', false)) {
          const sub = block.getInputTargetBlock('SUBSTACK');
          if (sub) await this._executeBlock(sub);
        }
        break;
      }

      case 'if_else_block': {
        if (this._evalValue(block, 'CONDITION', false)) {
          const sub = block.getInputTargetBlock('SUBSTACK');
          if (sub) await this._executeBlock(sub);
        } else {
          const sub2 = block.getInputTargetBlock('SUBSTACK2');
          if (sub2) await this._executeBlock(sub2);
        }
        break;
      }

      case 'count_loop': {
        const varName = block.getFieldValue('VAR');
        const from    = this._evalValue(block, 'FROM', 1);
        const to      = this._evalValue(block, 'TO', 10);
        const step    = this._evalValue(block, 'STEP', 1) || 1;
        const sub     = block.getInputTargetBlock('SUBSTACK');
        const dir     = step > 0 ? 1 : -1;
        for (let i = from; dir > 0 ? i <= to : i >= to; i += step) {
          this._checkCancelled();
          this.interpreter.variables[varName] = i;
          if (sub) await this._executeBlock(sub);
          await this._yieldFrame();
        }
        break;
      }

      case 'stop_all': {
        const option = block.getFieldValue('STOP_OPTION');
        if (option === 'all') {
          eventBus.emit(Events.STOP_ALL);
        } else if (option === 'this script') {
          this.stop();
        }
        throw new Error('THREAD_STOPPED');
      }

      case 'create_clone': {
        const clone = this.interpreter.spriteStore.cloneSprite(sprite.id);
        if (clone) eventBus.emit(Events.CLONE_CREATED, clone);
        break;
      }

      case 'delete_clone': {
        if (sprite.isClone) {
          this.interpreter.spriteStore.deleteClone(sprite.id);
          this.stop();
          throw new Error('THREAD_STOPPED');
        }
        break;
      }

      // ── EVENTS (action blocks) ──────────────────────────

      case 'broadcast_block': {
        const msg = this._evalValue(block, 'MESSAGE', 'message1');
        eventBus.emit(Events.BROADCAST, msg);
        break;
      }

      case 'broadcast_and_wait': {
        const msg = this._evalValue(block, 'MESSAGE', 'message1');
        eventBus.emit(Events.BROADCAST, msg);
        await this._yieldFrame();
        break;
      }

      // ── SENSING (action blocks) ─────────────────────────

      case 'ask_and_wait': {
        const question = this._evalValue(block, 'QUESTION', '');
        this.interpreter.answer = await new Promise(resolve => {
          const ans = window.prompt(question || 'What is your answer?') || '';
          resolve(ans);
        });
        break;
      }

      case 'set_drag_mode':
        sprite.dragMode = block.getFieldValue('DRAG_MODE');
        break;

      case 'reset_timer':
        this.interpreter._timerStart = Date.now();
        break;

      // ── VARIABLES ──────────────────────────────────────

      case 'variables_set': {
        const varName = block.getFieldValue('VAR');
        this.interpreter.variables[varName] = this._evalValue(block, 'VALUE', 0);
        break;
      }

      case 'variables_change': {
        const varName = block.getFieldValue('VAR');
        const change  = this._evalValue(block, 'VALUE', 1);
        this.interpreter.variables[varName] = (this.interpreter.variables[varName] || 0) + change;
        break;
      }

      default:
        console.log('Unknown block type:', type);
        break;
    }
  }

  _yieldFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
  }

  _wait(ms) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (this._cancelled) { resolve(); return; }
        if (Date.now() - start >= ms) { resolve(); return; }
        this._waitRafId = requestAnimationFrame(check);
      };
      this._waitRafId = requestAnimationFrame(check);
    });
  }
}

export class BlockInterpreter {
  constructor(spriteStore, workspace) {
    this.spriteStore = spriteStore;
    this.workspace   = workspace;
    this.renderer    = null;
    this.threads     = [];
    this.variables   = {};
    this.answer      = '';
    this.keysDown    = new Set();
    this._keyUnsubs       = [];
    this._broadcastUnsubs = [];
    this._timerStart      = Date.now();
    this._loudness        = 0;

    this._onKeyDown = (e) => {
      this.keysDown.add(e.key);
      eventBus.emit(Events.KEY_PRESS, e.key);
    };
    this._onKeyUp = (e) => {
      this.keysDown.delete(e.key);
    };
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup',   this._onKeyUp);

    this._stopAllUnsub = eventBus.on(Events.STOP_ALL, () => this.stopAll());
  }

  destroy() {
    this.stopAll();
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup',   this._onKeyUp);
    if (this._stopAllUnsub) this._stopAllUnsub();
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  startAll() {
    this._timerStart = Date.now();
    this.stopAll();

    const sprites         = this.spriteStore.getAllSprites();
    const currentSelected = this.spriteStore.getSelectedSprite();

    for (const sprite of sprites) {
      if (sprite.id === currentSelected?.id) {
        this._startHatBlocksForSprite(sprite, this.workspace);
      }
    }

    eventBus.emit(Events.GREEN_FLAG);
  }

  _startHatBlocksForSprite(sprite, workspace) {
    const topBlocks = workspace.getTopBlocks(false);

    for (const block of topBlocks) {

      if (block.type === 'when_flag_clicked') {
        const nextBlock = block.getNextBlock();
        if (nextBlock) {
          const thread = new Thread(sprite, nextBlock, this);
          this.threads.push(thread);
          thread.run();
        }
      }

      if (block.type === 'when_key_pressed') {
        const key       = block.getFieldValue('KEY');
        const nextBlock = block.getNextBlock();
        if (nextBlock) {
          const unsub = eventBus.on(Events.KEY_PRESS, (pressedKey) => {
            if (pressedKey === key || (key === 'space' && pressedKey === ' ')) {
              const thread = new Thread(sprite, nextBlock, this);
              this.threads.push(thread);
              thread.run();
            }
          });
          this._keyUnsubs.push(unsub);
        }
      }

      if (block.type === 'when_sprite_clicked') {
        const nextBlock = block.getNextBlock();
        if (nextBlock && this.renderer) {
          this.renderer.onSpriteClick((clickedSprite) => {
            if (clickedSprite.id === sprite.id &&
                this.spriteStore.getAllSprites().some(s => s.id === sprite.id)) {
              const thread = new Thread(sprite, nextBlock, this);
              this.threads.push(thread);
              thread.run();
            }
          });
        }
      }

      if (block.type === 'when_receive') {
        const msgName   = block.getFieldValue('MESSAGE');
        const nextBlock = block.getNextBlock();
        if (nextBlock) {
          const unsub = eventBus.on(Events.BROADCAST, (broadcastMsg) => {
            if (broadcastMsg === msgName) {
              const thread = new Thread(sprite, nextBlock, this);
              this.threads.push(thread);
              thread.run();
            }
          });
          this._broadcastUnsubs.push(unsub);
        }
      }

      if (block.type === 'when_backdrop_switches') {
        const backdropName = block.getFieldValue('BACKDROP');
        const nextBlock    = block.getNextBlock();
        if (nextBlock) {
          const unsub = eventBus.on(Events.BACKDROP_SWITCHED, (name) => {
            if (name === backdropName) {
              const thread = new Thread(sprite, nextBlock, this);
              this.threads.push(thread);
              thread.run();
            }
          });
          this._broadcastUnsubs.push(unsub);
        }
      }

      if (block.type === 'when_gt') {
        const sense     = block.getFieldValue('SENSE');
        const threshold = Number(block.getFieldValue('VALUE')) || 10;
        const nextBlock = block.getNextBlock();
        if (nextBlock) {
          let fired = false;
          const checkId = setInterval(() => {
            const val = sense === 'TIMER'
              ? (Date.now() - this._timerStart) / 1000
              : this._loudness;
            if (val > threshold && !fired) {
              fired = true;
              const thread = new Thread(sprite, nextBlock, this);
              this.threads.push(thread);
              thread.run();
            } else if (val <= threshold) {
              fired = false;
            }
          }, 100);
          // Store for cleanup on stopAll
          this._broadcastUnsubs.push(() => clearInterval(checkId));
        }
      }

      if (block.type === 'when_clone_starts') {
        const nextBlock = block.getNextBlock();
        if (nextBlock) {
          const unsub = eventBus.on(Events.CLONE_CREATED, (clone) => {
            if (clone._parentId === sprite.id) {
              const thread = new Thread(clone, nextBlock, this);
              this.threads.push(thread);
              thread.run();
            }
          });
          this._broadcastUnsubs.push(unsub);
        }
      }
    }
  }

  stopAll() {
    this.threads.forEach(t => t.stop());
    this.threads = [];

    if (this._keyUnsubs) {
      this._keyUnsubs.forEach(fn => fn());
      this._keyUnsubs = [];
    }
    if (this._broadcastUnsubs) {
      this._broadcastUnsubs.forEach(fn => fn());
      this._broadcastUnsubs = [];
    }
  }
}
