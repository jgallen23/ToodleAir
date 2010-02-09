(function($) {

	var addMethods = function(source) {
		var ancestor	 = this.superclass && this.superclass.prototype;
		var properties = $.keys(source);

		if (!$.keys({ toString: true }).length) properties.push("toString", "valueOf");

		for (var i = 0, length = properties.length; i < length; i++) {
			var property = properties[i], value = source[property];
			if (ancestor && $.isFunction(value) && $.argumentNames(value)[0] == "$super") {

				var method = value, value = $.extend($.wrap((function(m) {
					return function() { return ancestor[m].apply(this, arguments) };
				})(property), method), {
					valueOf:	function() { return method },
					toString: function() { return method.toString() }
				});
			}
			this.prototype[property] = value;
		}

		return this;
	}

	$.extend({
		keys: function(obj) {
			var keys = [];
			for (var key in obj) keys.push(key);
			return keys;
		},

		argumentNames: function(func) {
			var names = func.toString().match(/^[\s\(]*function[^(]*\((.*?)\)/)[1].split(/, ?/);
			return names.length == 1 && !names[0] ? [] : names;
		},

		bind: function(func, scope) {
			return function() {
				return func.apply(scope, $.makeArray(arguments));
			}
		},

		wrap: function(func, wrapper) {
			var __method = func;
			return function() {
				return wrapper.apply(this, [$.bind(__method, this)].concat($.makeArray(arguments)));
			}
		},

		klass: function() {
			var parent = null, properties = $.makeArray(arguments);
			if ($.isFunction(properties[0])) parent = properties.shift();

			var klass = function() {
				this.initialize.apply(this, arguments);
			};

			klass.superclass = parent;
			klass.subclasses = [];
			klass.addMethods = addMethods;

			if (parent) {
				var subclass = function() { };
				subclass.prototype = parent.prototype;
				klass.prototype = new subclass;
				parent.subclasses.push(klass);
			}

			for (var i = 0; i < properties.length; i++)
				klass.addMethods(properties[i]);

			if (!klass.prototype.initialize)
				klass.prototype.initialize = function() {};

			klass.prototype.constructor = klass;

			return klass;
		},
		delegate: function(rules) {
			return function(e) {
				var target = $(e.target), parent = null;
				for (var selector in rules) {
					if (target.is(selector) || ((parent = target.parents(selector)) && parent.length > 0)) {
						return rules[selector].apply(this, [parent || target].concat($.makeArray(arguments)));
					}
					parent = null;
				}
			}
		},
		ux: {
			behavior: function() {
				var args = $.makeArray(arguments), name = args.shift(), parent = null;
				if (typeof(args[0]) == "string") parent = args.shift();
				var obj = args[0];
				var defaults = (args.length > 1 && typeof(args[1]) === "object")?args[1]:{};
				obj["_name"] = name;
				this[name] = (parent)?$.klass(this[parent], obj):$.klass(obj);
				this[name].defaults = defaults;
			}
		}
	});

	var bindEvents = function(instance) {
		for (var member in instance) {
			if (member.match(/^on(.+)/) && typeof instance[member] == 'function') {
				instance.element.bind(RegExp.$1, $.bind(instance[member], instance));
			}
		}
	}

	var behaviorWrapper = function(behavior) {
		return $.klass(behavior, {
			initialize: function($super, element, args) {
				this.element = $(element);
				this.options = (behavior.defaults)?$.extend({}, behavior.defaults):{};
				if (behavior.superclass && behavior.superclass.defaults) {
					this.options = $.extend({}, behavior.superclass.defaults, this.options);
				}
				$.extend(this.options, (args && args.length != 0 && typeof(args[0]) == "object")?args[0]:{});

				if ($super) $super.apply(this, args);
			},
			dispatchEvent: function() {
				var args = $.makeArray(arguments), event = "on"+args.shift();
				if (this.options[event]) {
					this.options[event].apply(this, args);
				}
			}
		});
	}

	var attachBehavior = function(el, behavior, args) {
		if (typeof(behavior) === "string")
			behavior = $.ux[behavior];
		var wrapper = behaviorWrapper(behavior);
		instance = new wrapper(el, args);

		bindEvents(instance);

		if (!behavior.instances) behavior.instances = [];

		behavior.instances.push(instance);

		return instance;
	};

	$.fn.extend({
		attach: function() {
			var args = $.makeArray(arguments), behavior = args.shift();
			if ($.livequery && this.selector) {
				return this.livequery(function() {
					attachBehavior(this, behavior, args);
				});
			} else {
				return this.each(function() {
					attachBehavior(this, behavior, args);
				});
			}
		},
		attachAndReturn: function() {
			var args = $.makeArray(arguments), behavior = args.shift();
			return $.map(this, function(el) {
				return attachBehavior(el, behavior, args);
			});
		},
		delegate: function(type, rules) {
			return this.bind(type, $.delegate(rules));
		},
		attached: function(behavior) {
			if (typeof(behavior) === "string")
				behavior = $.ux[behavior];
			var instances = [];

			if (!behavior.instances) return instances;

			this.each(function(i, element) {
				$.each(behavior.instances, function(i, instance) {
					if (instance.element.get(0) == element) instances.push(instance);
				});
			});

			return instances;
		},
		firstAttached: function(behavior) {
			return this.attached(behavior)[0];
		},
		ux: function() {
			var args = $.makeArray(arguments), behavior = args.shift(), method = args.shift();
			var behaviors = this.attached(behavior);
			$.each(behaviors, function(i, behavior) {
				behavior[method].apply(behavior, args);
			});
			return this;
		}
	});

})(jQuery);
