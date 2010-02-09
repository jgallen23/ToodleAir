var ui = {}
var objects = {}


var log = function() {
	if (DEBUG) {
		for (var i = 0; i < arguments.length; i++) {
			air.trace(arguments[i]);
			air.Introspector.Console.log(arguments[i]);
		}
	}
};

String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, '')
}

Function.prototype.extend = function(obj) {
	for (var o in obj) {
		this.prototype[o] = obj[o];
	}
};

var inherit = function(subClass, superClass) {
	var F = function() {};
	F.prototype = superClass.prototype;
	subClass.prototype = new F();
	subClass.prototype.constructor = subClass;

	subClass.superclass = superClass.prototype;
	if (superClass.prototype.constructor == Object.prototype.constructor) {
		superClass.prototype.constructor = superClass;
	}
};

var EventManager = function() {
	this._events = {}
}
EventManager.extend({
	addEventListener: function(eventName, callback) {
		if (!this._events[eventName])
			this._events[eventName] = [];
		this._events[eventName].push(callback);
	},
	removeEventListener: function(eventName, callback) {
		//Todo
	},
	dispatchEvent: function(eventName, sender, data) { 
		log(sender.name + " event " + eventName);
		var event = this._events[eventName];
		var success = true;
		if (event) {
			for (var i = 0; i < event.length; i++) {
				var s = event[i](sender, data);
				if (!s)
					success = false;
			}
		}
		return success;
	}
});

var Response = function(status, data) {
	this.status = status;
	this.data = data;
}
Response.extend({
});

ui.Control = function(options, defaults) {
	this.$node;
	this._events = new EventManager();
	this.options = this._getOptions(options, defaults);
	log("options", this.options);
	if (!this.options.selector)
		throw "Must Pass Selector";
	var self = this;
	self.dispatchEvent("init", self);
	$(function() {
		self.$node = $(self.options.selector);
		self.dispatchEvent("load", self);
	});
}
ui.Control.extend({
	addEventListener: function(event, callback) {
		this._events.addEventListener(event, callback);
	},
	removeEventListener: function(event) {
		this._events.removeEventListener(event, callback);
	},
	_getOptions: function(options, defaults) {
		if (!defaults && !options)
			return { }
		else if (!defaults)
			return options
		else if (!options)
			return defaults;
		else {
			for ( var opt in defaults ) {
				if ( options[ opt ] != null && options[ opt ] != undefined && options[ opt ] != 'undefined' ){
					defaults[ opt ] = options[ opt ];
				}
			}
			if (options.events) {
				this._bindEvents(options.events);
			}
			return defaults;
		}
	},
	_bindEvents: function(events) {
		log(this.name, "bind events", events);
		for (var event in events) {
			this.addEventListener(event, events[event]);
		}
	},
	dispatchEvent: function(event, sender, data) {
		this._events.dispatchEvent(event, sender, data);
	},
	show: function() {
		this.dispatchEvent("show", this);
		this.$node.show();
	},
	fadeIn: function(callback) {
		var self = this;
		this.$node.fadeIn(function() {
			self.dispatchEvent("show", self);
			if (callback)
				callback();
		});
	},
	hide: function() {
		this.dispatchEvent("hide", this);
		this.$node.hide();
	},
	fadeOut: function(callback) {
		var self = this;
		this.$node.fadeOut(function() {
			self.dispatchEvent("hide", self);
			if (callback)
				callback();
		});
	},
	focus: function() {
		var firstInput = this.$node.find(":input").eq(0);
		if (firstInput)
			firstInput.focus();
	}
});

var Updater = function() {
	var appUpdater;
	var initialize = function() {
		log("checking for update");
   		appUpdater = new runtime.air.update.ApplicationUpdaterUI();

        // start updater config  

       	//change this to point to the online update.xml.
		appUpdater.updateURL = "http://air.jga23.com/toodleair/update.xml";
		//appUpdater.updateURL = "app:/server/update.xml";

		//by default all the dialogs are hidden
		appUpdater.isCheckForUpdateVisible = false;
		appUpdater.isDownloadUpdateVisible = true;
		appUpdater.isDownloadProgressVisible = true;
		appUpdater.isInstallUpdateVisible = true;

            			
        //it is necessary to add an ErrorEvent listener because this type of events are catched by the debugger
        appUpdater.addEventListener(runtime.flash.events.ErrorEvent.ERROR, function(ev){ } );
        			
		appUpdater.addEventListener(runtime.air.update.events.UpdateEvent.INITIALIZED, checkNow);
        appUpdater.initialize();
	
	}

	var checkNow = function() {
		appUpdater.checkNow();
		setTimeout(function() {
			checkNow();
		}, 1000 * 60 * 30)
	};

	var getCurrentVersion = function() {
		return appUpdater.currentVersion;
	};

	initialize();
};

