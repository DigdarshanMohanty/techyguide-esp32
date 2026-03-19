/**
 * EventBus — Simple pub/sub for runtime events.
 * Events: GREEN_FLAG, STOP_ALL, KEY_PRESS, SPRITE_CLICK, BROADCAST
 */

class EventBus {
  constructor() {
    this._handlers = {};
  }

  /**
   * Register a handler for an event.
   * @returns {Function} unsubscribe function
   */
  on(event, handler) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
    return () => {
      this._handlers[event] = this._handlers[event].filter(h => h !== handler);
    };
  }

  /**
   * Emit an event with optional data.
   */
  emit(event, data) {
    const handlers = this._handlers[event] || [];
    handlers.forEach(h => h(data));
  }

  /**
   * Remove all handlers.
   */
  clear() {
    this._handlers = {};
  }
}

// Singleton
const eventBus = new EventBus();

// Event constants
export const Events = {
  GREEN_FLAG: 'GREEN_FLAG',
  STOP_ALL: 'STOP_ALL',
  KEY_PRESS: 'KEY_PRESS',
  KEY_DOWN: 'KEY_DOWN',
  SPRITE_CLICK: 'SPRITE_CLICK',
  BROADCAST: 'BROADCAST',
};

export default eventBus;
