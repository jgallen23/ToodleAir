ui.TitleBar = function(options) {
	this.name = "TitleBar";
	var self = this;
	var defaults = {
		selector: "#TitleBar",
		closeClass: 'Close',
		helpClass: 'Help',
		minimizeClass: 'Minimize'
	}
	ui.TitleBar.superclass.constructor.call(this, options, defaults);
	//this.menu = new ui.Menu(menuId);
	this.addEventListener("load", function() {
		self._setClickEvent(self.options.closeClass, "close");
		self._setClickEvent(self.options.helpClass, "help");
		self._setMoveEvent();
	});
};
inherit(ui.TitleBar, ui.Control);
ui.TitleBar.extend({
	_setClickEvent: function(classname, event, action) {
		var self = this;
		var btn = self.$node.find("." + classname);
		btn.bind("click", function() { 
			self.dispatchEvent(event, self);
			if (action)
				action();
		});
	},
	_setMoveEvent: function() {
		var self = this;
		this.$node.bind("mousedown", function() {
			self.dispatchEvent("move", self);
			//nativeWindow.startMove();
		});
	}
});

ui.TextBoxHint = function(textboxSelector, hint) {
	var self = this;
	this.isPassword = false;
	this.$element = $(textboxSelector);
	if (this.$element.attr("type").toLowerCase() == "password") { 
		this.isPassword = true;
		this.$textInput = $('<input type="text"/>');
		this.$element.after(this.$textInput);
		this.$textInput.bind("focus", function() {
			self.hideHint();
		});
	} else {
		this.$element.bind("focus", function() {
			if ($(this).val() == self.hint) {
				self.hideHint();
			}
		});
	}
	this.hint = hint;

	this.showHint();

	this.$element.bind("blur", function() {
		if ($(this).val() == "") {
			self.showHint();
		}
	});


};
ui.TextBoxHint.extend({
	showHint: function() {
		if (this.isPassword) {
			this.$element.hide();
			this.$textInput.
				addClass("Hint").
				val(this.hint).
				show();
		}
		this.$element.
			addClass("Hint").
			val(this.hint);
	},
	hideHint: function() {
		if (this.isPassword) {
			this.$element.show();
			this.$textInput.hide();
			this.$element.focus();
		}
		this.$element.
			removeClass("Hint").
			val('');
	}
});

ui.Login = function(options) {
	this.name = "Login";
	var self = this;
	var defaults = {
		selector: "#Login"
   	}
	ui.Login.superclass.constructor.call(this, options, defaults);
	this.addEventListener("load", function() {
		self.$email = self.$node.find(":input:eq(0)");
		self.$password = self.$node.find(":input:eq(1)");
		self.$form = self.$node.find("form");
		self.$form.bind("submit", function() {
			self.login();
			return false;
		});
		new ui.TextBoxHint(self.$email, "Email");
		new ui.TextBoxHint(self.$password, "Password");
	});
	this.addEventListener("show", function() {
		self.$email.focus();
	});
};
inherit(ui.Login, ui.Control);
ui.Login.extend({
	login: function() {
		var self = this;
		if (self.$email.val() != "" && self.$password.val() != "") {
			self.dispatchEvent("login", self, { email: self.$email.val(), password: self.$password.val()});
		} else {
			self.dispatchEvent("error", self, "Email and Password is Required");
		}
	},
	clear: function() {
		this.$email.val('');
		this.$password.val('');
	}
});

ui.Notification = function(options) {
	this.name = "Notification";
	var self = this;
	var defaults = {
		selector: "#Notification"
   	};
	this._timeout;
	ui.Notification.superclass.constructor.call(this, options, defaults);
};
inherit(ui.Notification, ui.Control);
ui.Notification.extend({
	showMessage: function(msg, level) {
		clearTimeout(this._timeout);
		var self = this;
		this.$node.find(".container").html(msg);
		this.$node.slideDown();
		this._timeout = setTimeout(function() {
			self.$node.slideUp();
		}, 5000);
	}
});

ui.Menu = function(options) {
	this.name = "Menu";
	var defaults = {
		selector: "#Menu"
   	}
	ui.Menu.superclass.constructor.call(this, options, defaults);
}
inherit(ui.Menu, ui.Control);
ui.Menu.extend({
	addMenuItem: function(text, callback) {
		var self = this;
		$(function() {
			var item = $('<li><a>' + text + '</a></li>')
			$(item).bind("click", function() { callback(self, this) });
			self.$node.append(item);
		});
	},
	show: function() {
		var self = this;
		this.$node.slideDown();
		$(document).one("mousedown", function() {
			self.$node.slideUp();	
		});
	},
	hide: function() {
		this.$node.slideUp();
	}
}); 

ui.Query = function(options) {
	this.name = "Query";
	var self = this;
	var defaults = {
		selector: "#Query",
		autoCompleteSelector: "#AutoComplete"
   	}
	ui.Query.superclass.constructor.call(this, options, defaults);
	self.autoComplete = new ui.AutoComplete({ selector: this.options.autoCompleteSelector });
	this.addEventListener("load", function() {
		self.$query = self.$node.find(":input:eq(0)");
		self.autoComplete.attachTextBox(self.$query);
		self.$form = self.$node.find("form");
		self.$form.bind("submit", function() {
			self.execute();
			return false;
		});
		new ui.TextBoxHint(self.$query, "Add Task");
	});
	this.addEventListener("show", function() {
		self.$query.focus();
	});
}
inherit(ui.Query, ui.Control);
ui.Query.extend({
	execute: function() {
		this.dispatchEvent("execute", this, this.$query.val());
	},
	clear: function() {
		this.$query.val('');
	}
});

ui.AutoComplete = function(options) {
	this.name = "AutoComplete";
	var self = this;
	self._timeoutCheck;
	self._selectedResultIndex = 0;
	self._matches;
	self._isActive = false;
	self._currentSearch;
	self._currentKeyCode;

	var defaults = {
		selector: "#AutoComplete",
		maxResults: 5,
		triggers: []	
	}
	ui.AutoComplete.superclass.constructor.call(this, options, defaults);

	this.addEventListener("load", function(sender, data) {
		self.$autoComplete = self.$node.find("ul");
	});

	this.addEventListener("show", function(sender, data) {
	});
};
inherit(ui.AutoComplete, ui.Control);
ui.AutoComplete.extend({
	attachTextBox: function(textBox) {
		var self = this;
		self.$textbox = $(textBox);
		log("textbox", self.$textbox);
		self.$textbox[0].addEventListener("textInput", function(event) {
			return self.textInputEvent(event);
		});
		self.$textbox.bind("keydown", function(event) { return self.keyDownEvent(event); });
	},
	setTriggers: function(triggers) {
		log("triggers", triggers);
		this.options.triggers = triggers;
	},
	keyDownEvent: function(event) {
		log("down");
		log(event.keyCode);
		if (event.keyCode != 0) {
			this._currentKeyCode = event.keyCode;
			if (this._currentKeyCode == 40 || 
					this._currentKeyCode == 38 ||
				   	this._currentKeyCode == 27 ||
				   	this._currentKeyCode == 13 ||
					this._currentKeyCode == 8
				) {
				if (this._isActive) {
					if (this._currentKeyCode == 40) { //down
						log("press down");
						this.hoverResultDown();
						return false;
					} else if (this._currentKeyCode == 38) { //up
						log("press up");
						this.hoverResultUp();
						return false;
					} else if (this._currentKeyCode == 27) { //esc
						log("press esc");
						this.hideResults();
						return false;
					} else if (this._currentKeyCode == 13) { //enter
						log("press enter");
						this.selectResult();	
						return false;
					} else if (this._currentKeyCode == 32) { //space
						log("press space");
						this.hideResults();
						this._isActive = false;
						return true;
					} else if (this._currentKeyCode == 8) {
						if (this._currentSearch.length == 0) {
							this.hideResults();
							this._isActive = false;
							return true;
						}
					}
				}
			}
		}
		return true;
	},
	textInputEvent: function(event) {
		if (this._timeoutCheck)
			clearTimeout(this._timeoutCheck)

		var key = event.keyCode;
		log(event.data);
		for (var i = 0; i < this.options.triggers.length; i++) {
			if (this.options.triggers[i].key == event.data) {
				log("trigger");
				this._isActive = true;
				this._currentTrigger = this.options.triggers[i];
				this._selectedResultIndex = 0;
				this._currentSearch = '';
				this.showAutoComplete();
				return true;
			}
		}
		log("keycode " + this._currentKeyCode);
		log("press");

		if (this._isActive) {
			if (this._currentKeyCode == 8)
				this._currentSearch = this._currentSearch.substr(0, this._currentSearch.length - 1)
			else if (this._currentKeyCode != 0 && this._currentKeyCode != 38 && this._currentKeyCode != 40) {
				this._currentSearch += event.data;
			}

			log(this._currentKeyCode);
			log(this._currentSearch);

			var self = this;
			this._timeoutCheck = setTimeout(function() {
				self.showAutoComplete();
			}, 300);
		}
		return true;
	},
	getCharCode: function(str) {
		var charCodes = '';
		for (var i = 0; i < str.length; i++) {
			charCodes += str.charCodeAt(i)+", ";
		}
		return charCodes;
	},
	selectResult: function() {
		var result = this._matches[this._selectedResultIndex];
		log(result);
		var txt = this.$textbox;
		log("textbox", this.$textbox);
		var currentValue = txt.val().trim();
		log("currentValue", currentValue);
		if (result) {
			log("selectResult");
			var mySearch = this._currentTrigger.key + this._currentSearch;
			var myMatch = this._currentTrigger.key + result.Text;

			log(mySearch);
			log(myMatch);
				
			currentValue = currentValue.replace(mySearch.trim(), myMatch.trim());
			log("currentValue", currentValue);
			txt.val(currentValue+" ");
		} else {
			log("no result");
			txt.val(currentValue+" ");
		}
		this._isActive = false;
		this.hideResults();

	},
	showAutoComplete: function() {
		log("show auto complete");
		this._matches = this.getMatches(this._currentSearch, this._currentTrigger.data);
		log(this._matches);
		this.$autoComplete.html('');
		var max = this.options.maxResults;
		if (this._matches.length < max)
			max = this._matches.length;
		for(var i = 0; i < max; i++) {
			this.addMatch(this._matches[i].Text, (i%2 == 0));
		}
		this.hoverResult(0);
		this.$node.slideDown();
	},
	addMatch: function(text, isAlt) {
		var altClass = (isAlt)?"class='alt'":"";
		this.$autoComplete.append("<li "+altClass+">"+text+"</li>");
	},
	getMatches: function(text, objects) {
		log(text);
		log(objects);
		var re = new RegExp(text, "i");
		matches = [];
		if (objects) {
			for (var i = 0; i < objects.length; i++) {
				if (objects[i].Text.match(re))
					matches.push(objects[i]);
			}
		}
		return matches;
	},
	hoverResultDown: function() {
		var newIndex = this._selectedResultIndex;
		if (this._selectedResultIndex == -1 || this._matches.length == (this._selectedResultIndex + 1)) {
			newIndex = 0;
		}
		else {
			newIndex++;
		}
		this.hoverResult(newIndex);
	},
	hoverResultUp: function() {
		var newIndex = this._selectedResultIndex;
		if (this._selectedResultIndex == -1 || this._selectedResultIndex == 0) {
			newIndex = this._matches.length - 1;
		}
		else {
			newIndex--;
		}
		this.hoverResult(newIndex);
	},
	hoverResult: function(newIndex) {
		var liList = this.$autoComplete.find("li");
		if (typeof(this._selectedResultIndex) != 'undefined') {
			liList.eq(this._selectedResultIndex).removeClass("selected");
		}
		this._selectedResultIndex = newIndex;
		liList.eq(this._selectedResultIndex).addClass("selected");
	},
	hideResults: function() {
		var self = this;
		this.$node.slideUp(function() {
			if (!self._isActive)
				self.$autoComplete.html('');
		});
	},
	clearTextBox: function() {
		this.$textbox.val('');
	}
});
ui.Loader = function(options) {
	this.name = "Loader";
	var defaults = {
		selector: "#Loader"
	}
	ui.Loader.superclass.constructor.call(this, options, defaults);
}
inherit(ui.Loader, ui.Control);
ui.Loader.extend({
	show: function() {
		this.$node.css("visibility", "visible");
	},
	hide: function() {
		this.$node.css("visibility", "hidden");
	}	
});

ui.ContentContainer = function(options) {
	this.name = options.selector;
	var defaults = {
		selector: '',
		contentSelector: '.Content',
		contentContainerClass: '.contentContainer',
		closeClass: '.contentClose'
	}
	ui.Loader.superclass.constructor.call(this, options, defaults);

	this.addEventListener("load", function(sender, data) {
		sender.$parent = $(sender.options.contentSelector);
		sender.$parentContainer = sender.$parent.find(sender.options.contentContainerClass);
		var close = sender.$parent.find(sender.options.closeClass)[0];
		log(close);
		close.onclick = function() {
			sender.hide();
		}
	});
}
inherit(ui.ContentContainer, ui.Control);
ui.ContentContainer.extend({
	show: function() {
		var self = this;
		log(this.$parent);
		this.$parent.slideUp(function() {
			self.$parentContainer.children().hide();
			self.$node.show();
			self.$parent.slideDown();
		});
	},
	hide: function() {
		this.$parent.slideUp();
	},
	toggle: function() {
		if (this.$parent.css("display") == "block") {
			this.hide();
		} else {
			this.show();
		}
	}
});
