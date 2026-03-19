/**
 * BlockInterpreter — Runtime engine that walks Blockly block trees
 * and drives sprite actions. Supports concurrent threads, yielding,
 * and event-based hat blocks.
 */

import eventBus, { Events } from './EventBus.js';

/**
 * A Thread represents a single running script (chain of blocks).
 * Threads can yield (wait, glide) and resume.
 */
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

  /**
   * Execute a block and all blocks connected after it.
   */
  async _executeBlock(block) {
    let current = block;
    while (current) {
      this._checkCancelled();
      await this._dispatch(current);
      current = current.getNextBlock();
    }
  }

  /**
   * Evaluate a value input (reporter block or shadow).
   */
  _evalValue(block, inputName, defaultValue) {
    const input = block.getInput(inputName);
    if (!input) return defaultValue;

    const targetBlock = input.connection?.targetBlock();
    if (!targetBlock) return defaultValue;

    return this._evalReporter(targetBlock);
  }

  /**
   * Evaluate a reporter block (returns a value).
   */
  _evalReporter(block) {
    if (!block) return '';

    const type = block.type;

    // ── Math / Text shadow blocks ──
    if (type === 'math_number') return Number(block.getFieldValue('NUM')) || 0;
    if (type === 'text') return block.getFieldValue('TEXT') || '';
    if (type === 'logic_boolean') return block.getFieldValue('BOOL') === 'TRUE';

    // ── Motion reporters ──
    if (type === 'x_position') return this.sprite.x;
    if (type === 'y_position') return this.sprite.y;
    if (type === 'direction_reporter') return this.sprite.direction;

    // ── Sensing reporters ──
    if (type === 'mouse_x') return this.interpreter.renderer?.mouseX || 0;
    if (type === 'mouse_y') return this.interpreter.renderer?.mouseY || 0;
    if (type === 'answer_block') return this.interpreter.answer || '';
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
        return Math.sqrt(dx*dx + dy*dy) < 30 * (this.sprite.size / 100);
      }
      return false;
    }

    // ── Math operations ──
    if (type === 'math_arithmetic') {
      const a = this._evalValue(block, 'A', 0);
      const b = this._evalValue(block, 'B', 0);
      const op = block.getFieldValue('OP');
      switch (op) {
        case 'ADD': return a + b;
        case 'MINUS': return a - b;
        case 'MULTIPLY': return a * b;
        case 'DIVIDE': return b !== 0 ? a / b : 0;
        case 'POWER': return Math.pow(a, b);
        default: return 0;
      }
    }
    if (type === 'math_random_int') {
      const from = this._evalValue(block, 'FROM', 1);
      const to = this._evalValue(block, 'TO', 10);
      return Math.floor(Math.random() * (to - from + 1)) + from;
    }
    if (type === 'math_modulo') {
      const dividend = this._evalValue(block, 'DIVIDEND', 0);
      const divisor = this._evalValue(block, 'DIVISOR', 1);
      return divisor !== 0 ? dividend % divisor : 0;
    }
    if (type === 'math_round') {
      const num = this._evalValue(block, 'NUM', 0);
      return Math.round(num);
    }

    // ── Logic operations ──
    if (type === 'logic_compare') {
      const a = this._evalValue(block, 'A', 0);
      const b = this._evalValue(block, 'B', 0);
      const op = block.getFieldValue('OP');
      switch (op) {
        case 'EQ': return a == b;
        case 'NEQ': return a != b;
        case 'LT': return a < b;
        case 'LTE': return a <= b;
        case 'GT': return a > b;
        case 'GTE': return a >= b;
        default: return false;
      }
    }
    if (type === 'logic_operation') {
      const a = this._evalValue(block, 'A', false);
      const b = this._evalValue(block, 'B', false);
      const op = block.getFieldValue('OP');
      return op === 'AND' ? a && b : a || b;
    }
    if (type === 'logic_negate') {
      return !this._evalValue(block, 'BOOL', false);
    }

    // ── Text operations ──
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
      const val = this._evalValue(block, 'VALUE', '');
      return String(val).length;
    }

    // ── Variables ──
    if (type === 'variables_get') {
      const varName = block.getFieldValue('VAR');
      return this.interpreter.variables[varName] ?? 0;
    }

    return '';
  }

  /**
   * Dispatch a statement block to the correct handler.
   */
  async _dispatch(block) {
    const type = block.type;
    const sprite = this.sprite;

    switch (type) {
      // ── Motion ──
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

      case 'glide_to_xy': {
        const secs = this._evalValue(block, 'SECS', 1);
        const gx = this._evalValue(block, 'X', 0);
        const gy = this._evalValue(block, 'Y', 0);
        await sprite.glideToXY(gx, gy, secs);
        this._checkCancelled();
        break;
      }

      case 'point_in_direction':
        sprite.pointInDirection(this._evalValue(block, 'DIRECTION', 90));
        break;

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

      // ── Looks ──
      case 'say_for_secs': {
        const msg = this._evalValue(block, 'MESSAGE', 'Hello!');
        const secs = this._evalValue(block, 'SECS', 2);
        sprite.say(msg, secs);
        await this._wait(secs * 1000);
        break;
      }

      case 'say_block':
        sprite.say(this._evalValue(block, 'MESSAGE', 'Hello!'));
        break;

      case 'think_for_secs': {
        const msg = this._evalValue(block, 'MESSAGE', 'Hmm...');
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

      // ── Control ──
      case 'wait_seconds': {
        const dur = this._evalValue(block, 'DURATION', 1);
        await this._wait(dur * 1000);
        break;
      }

      case 'repeat_block': {
        const times = this._evalValue(block, 'TIMES', 10);
        const substackBlock = block.getInputTargetBlock('SUBSTACK');
        for (let i = 0; i < times; i++) {
          this._checkCancelled();
          if (substackBlock) await this._executeBlock(substackBlock);
          await this._yieldFrame();
        }
        break;
      }

      case 'forever_block': {
        const substackBlock = block.getInputTargetBlock('SUBSTACK');
        while (true) {
          this._checkCancelled();
          if (substackBlock) await this._executeBlock(substackBlock);
          await this._yieldFrame();
        }
        break; // unreachable, but for clarity
      }

      case 'if_block': {
        const cond = this._evalValue(block, 'CONDITION', false);
        if (cond) {
          const sub = block.getInputTargetBlock('SUBSTACK');
          if (sub) await this._executeBlock(sub);
        }
        break;
      }

      case 'if_else_block': {
        const cond = this._evalValue(block, 'CONDITION', false);
        if (cond) {
          const sub = block.getInputTargetBlock('SUBSTACK');
          if (sub) await this._executeBlock(sub);
        } else {
          const sub2 = block.getInputTargetBlock('SUBSTACK2');
          if (sub2) await this._executeBlock(sub2);
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

      // ── Events ──
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

      // ── Variables ──
      case 'variables_set': {
        const varName = block.getFieldValue('VAR');
        const val = this._evalValue(block, 'VALUE', 0);
        this.interpreter.variables[varName] = val;
        break;
      }

      case 'variables_change': {
        const varName = block.getFieldValue('VAR');
        const change = this._evalValue(block, 'VALUE', 1);
        this.interpreter.variables[varName] = (this.interpreter.variables[varName] || 0) + change;
        break;
      }

      default:
        // Unknown block type — skip
        console.log('Unknown block type:', type);
        break;
    }
  }

  /**
   * Yield one animation frame — lets the renderer draw.
   */
  _yieldFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
  }

  /**
   * Wait for a duration in ms, checking for cancellation.
   */
  _wait(ms) {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = () => {
        if (this._cancelled) {
          resolve();
          return;
        }
        if (Date.now() - start >= ms) {
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }
}

/**
 * BlockInterpreter — manages all threads across all sprites.
 */
export class BlockInterpreter {
  constructor(spriteStore, workspace) {
    this.spriteStore = spriteStore;
    this.workspace = workspace;
    this.renderer = null;
    this.threads = [];
    this.variables = {};
    this.answer = '';
    this.keysDown = new Set();

    // ── Keyboard tracking ──
    document.addEventListener('keydown', (e) => {
      this.keysDown.add(e.key);
      eventBus.emit(Events.KEY_PRESS, e.key);
    });
    document.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.key);
    });

    // ── Stop all handler ──
    eventBus.on(Events.STOP_ALL, () => this.stopAll());
  }

  setRenderer(renderer) {
    this.renderer = renderer;
  }

  /**
   * Start all scripts triggered by the green flag.
   * Finds all `when_flag_clicked` hat blocks in all sprites' workspaces.
   */
  startAll() {
    this.stopAll();

    const sprites = this.spriteStore.getAllSprites();
    const currentSelected = this.spriteStore.getSelectedSprite();

    for (const sprite of sprites) {
      // We need to load each sprite's workspace to find hat blocks.
      // For the currently selected sprite, use the live workspace.
      // For other sprites, use their saved workspace state.
      if (sprite.id === currentSelected?.id) {
        // Use the live workspace
        this._startHatBlocksForSprite(sprite, this.workspace);
      } else if (sprite.workspaceState) {
        // For non-selected sprites, we need to load their workspace temporarily
        // For now, we only support executing blocks for the selected sprite
        // (multi-sprite execution will require workspace per sprite)
        // TODO: Full multi-sprite workspace support
      }
    }

    eventBus.emit(Events.GREEN_FLAG);
  }

  /**
   * Find and start all hat blocks for a given sprite in a workspace.
   */
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
        const key = block.getFieldValue('KEY');
        const nextBlock = block.getNextBlock();
        if (nextBlock) {
          // Register key press handler
          const unsub = eventBus.on(Events.KEY_PRESS, (pressedKey) => {
            if (pressedKey === key || (key === 'space' && pressedKey === ' ')) {
              const thread = new Thread(sprite, nextBlock, this);
              this.threads.push(thread);
              thread.run();
            }
          });
          // Store unsubscribe so we can clean up on stop
          this._keyUnsubs = this._keyUnsubs || [];
          this._keyUnsubs.push(unsub);
        }
      }

      if (block.type === 'when_sprite_clicked') {
        const nextBlock = block.getNextBlock();
        if (nextBlock && this.renderer) {
          this.renderer.onSpriteClick((clickedSprite) => {
            if (clickedSprite.id === sprite.id) {
              const thread = new Thread(sprite, nextBlock, this);
              this.threads.push(thread);
              thread.run();
            }
          });
        }
      }

      if (block.type === 'when_receive') {
        const msgName = block.getFieldValue('MESSAGE');
        const nextBlock = block.getNextBlock();
        if (nextBlock) {
          const unsub = eventBus.on(Events.BROADCAST, (broadcastMsg) => {
            if (broadcastMsg === msgName) {
              const thread = new Thread(sprite, nextBlock, this);
              this.threads.push(thread);
              thread.run();
            }
          });
          this._broadcastUnsubs = this._broadcastUnsubs || [];
          this._broadcastUnsubs.push(unsub);
        }
      }
    }
  }

  /**
   * Stop all running threads.
   */
  stopAll() {
    this.threads.forEach(t => t.stop());
    this.threads = [];

    // Unsubscribe key/broadcast handlers
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
