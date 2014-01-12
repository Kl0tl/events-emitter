describe('events-emitter.js spec', function (){

	var callback = function () {
		times += 1;
	}, emitter, times;

	beforeEach(function () {
		emitter = EventsEmitter.mixins({});
		times = 0;
	});

	it('should mixins EventsEmitter properties into target', function () {
		for (var property in EventsEmitter.prototype) {
			expect(emitter[property] === EventsEmitter.prototype[property]).toBe(true);
		}
	});

	it('should register one listener', function () {
		var id = emitter.on('event', callback);

		expect(typeof id).toBe('number');
		expect(emitter._listeners.callbacks[id]).toBe(callback);
		expect(emitter._events.event).toBe(id);
	});

	it('should register some listeners', function () {
		(3).times(emitter.on.bind(emitter, 'event', callback));

		expect(typeof emitter._events.event).toBe('object');
		expect(emitter._events.event.length).toBe(3);
	});

	it('should bind the listener', function () {
		var context = {};

		emitter.on('event', function () {
			expect(this).toBe(context);
		}, {context: context});

		emitter.trigger('event');
	});

	it('should trigger the listener exactly one time', function () {
		var id = emitter.once('event', callback);

		expect(emitter._listeners.times[id]).toBe(1);

		(2).times(emitter.trigger.bind(emitter, 'event'));

		expect(times).toBe(1);
	});

	it('should trigger the listener exactly 3 times', function () {
		emitter.on('event', callback, {times: 3});

		(4).times(emitter.trigger.bind(emitter, 'event'));

		expect(times).toBe(3);
	});

	it('should remove the listener by id', function () {
		emitter.off(emitter.on('event', callback));

		emitter.trigger('event');

		expect(times).toBe(0);
	});

	it('should return a list of listeners', function () {
		emitter.on('event', callback);
		expect(emitter.listeners('event')).toEqual([callback]);
	});

	it('should remove all the listeners of the event', function () {
		(2).times(emitter.on.bind(emitter, 'event', callback));

		emitter.clear('event');

		emitter.trigger('event');

		expect(times).toBe(0);
	});

	it('should keep the listeners\' array of the event', function () {
		(2).times(emitter.on.bind(emitter, 'event', callback));

		emitter.clear('event', {soft: true});

		expect(emitter._events.event.length).toBe(2);
		expect(Object.keys(emitter._listeners.callbacks).length).toBe(0);
	});

	it('should remove all the listeners of the events inside the array', function () {
		var events = ['event', 'other-event'];

		events.forEach(function (event) {
			emitter.on(event, callback);
		});

		emitter.clear(events);

		events.forEach(emitter.trigger, emitter);

		expect(times).toBe(0);
	});

	it('should keep the listeners\' array of the events inside the array', function () {
		var events = ['event', 'other-event'];

		events.forEach(function (event) {
			(2).times(emitter.on.bind(emitter, event, callback));
		});

		emitter.clear(events, {soft: true});

		events.forEach(function (event) {
			expect(emitter._events[event].length).toBe(2);
		});

		expect(Object.keys(emitter._listeners.callbacks).length).toBe(0);
	});

	it('should remove all the listeners of all the events', function () {
		var events = ['event', 'other-event'];

		events.forEach(function (event) {
			emitter.on(event, callback);
		});

		emitter.clear();

		events.forEach(emitter.trigger, emitter);

		expect(times).toBe(0);
	});

	it('should keep the listeners\' array of all the events', function () {
		var events = ['event', 'other-event'];

		events.forEach(function (event) {
			(2).times(emitter.on.bind(emitter, event, callback));
		});

		emitter.clear({soft: true});

		events.forEach(function (event) {
			expect(emitter._events[event].length).toBe(2);
		});

		expect(Object.keys(emitter._listeners.callbacks).length).toBe(0);
	});

	it('should clear the ghosts of the event', function () {
		emitter.once('event', callback);

		emitter.trigger('event');

		emitter.clear('event', {ghosts: true});

		expect('event' in emitter._events).toBe(false);
	});

	it('should clear the ghosts of the events inside the array', function () {
		var events = ['event', 'other-event'];

		events.forEach(function (event) {
			emitter.once(event, callback);
			emitter.trigger(event);
		});

		emitter.clear(events, {ghosts: true});

		events.forEach(function (event) {
			expect(event in emitter._events).toBe(false);
		});
	});

	it('should clear all the ghosts listeners', function () {
		var events = ['event', 'other-event'];

		events.forEach(function (event) {
			emitter.once(event, callback);
			emitter.trigger(event);
		});

		emitter.clear({ghosts: true});

		events.forEach(function (event) {
			expect(event in emitter._events).toBe(false);
		});
	});

	it('should remember the arguments of the event', function () {
		emitter.remember('complete');
		expect(emitter._memories.complete).toBe(null);

		emitter.trigger('complete', 'Pavel');
		expect(emitter._memories.complete).toEqual(['Pavel']);
	});

	it('should remember the arguments of the events', function () {
		var events = ['complete', 'loaded'];

		emitter.remember(events);

		events.forEach(function (event) {
			expect(emitter._memories[event]).toBe(null);
		});

		events.forEach(function (event) {
			emitter.trigger(event);
		});

		events.forEach(function (event) {
			expect(emitter._memories[event]).toEqual([]);
		});
	});

	it('should trigger the remembered event immediately', function () {
		var context = {name: 'Vlad'};

		emitter.remember('complete');

		emitter.trigger('complete', 'Pavel');

		emitter.on('complete', function (name) {
			this.name = name;
			expect(context.name).toBe('Pavel');
		}, {context: context});

		expect(context.name).toBe('Vlad');
	});

	it('should forget the arguments of the event', function () {
		emitter.remember('complete');

		emitter.forget('complete');

		expect('complete' in emitter._memories).toBe(false);
	});

	it('should forget the arguments of the events', function () {
		var events = ['complete', 'loaded'];

		emitter.remember(events);

		emitter.forget(events);

		events.forEach(function (event) {
			expect(event in emitter._memories).toBe(false);
		});
	});

	Number.prototype.times = function (callback) {
		var count = Number(this);
		for (var i = 0; i < count; i += 1) {
			callback();
		}
	};

});
