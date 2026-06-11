// EventBus
class EventBus {
  constructor() {
    this._handlers = {};
  }

  on(event, handler) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
    return () => {
      this._handlers[event] = this._handlers[event].filter(h => h !== handler);
    };
  }

  emit(event, data) {
    const handlers = this._handlers[event] || [];
    handlers.forEach(h => h(data));
  }

  clear() {
    this._handlers = {};
  }
}

const eventBus = new EventBus();

export const Events = {
  GREEN_FLAG:        'GREEN_FLAG',
  STOP_ALL:          'STOP_ALL',
  KEY_PRESS:         'KEY_PRESS',
  BROADCAST:         'BROADCAST',
  CLONE_CREATED:     'CLONE_CREATED',
  BACKDROP_SWITCHED: 'BACKDROP_SWITCHED',
};

export default eventBus;
