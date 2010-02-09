var Application = function() {
	this.name = "ToodleAir";
	var self = this;
	self.onTop = false;
	this.currentBox;
	this.triggers = this.setTriggers();
	new objects.RememberLocation(window.nativeWindow);
	this.autoHide = new AutoHide(window.nativeWindow, true);
	this.loader = new ui.Loader();
	this.titleBar = new ui.TitleBar({
		events: {
			close: function(sender, obj) { self.close(); },
			minimize: function(sender, obj) { self.minimize(); },
			help: function(sender, obj) { self.showHelp(); },
			move: function(sender, obj) { self.move(); }	
		}
	});
	this.notification = new ui.Notification();
	this.user = new objects.User();
	this.loginBox = new ui.Login({
		events: {
			login: function(sender, data) { self.login(data); },
			error: function(sender, data) { self.showMessage(data); }
		}
	});
	this.queryBox = new ui.Query({
		triggers: this.triggers,
		events: {
			execute: function(sender, data) { self.executeQuery(data); },
			show: function(sender, data) { self.onQueryShow(sender); }
		}
	});
	this.helpBox = new ui.ContentContainer({ selector: '#Help' });
	this.tasks = new objects.Tasks();
	this.query = new objects.Query(this.triggers);

	air.NativeApplication.nativeApplication.addEventListener(air.Event.EXITING, function(e) {
		self.dispatchEvent("close", self);
		var opened = air.NativeApplication.nativeApplication.openedWindows;
		for (var i = 0; i < opened.length; i ++) {
			opened[i].close();
		}
     });

	window.nativeWindow.addEventListener(air.Event.ACTIVATE, function(event) {
		log("activate");
		if (self.currentBox)
			self.currentBox.focus();
	});

	new Updater();
	Application.superclass.constructor.call(this, { selector: "#ToodleAir" });
	this.addEventListener("load", function() {
		self.checkUser();
	});
	this.addEventListener("close", function(sender) {
		log("close app");
	});
};
inherit(Application, ui.Control);

Application.extend({
	close: function(sender) {
		this.dispatchEvent("close", this);
		nativeWindow.close();
	},
	minimize: function(sender) {
		nativeWindow.minimize();
	},
	move: function(sender) {
		nativeWindow.startMove();
	},
	login: function(data) {
		var self = this;
		this.loader.show();
		self.user.login(data.email, data.password, function(response) {
			self.loader.hide();
			if (response.status == "ok") {
				var d = response.data;
				self.user.saveCurrent(d.userId, d.password, d.authKey);
				self.showQueryBox();
				self.showHelp();
			} else {
				self.showMessage(response.data);
			}
		});
	},
	showMessage: function(msg) {
		this.notification.showMessage(msg);
	},
	showLoginBox: function() {
		this.currentBox = this.loginBox;
		this.loginBox.fadeIn();
	},
	showQueryBox: function() {
		var self = this;
		this.currentBox = this.queryBox;
		//loader
		self.tasks.getData(function(response) {
			if (response && response.status == "ok") {
				self.loginBox.fadeOut(function() {
					self.queryBox.fadeIn();
				});
			} else {
				self.showMessage(response.data);
			}
		});
	},
	checkUser: function() {
		this.loader.show();
		var currentUser = this.user.getCurrent();
		var self = this;
		if (currentUser) {
			if (this.user.isValidAuthKey(currentUser.authKey, currentUser.authKeyTime)) {
				this.user.setAuthKey(currentUser.authKey);
				this.loader.hide();
				this.showQueryBox();
			} else {
				log("invalid authKey");
				this.user.getNewAuthKey(currentUser, function(authKey) {
					self.user.saveCurrent(currentUser.userId, currentUser.password, authKey);
					self.loader.hide();
					self.showQueryBox();
				});	
			}
		}
		else {
			this.loader.hide();
			this.showLoginBox();
		}
	},
	logout: function() {
		db.resetStore();
		this.user.removeAuthKey();
		var self = this;
		this.queryBox.fadeOut(function() {
			self.showLoginBox();
		});
	},
	toggleOnTop: function() {
		if (nativeWindow.alwaysInFront) {
			nativeWindow.alwaysInFront = false;
			this.showMessage("Always On Top Disabled");
		}
		else {
			nativeWindow.alwaysInFront = true;
			this.showMessage("Always On Top Enabled");
		}
	},
	executeQuery: function(query) {
		var self = this;
		log(query);
		this.loader.show();
		var taskObj = this.query.parse(query);
		log(taskObj);
		if (taskObj.action) {
			if (taskObj.action == "Logout")
				this.logout();
			else if (taskObj.action == "On Top")
				this.toggleOnTop();
			else if (taskObj.action == "Help")
				this.showHelp();
			else if (taskObj.action == "Debugger")
				this.enableDebugging();
			self.loader.hide();
			self.queryBox.clear();
		} else {
			this.tasks.addTask(taskObj, function(response) {
				self.loader.hide();
				self.showMessage(response.data);
				if (response.status == "ok")
					self.queryBox.clear();
			});
		}
	},
	setTriggers: function() {
		var triggers = new objects.Triggers();
		triggers.add(new objects.Trigger("$", "Status"));	
		triggers.add(new objects.Trigger("#", "Due Date"));	
		triggers.add(new objects.Trigger("^", "Start Date"));	
		triggers.add(new objects.Trigger("*", "Folder"));	
		triggers.add(new objects.Trigger("@", "Context"));	
		triggers.add(new objects.Trigger("`", "Action"));
		triggers.add(new objects.Trigger("!", "Priority"));
		return triggers;	
	},
	onQueryShow: function(queryBox) {
		log("set triggers");
		this.triggers.setData("Status", this.tasks.getStatus());
		this.triggers.setData("Due Date", this.tasks.getDates());
		this.triggers.setData("Start Date", this.tasks.getDates());
		this.triggers.setData("Folder", this.tasks.folders);
		this.triggers.setData("Context", this.tasks.contexts);
		this.triggers.setData("Priority", this.tasks.getPriorities());

		var triggers = [];
		triggers.push({ key: '$', name: 'Status', data: this.tasks.getStatus() });
		triggers.push({ key: '#', name: 'Due Date', data: this.tasks.getDates() });
		triggers.push({ key: '^', name: 'Start Date', data: this.tasks.getDates() });
		triggers.push({ key: '*', name: 'Folder', data: this.tasks.folders });
		triggers.push({ key: '@', name: 'Context', data: this.tasks.contexts });
		triggers.push({ key: '`', name: 'Action', data: [
			{'Text': 'Logout'},
			{'Text': 'On Top'},
			{'Text': 'Help'},
			{'Text': 'Debugger'}
		]});
		queryBox.autoComplete.setTriggers(triggers);

	},
	showHelp: function() {
		this.helpBox.toggle();
	},
	enableDebugging: function() {
		DEBUG = true;
		toodleDoDebug = true;
		var oHead = document.getElementsByTagName('HEAD').item(0);
		var oScript= document.createElement("script");
		oScript.type = "text/javascript";
		oScript.src = "/ui/scripts/external/AIRIntrospector.js";
		oHead.appendChild(oScript); 
		setTimeout(function() {
			log("Debugger Enabled");
		},500);
	}
});

new Application();

