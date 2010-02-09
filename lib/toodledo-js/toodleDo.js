
var toodleDoDebug = false;
var toodleDo = function() {
	var _baseUrl = "http://www.toodledo.com/api.php?"
	var _userId = '';
	var _password = '';
	var _authKey = '';
	var _applicationId;

	var buildUrl = function(method, params) {
		var url = _baseUrl + "method=" + method;
		if (!params) {
			params = { };
		}
		if (_authKey) { 
			params['key'] = _authKey;
		}
		if (_applicationId)
			params['appid'] = _applicationId;
		for (param in params) {
			url += ";" + param + "=" + cleanParam(params[param]);
		}
		log(url);
		return url;
	}

	var cleanParam = function(param) {
		return escape(param).replace("+", "%2B");
	}

	var makeRequest = function(url, callback) {
		var self = this;
		$.get(url, function(data) { 
			var obj = $.xmlToJSON(data);
			log(obj);
			if (obj.RootName == "error") {
				if (obj.Text == "key did not validate") {
					log("invalid key, getting new token");
					_authKey = '';
					toodleDo.getToken(_userId, _password, function(response) {
						log(data);
						callback(new self.Response("error", obj.Text));

					});
				}
				else
					callback(new self.Response("error", obj.Text))
			}
			else {
				callback(new self.Response("ok", obj));
			}
		});
	}

	var createAuthKey = function(userId, password, token) {
		return hex_md5(hex_md5(password)+token+userId);
	}

	var log = function(item) {
		if (toodleDoDebug) {
			air.trace(item);
			air.Introspector.Console.log(item);
		}
	};

	return {
		Response: function(status, data) {
			this.status = status;
			this.data = data;
		},
		setApplicationId: function(id) {
			log(this);
			applicationId = id;
		},	  
		getUserId: function(email, password, callback) {
			var me = this;
			var url = buildUrl('getUserid', { 'email': email, 'pass': password });
			makeRequest(url, function(response) {
				if (response.status == "error" && response.data == "key did not validate")
					me.getUserId(email, password, callback)
				else
					callback(response);
			});
		},
		getToken: function(userId, password, callback) {
			var url = buildUrl('getToken', { 'userid': userId });
			makeRequest(url, function(response) {
				if (response.status == "ok") {
					_userId = userId;
					_password = password;
					_authKey = createAuthKey(userId, password, response.data.Text);
				}
				if (callback)
					callback(response);
			});
		},
		setUserIdAndPass: function(userId, password) {
			_userId = userId;
			_password = password;
		},
		getAuthKey: function() {
			return _authKey;
		},
		setAuthKey: function(authKey) {
			_authKey = authKey;
		},
		removeAuthKey: function() {
			_authKey = '';
		},
		getFolders: function(callback) {
			var me = this;
			var url = buildUrl('getFolders');
			makeRequest(url, function(response) {
				if (response.status == "error" && response.data == "key did not validate")
					me.getFolders(callback)
				else
					callback(response);
			});

		},
		getContexts: function(callback) {
			var me = this;
			var url = buildUrl('getContexts');
			makeRequest(url, function(response) {
				if (response.status == "error" && response.data == "key did not validate")
					me.getContexts(callback)
				else
					callback(response);
			});
		},
		addTask: function(task, callback) {
			var me = this;
			
			var url = buildUrl('addTask', task.getRequestObject());
			makeRequest(url, function(response) {
				if (response.status == "error" && response.data == "key did not validate")
					me.addTask(task, callback)
				else
					callback(response);
			});

		},
		getServerInfo: function(callback) {
			var me = this;
			var url = buildUrl('getServerInfo');
			makeRequest(url, function(response) {
				if (response.status == "error" && response.data == "key did not validate")
					me.getServerInfo(callback)
				else
					callback(response);
			});
		},
		Task: function() {
			this.title = "";
			this.tag = "";
			this.folderId = ""; 
			this.contextId = ""; 
			this.goalId = ""; 
			this.parentId = ""; 
			this.dueDate = ""; 
			this.startDate = ""; 
			this.dueTime = ""; 
			this.repeatId ="" ; 
			this.repAdvanced = ""; 
			this.statusId = ""; 
			this.length = ""; 
			this.priority = ""; 
			this.star = "";
			this.note = "";
		}
	}
}();


toodleDo.Task.prototype.getRequestObject = function() {
	var mappings = {
		'title': 'title',
		'tag': 'tag',
		'folder': 'folderId',
		'context': 'contextId',
		'goal': 'goalId',
		'parent': 'parentId',
		'duedate': 'dueDate',
		'startdate': 'startDate',
		'duetime': 'dueTime',
		'repeat': 'repeatId',
		'rep_advanced': 'repAdvanced',
		'status': 'statusId',
		'length': 'length',
		'priority': 'priority',
		'star': 'star',
		'note': 'note'
	}
	var task = {}
	for (var param in mappings) {
		var thisMap = mappings[param];
		if (typeof(this[thisMap]) !== "undefined" && this[thisMap] != "")
			task[param] = this[thisMap];
	}
	return task
};
