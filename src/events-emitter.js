/*

EventsEmitter
  Object mixins(Object dest)
  Object prototype
    Number on(String event, Function callback[, {Number? times, Object? context}])
    Number once(String event, Function callback[, {Object? context}])
    Boolean off(Number listenerId)
    Boolean trigger(String event[, any... args])
    void remember(String|String[] event)
    void forget(String|String[] event)
    void clear(String[] events, [{Boolean? ghosts, Boolean? soft}])

//*/

! function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(function () { return factory(root); });
  } else if (typeof module === 'object' && module && module.exports) {
    module.exports = factory(root);
  } else if (typeof exports === 'object' && exports) {
    exports.EventsEmitter = factory(root);
  } else {
    root.EventsEmitter = factory(root);
  }
}(this, function (root) {
  'use strict';

  var nextListenerId = 1;


  function EventsEmitter() {}


  EventsEmitter.prototype.on = function EventsEmitterOn(event, callback, options) {
    if (arguments.length === 3) {
      if ('times' in options) {
        if (options.times < 1) return 0;
        return addListener(this, event, callback, options.context || root, options.times);
      }

      return addListener(this, event, callback, options.context || root);
    }

    return addListener(this, event, callback, root);
  };

  EventsEmitter.prototype.once = function EventsEmitterOnce(event, callback, options) {
    if (arguments.length === 3) {
      return addListener(this, event, callback, options.context || root, 1);
    }

    return addListener(this, event, callback, root, 1);
  };

  EventsEmitter.prototype.off = function EventsEmitterOff(listenerId) {
    if (!('_listeners' in this) || !(listenerId in this._listeners.callbacks)) {
      return false;
    }

    removeListener(this, listenerId);

    return true;
  };

  EventsEmitter.prototype.clear = function EventsEmitterClear(event, options) {
    if (!('_listeners' in this) || !('_events' in this)) {
      return;
    }

    var soft, i;

    switch (arguments.length) {
    case 0:
      for (event in this._events) {
        clearListeners(this, event, false);
      }
      break;

    case 1:
      if (typeof event === 'string') {
        clearListeners(this, event, false);
      } else if (Array.isArray(event)) {
        i = event.length;

        while (i--) {
          clearListeners(this, event[i], false);
        }
      } else {
        options = event;
        soft = options.soft || false;

        for (event in this._events) {
          if (options.ghosts) clearGhosts(this, event, soft);
          else clearListeners(this, event, soft);
        }
      }
      break;

    case 2:
      soft = options.soft || false;

      if (typeof event === 'string') {
        if (options.ghosts) clearGhosts(this, event, soft);
        else clearListeners(this, event, soft);
      } else if (Array.isArray(event)) {
        i = event.length;

        while (i--) {
          if (options.ghosts) clearGhosts(this, event[i], soft);
          else clearListeners(this, event[i], soft);
        }
      }
      break;
    }
  };

  EventsEmitter.prototype.listeners = function EventsEmitterListeners(event) {
    var listeners = [];

    if (!('_listeners' in this) || !('_events' in this)) {
      return listeners;
    }

    var callbacks = this._listeners.callbacks,
      listenersId = this._events[event];

    if (typeof listenersId === 'number') {
      if (listenersId in callbacks) {
        listeners.push(callbacks[listenersId]);
      }
    } else if (Array.isArray(listenersId)) {
      var length = listenersId.length;

      for (var i = 0; i < length; i += 1) {
        var listenerId = listenersId[i];

        if (listenerId in callbacks) {
          listeners.push(callbacks[listenerId]);
        }
      }
    }

    return listeners;
  };

  EventsEmitter.prototype.remember = function EventsEmitterRemember(event) {
    if (!('_memories' in this)) {
      this._memories = Object.create(null);
    }

    if (Array.isArray(event)) {
      var i = event.length;

      while (i--) {
        this._memories[event[i]] = null;
      }
    } else {
      this._memories[event] = null;
    }
  };

  EventsEmitter.prototype.forget = function EventsEmitterForget(event) {
    if (!('_memories' in this)) {
      return;
    }

    if (Array.isArray(event)) {
      var i = event.length;

      while (i--) {
        delete this._memories[event[i]];
      }
    } else {
      delete this._memories[event];
    }
  };

  EventsEmitter.prototype.trigger = function EventsEmitterTrigger(event) {
    var args = Array.prototype.slice.call(arguments, 1);

    if ('_memories' in this && event in this._memories) {
      this._memories[event] = args;
    }

    if (!('_listeners' in this) || !('_events' in this)) {
      return false;
    }

    var listenersId = this._events[event];

    if (typeof listenersId === 'number') {
      invokeListener(this, listenersId, args);
    } else if (Array.isArray(listenersId)) {
      var length = listenersId.length;

      for (var i = 0; i < length; i += 1) {
        invokeListener(this, listenersId[i], args);
      }
    } else {
      return false;
    }

    return true;
  };

  EventsEmitter.mixins = function EventsEmitterMixins(dest) {
    var source = EventsEmitter.prototype;

    for (var property in source) {
      dest[property] = source[property];
    }

    return dest;
  };


  EventsEmitter.mixins(EventsEmitter);


  return EventsEmitter;


  function addListener(self, event, callback, context, times) {
    var listenerId = nextListenerId;

    nextListenerId += 1;

    if (!('_listeners' in self)) {
      self._listeners = {
        callbacks: Object.create(null),
        contexts: Object.create(null),
        times: Object.create(null)
      };
    }

    if (!('_events' in self)) {
      self._events = Object.create(null);
    }

    self._listeners.callbacks[listenerId] = callback;
    self._listeners.contexts[listenerId] = context;

    if (arguments.length === 5) {
      self._listeners.times[listenerId] = times;
    }

    if ('_memories' in self && Array.isArray(self._memories[event])) {
      (root.setImmediate || root.setTimeout)(function () {
        invokeListener(self, listenerId, self._memories[event]);
      }, 0);
    }

    var listenersId = self._events[event];

    if (typeof listenersId === 'number') {
      self._events[event] = [listenersId, listenerId];
    } else if (Array.isArray(listenersId)) {
      listenersId.push(listenerId);
    } else {
      self._events[event] = listenerId;
    }

    return listenerId;
  }

  function clearListeners(self, event, soft) {
    var callbacks = self._listeners.callbacks,
      listenersId = self._events[event];

    if (typeof listenersId === 'number') {
      removeListener(self, listenersId);
    } else if (Array.isArray(listenersId)) {
      var length = listenersId.length;

      for (var i = 0; i < length; i += 1) {
        var listenerId = listenersId[i];
        removeListener(self, listenerId);
      }
    }

    if (!soft) {
      delete self._events[event];
    }
  }

  function clearGhosts(self, event, soft) {
    var callbacks = self._listeners.callbacks,
      listenersId = self._events[event];

    if (typeof listenersId === 'number') {
      if (!(listenersId in callbacks)) {
        removeListener(self, listenersId);
        delete self._events[event];
      }
    } else if (Array.isArray(listenersId)) {
      var length = listenersId.length;

      for (var i = 0; i < length; i += 1) {
        var listenerId = listenersId[i];

        if (!(listenerId in callbacks)) {
          removeListener(self, listenerId);

          listenersId.splice(i, 1);

          length -= 1;
          i -= 1;
        }
      }

      if (length === 0 && !soft) {
        delete self._events[event];
      }
    }
  }

  function removeListener(self, listenerId) {
    delete self._listeners.callbacks[listenerId];
    delete self._listeners.contexts[listenerId];
    delete self._listeners.times[listenerId];
  }

  function invokeListener(self, listenerId, args) {
    if (!(listenerId in self._listeners.callbacks)) {
      return;
    }

    var callback = self._listeners.callbacks[listenerId],
      context = self._listeners.contexts[listenerId] || root;

    if (listenerId in self._listeners.times) {
      self._listeners.times[listenerId] -= 1;
      if (self._listeners.times[listenerId] < 1) {
        removeListener(self, listenerId);
      }
    }

    switch (args.length) {
    case 0:
      return callback.call(context);
    case 1:
      return callback.call(context, args[0]);
    case 2:
      return callback.call(context, args[0], args[1]);
    case 3:
      return callback.call(context, args[0], args[1], args[2]);
    default:
      return callback.apply(context, args);
    }
  }

});
