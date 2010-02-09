objects.User = function() {
}
objects.User.extend({
	login: function(email, pass, callback) {
		var self = this;
		toodleDo.getUserId(email, pass, function(response) {
			if (response.status == "error") { 
				callback(response);
				return;
			}
			else {
				var userId = response.data.Text;
				if (userId == "0" || userId == "1") {
					callback(new Response("error", "Invalid Email or Password"));
					return;
				}
				else {
					self._getToken(userId, pass, function(response) {
						if (response.status == "ok") {
							callback(new Response("ok", { userId: userId, password: pass, authKey: response.data}));	
							return;
						} else {
							callback(response);	
						}
					});
				}
			}
		});
	},
	isValidAuthKey: function(authKey, authKeyTime) {

		var currentTime = new Date().getTime();
		var hour = 60*60*1000;
		var validKeyHours = 4;

		if (Math.ceil((currentTime - authKeyTime) / hour) < 4)
			return authKey;
		else
			return false;
	},
	_getToken: function(userId, password, callback) {
		toodleDo.getToken(userId, password, function(response) {
			if (response.status == "error") {
				callback(response);
			}
			else {
				callback(new Response("ok", toodleDo.getAuthKey()));
			}
		});
	},
	getNewAuthKey: function(user, callback) {
		var self = this;
		this._getToken(user.userId, user.password, function(response) {
			self.setAuthKey(response.data);
			callback(response.data);
		});
	},
	getCurrent: function() {
		return db.getUser();
	},
	saveCurrent: function(userId, password, authKey) {
		db.saveUser(userId, password, authKey);
	},
	setAuthKey: function(authKey) {
		toodleDo.setAuthKey(authKey);
	},
	removeAuthKey: function() {
		toodleDo.removeAuthKey();
	}
});

objects.Triggers = function() {
	this._triggers = {}
}
objects.Triggers.extend({
	add: function(trigger) {
		this._triggers[trigger.key] = trigger;
	},
	get: function(triggerKey) {
		return this._triggers[triggerKey];
	},
	setData: function(triggerName, data) {
		for (trigger in this._triggers) {
			if (this._triggers[trigger].name == triggerName) {
				this._triggers[trigger].setData(data);
				break;
			}
		}
	}
});

objects.Trigger = function(name, key) {
	this.name = name;
	this.key = key;	
	this._data;
}
objects.Trigger.extend({
	setData: function(data) {
		this._data = data;
	},
	getData: function() {
		return this._data;
	}
});

objects.Query = function(triggers) {
	this.triggers = triggers;
}
objects.Query.extend({
	parse: function(query) {
		queryObj = {}

		//Call Jim !! @phone #today
		//Finish the Report ! #next friday *ProjectA @work
		//Mow the lawn *Chores @home

		queryObj['priority'] = 0 ;

		var parseArray = function(a) {
			var o = {};
			for(var i=0;i<a.length;i++) {
				o[a[i]]='';
			}
			return o;
		}

		var endIndex = query.length
		for (var i = query.length; i >= 0; i--) {
			if (query[i] in parseArray(['!', '#', '*', '@', '^', '+', '$', '`'])) {
				if (query[i] == "!") {
					queryObj['priority']++;
					endIndex = i;
					continue;
				}
				var sub = query.substr(i+1, endIndex - (i+1));
				sub = sub.trim();
				if (query[i] == "#")
					queryObj['dueDate'] = sub;
				else if (query[i] == "*")
					queryObj['folder'] = sub;
				else if (query[i] == "@")
					queryObj['context'] = sub;
				else if (query[i] == "^")
					queryObj['startDate'] = sub;
				else if (query[i] == "+")
					queryObj['note'] = sub;
				else if (query[i] == "$")
					queryObj['status'] = sub;
				else if (query[i] == "`")
					queryObj['action'] = sub;
				endIndex = i;
			}
			if (i == 1) {
				queryObj['title'] = query.substr(0, endIndex).trim();
			}
		}
		return queryObj;

	}
});

objects.Tasks = function() {
	this.folders;
	this.contexts;
}
objects.Tasks.extend({
	addTask: function(taskObj, callback) {

		var title, folderId, contextId, priority, dueDate, startDate, note, statusId;
		var toodleDoTask = new toodleDo.Task();

		for (var param in taskObj) {
			if (typeof(toodleDoTask[param]) !== "undefined")
				toodleDoTask[param] = taskObj[param];
		}

		if (taskObj['folder']) {
			toodleDoTask.folderId = this.getObjectId(taskObj['folder'], this.folders);
		}
		if (taskObj['context']) {
			toodleDoTask.contextId = this.getObjectId(taskObj['context'], this.contexts);
		}
		if (taskObj['status']) {
			toodleDoTask.statusId = this.getStatusId(taskObj['status']);
		}
		log(toodleDoTask);
		log(toodleDoTask.getRequestObject());
		toodleDo.addTask(toodleDoTask, function(response) {
			if (response.status == "ok") {
				callback(new Response("ok", "Task Added"));
			}
			else {
				callback(response);
			}
		});
	},
	getDates: function() {
		var dates = [];
		dates.push({'Text': 'Today'});
		dates.push({'Text': 'Tomorrow'});
		dates.push({'Text': 'Sunday'});
		dates.push({'Text': 'Monday'});
		dates.push({'Text': 'Tuesday'});
		dates.push({'Text': 'Wednesday'});
		dates.push({'Text': 'Thursday'});
		dates.push({'Text': 'Friday'});
		dates.push({'Text': 'Saturday'});
		return dates;
	},
	getStatus: function() {
		var status = [];
		status.push({'Text': 'None'});
		status.push({'Text': 'Next Action'});
		status.push({'Text': 'Active'});
		status.push({'Text': 'Planning'});
		status.push({'Text': 'Delegated'});
		status.push({'Text': 'Waiting'});
		status.push({'Text': 'Hold'});
		status.push({'Text': 'Postponed'});
		status.push({'Text': 'Someday'});
		status.push({'Text': 'Canceled'});
		status.push({'Text': 'Reference'});
		return status;
	},
	getPriorities: function() {
		var priorities = [];
		priorities.push({'Text': '!'});
		priorities.push({'Text': '!!'});
		priorities.push({'Text': '!!!'});
	},
	getStatusId: function(text) {
		var statusList = {
			'None': 0,
			'Next Action': 1,
			'Active': 2,
			'Planning': 3,
			'Delegated': 4,
			'Waiting': 5,
			'Hold': 6,
			'Postponed': 7,
			'Someday': 8,
			'Canceled': 9,
			'Reference': 10
		}
		return statusList[text];
	},
	getObjectId: function(text, arr) {
		for (var i = 0; i < arr.length; i++) {
			var obj = arr[i];
			if (obj.Text.toLowerCase() == text.toLowerCase())
				return obj.id;
		}
		return '';
	},
	getData: function(callback) {
		if (TESTING) {
			callback(new Response("ok", []));
			return;
		}
		var self = this;
		toodleDo.getFolders(function(response) {
			if (response.status == "error") {
				callback(response);
			}
			else {
				var data = response.data;
				self.folders = new Array();
				if (data.folder) {
					for(var i = 0; i < data.folder.length; i++) {
						if (data.folder[i].archived == "0")
							self.folders.push(data.folder[i]);
					}
				}
				toodleDo.getContexts(function(response) {
					if (response.status == "error") {
						callback(response);
					}
					else {
						var data = response.data;
						self.contexts = new Array();
						if (data.context) {
							for (var i = 0; i < data.context.length; i++) {
								var c = data.context[i];
								log(c);
								if (c.Text[0] == "@")
									c.Text = c.Text.substr(1,c.Text.length - 1)
								log(c);
								self.contexts.push(c);
							}
						}
						callback(response);
					}
				});
			}
		});
	}
});

objects.RememberLocation = function(airWindow) {
	var self = this;
	this.airWindow = airWindow;
	this.currentLocationX = 0;
	this.currentLocationY = 0;
	this.airWindow.addEventListener(air.NativeWindowBoundsEvent.MOVE, function() { self.getLocation(); });
	this.airWindow.addEventListener(air.Event.CLOSE, function() { self.saveLocation() });
	this.moveWindow();
}
objects.RememberLocation.extend({
	isValidScreen: function(location) {
		var rect = new air.Rectangle(location[0], location[1], this.airWindow.width, this.airWindow.height);
		var current; 
		var screens = air.Screen.getScreensForRectangle(rect); 
		(screens.length > 0) ? current = screens[0] : current = ''; 
		log(current);
		return current; 
	},
	getLocation: function() {
		this.currentLocationX = this.airWindow.x;
		this.currentLocationY = this.airWindow.y;
	},
	moveWindow: function() {
		var oldLocation = this.readLocation();
		log(oldLocation);
		if (oldLocation) {
			if (this.isValidScreen(oldLocation)) {
				this.airWindow.x = oldLocation[0];
				this.airWindow.y = oldLocation[1];
			}
		}
	},
	readLocation: function() {
		var point = db.readStoredValue("location");
		if (point)
			return point.split(",");
		else
			return false;
	},
	saveLocation: function() {
		db.writeStoredValue("location", this.currentLocationX+","+this.currentLocationY);
	}
});

