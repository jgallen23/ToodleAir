var DEBUG = false;
var autoHide;

$(document).ready(function() { 
	log("show console");
	toodleDo.setApplicationId("ToodleAir");
	autoHide = new AutoHide(window.nativeWindow, true);
	updater.initialize();
	windowButtons.init();
	new RememberLocation();
	loginSection.show();

	window.nativeWindow.addEventListener(air.Event.ACTIVATE, function(event) {
		var section = util.getActiveSection();
		section.focus();
	});
});

var RememberLocation = function() {

	var currentLocation;

	var moveWindow = function() {
		var oldLocation = util.readStoredValue("location");
		log(oldLocation);
		if (oldLocation) {
			var point = oldLocation.split(',');
			if (isValidScreen(point)) {
				window.nativeWindow.x = point[0];
				window.nativeWindow.y = point[1];
			}
		}
		nativeWindow.alwaysInFront = (util.readStoredValue("ontop") == "true");
	};

	var isValidScreen = function(location) {
		var rect = new air.Rectangle(location[0], location[1], nativeWindow.width, nativeWindow.height);
		var current; 
		var screens = air.Screen.getScreensForRectangle(rect); 
		(screens.length > 0) ? current = screens[0] : current = ''; 
		log(current);
		return current; 
	};

	var getLocation = function() {
		currentLocation = window.nativeWindow.x+","+window.nativeWindow.y;
	};

	var setLocation = function() {
		log("close");
		log(currentLocation);
		util.writeStoredValue("location", currentLocation);
		var ontop = nativeWindow.alwaysInFront.toString();
		log(ontop);
		util.writeStoredValue("ontop", ontop);
	};

	moveWindow();
	window.nativeWindow.addEventListener(air.NativeWindowBoundsEvent.MOVE, getLocation);
	window.nativeWindow.addEventListener(air.Event.CLOSE, setLocation);
};

var log = function(item) {
	if (DEBUG) {
		air.trace(item);
		air.Introspector.Console.log(item);
	}
};

var loader = function() {
	return {
		toggle: function() {
			$("#Loader").toggle();
		}
	};
}();

var util =  {
	readStoredValue: function(key) {
		var storedValue = air.EncryptedLocalStore.getItem(key); 
		if (storedValue) {
			var val = storedValue.readUTFBytes(storedValue.length);
			return val;
		}
		else
			return '';
	},
	writeStoredValue: function(key, value) {
		var bytes = new air.ByteArray(); 
		bytes.writeUTFBytes(value); 
		air.EncryptedLocalStore.setItem(key, bytes); 
	},
	removeStoreValue: function(key) {
		air.EncryptedLocalStore.removeItem(key);
	},
	resetStore: function() {
		air.EncryptedLocalStore.reset();
	},
	getActiveSectionId: function() {
		var id = "";
		$(".Section").each(function(i) {
			if (this.style.display == "block") {
				id = this.id;
			}
		});
		return id;
	},
	getActiveSection: function() {
		activeSectionId = this.getActiveSectionId();
		return sections[activeSectionId];
	},
	getSectionSize: function(id) {
		if (!id)
			id = this.getActiveSectionId();

		var section = $("#"+id);
		return [section[0].offsetWidth, section[0].offsetHeight];
	},
	hideActiveSection: function(callback) {
		activeSectionId = this.getActiveSectionId();
		sections[activeSectionId].hide(callback);
	}

};


var windowButtons = function() {

	var mouseMove = function(event) {
	};

	var move = function() {
		nativeWindow.startMove();
	};

	var close = function() {
		nativeWindow.close();
	};

	var logout = function() {
		util.resetStore();
		util.hideActiveSection(loginSection.show);
		showMenu();
	};

	var minimize = function() {
		nativeWindow.minimize();
	};

	var onTop = function() {
		showMenu();
		if (nativeWindow.alwaysInFront) {
			nativeWindow.alwaysInFront = false;
		}
		else {
			nativeWindow.alwaysInFront = true;
		}
	};

	var setOnTopText = function() {
		if (!nativeWindow.alwaysInFront)
			$(".OnTop").html("Set Always On Top");
		else
			$(".OnTop").html("Disable On Top");
	};

	var showMenu = function() {
		if ($(".Menu").css("display") == "none") {
			setOnTopText();
			$(".Menu").slideDown();
			setTimeout(function() {
				$(document).one("mousedown", function() {
					$(".Menu").slideUp();
				})}, 200);
		}
		else {
			$(".Menu").slideUp();
		}
	};

	return {
		init: function() {
			$("a.Logout").bind("mousedown", logout);
			$(".Header").bind("mousedown", move);
			$("a.Close").bind("mousedown", close);
			$("a.OnTop").bind("mousedown", onTop);
			$("a.MenuButton").bind("mousedown", showMenu);
			$("a.Minimize").bind("mousedown", minimize);
		},
		show: function() {
		}
	};
}();

var notification = function() {

	var id = "Notification";
	
	var hide = function() {
		$("#"+id).fadeOut();
	};

	return {
		init: function() {
			$("#"+id).bind("click", hide);
		},
		show: function(msg) {
			var me = this;
			//var currentSize = util.getSectionSize();
			$("#"+id+" .container").html(msg);
			$("#"+id).fadeIn(function() {
				setTimeout(hide, 5000);
			});
		}
	};
}();

var loginSection = function() {
	var id = "Login";

	var getToken = function(userId, password, callback) {
		toodleDo.getToken(userId, password, function(hasErrors, data) {
			if (hasErrors) {
				$("#"+id).fadeIn(function() { 
					new TextBoxHint(id);
				});
				notification.show(data);
			}
			else {
				saveAuthKey(toodleDo.getAuthKey());
				callback();
			}
		});
	};

	var saveUserId = function(userId) {
		util.writeStoredValue("userId", userId);
	};

	var savePassword = function(password) {
		util.writeStoredValue("password", password);
	};

	var saveAuthKey = function(authKey) {
		util.writeStoredValue("authKey", authKey);
		util.writeStoredValue("authKeyTime", new Date().getTime());
	};

	var isVerified = function() {
		var userId = util.readStoredValue("userId");
		var password = util.readStoredValue("password");
		if (userId && password)
			return [userId, password];
		else
			return false;
	};

	var isValidAuthKey = function() {

		var authKey = util.readStoredValue("authKey");
		var authKeyTime = util.readStoredValue("authKeyTime");
		var currentTime = new Date().getTime();
		var hour = 60*60*1000;
		var validKeyHours = 4;

		if (Math.ceil((currentTime - authKeyTime) / hour) < 4)
			return authKey;
		else
			return false;
	};

	return {
		show: function() {
			var user = isVerified();
			if (user) {
				var me = this;
				var authKey = isValidAuthKey();
				log(authKey);
				var callback = function() {
					taskSection.show() 
				};
				if (!authKey)
					getToken(user[0], user[1], callback);
				else {
					toodleDo.setUserIdAndPass(user[0], user[1]);
					toodleDo.setAuthKey(authKey);
					callback();
				}
			}
			else {
				var me = this;
				$("#"+id).fadeIn(function() { 
					//me.focus();
					new TextBoxHint(id)
				});
			}
		},
		focus: function() {
			$("#email").focus();
		},
		hide: function(callback) {
			$("#"+id).fadeOut(callback);
		},
		login: function() {
			var email = $("#email").val();
			var pass = $("#password").val();
			loader.toggle();
			var me = this;
			toodleDo.getUserId(email, pass, function(errors, data) {
				loader.toggle()
				if (errors)
					notification.show(data);
				else {
					var userId = data.Text;
					if (userId == "0" || userId == "1") {
						notification.show("Invalid Email or Password");
					}
					else {
						saveUserId(userId);
						savePassword(pass);
						getToken(userId, pass, function() {
							me.hide(function() { taskSection.show() });
						});
					}
				}
			});
		}
	}
}();

var taskSection = function() {
	var id = "Tasks";
	var listId = "TaskList";
	var folders;
	var contexts;

	var getObjectId = function(text, arr) {
		for (var i = 0; i < arr.length; i++) {
			var obj = arr[i];
			if (obj.Text.toLowerCase() == text.toLowerCase())
				return obj.id;
		}
		return '';
	};

	var getStatusId = function(text) {
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
	};

	var parseTask = function(task) {

		taskObject = {}

		//Call Jim !! @phone #today
		//Finish the Report ! #next friday *ProjectA @work
		//Mow the lawn *Chores @home

		taskObject['priority'] = 0 ;

		var endIndex = task.length
		for (var i = task.length; i > 0; i--) {
			if (task[i] in parseArray(['!', '#', '*', '@', '^', '+', '$'])) {
				if (task[i] == "!") {
					taskObject['priority']++;
					endIndex = i;
					continue;
				}
				var sub = task.substr(i+1, endIndex - (i+1));
				sub = trim(sub);
				if (task[i] == "#")
					taskObject['due'] = sub;
				else if (task[i] == "*")
					taskObject['folder'] = sub;
				else if (task[i] == "@")
					taskObject['context'] = sub;
				else if (task[i] == "^")
					taskObject['startDate'] = sub;
				else if (task[i] == "+")
					taskObject['note'] = sub;
				else if (task[i] == "$")
					taskObject['status'] = sub;
				endIndex = i;
			}
			if (i == 1) {
				taskObject['title'] = trim(task.substr(0, endIndex));
			}
		}
		return taskObject;
	};


	var getData = function(callback) {
		toodleDo.getFolders(function(hasErrors, data) {
			if (hasErrors) {
				notification.show(data);
			}
			else {
				folders = new Array();
				for(var i = 0; i < data.folder.length; i++) {
					if (data.folder[i].archived == "0")
						folders.push(data.folder[i]);
				}
				toodleDo.getContexts(function(hasErrors, data) {
					if (hasErrors) {
						notification.show(data);
					}
					else {
						contexts = data.context
						callback();
					}
				});
			}
		});
		//pollForData(callback);
	};

	var pollForData = function(callback) {
		if (folders && contexts)
			callback();
		else
			setTimeout(function() { pollForData(callback) }, 100);
	};



	var parseArray = function(a) {
		var o = {};
		for(var i=0;i<a.length;i++) {
			o[a[i]]='';
		}
		return o;
	}

	var getDates = function() {
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
	};

	var getStatus = function() {
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

	};


	var initAutoComplete = function() {
		var triggers = [];
		//folder *
		triggers.push({'key': '*', 'data': folders});
		//context @
		triggers.push({'key': '@', 'data': contexts});
		var dates = getDates();
		//due date #
		triggers.push({'key': '#', 'data': dates});
		//start date ^
		triggers.push({'key': '^', 'data': dates});

		//status $
		triggers.push({'key': '$', 'data': getStatus()});

		autoComplete.init("query", 5, triggers);
	}

	return {
		show: function() {
			var me = this;
			$("#"+id).fadeIn(function() {
				loader.toggle();
				getData(function() {	
					loader.toggle();
					initAutoComplete();
					me.focus();
				});
			});
		},
		focus: function() {
			$("#query").focus();
		},
		hide: function(callback) {
			$("#"+id).fadeOut(callback);
		},
		execute: function() {
			loader.toggle();
			var query = $("#query").val();

			var taskObj = parseTask(query);

			var title, folderId, contextId, priority, dueDate, startDate, note, statusId;

			title = taskObj['title'];
			priority = taskObj['priority'];
			if (taskObj['due']) {
				dueDate = taskObj['due'];
			}
			if (taskObj['startDate']) {
				startDate = taskObj['startDate'];
			}
			if (taskObj['folder']) {
				folderId = getObjectId(taskObj['folder'], folders);
			}
			if (taskObj['context']) {
				contextId = getObjectId(taskObj['context'], contexts);
			}
			if (taskObj['note']) {
				note = taskObj['note'];
			}
			if (taskObj['status']) {
				statusId = getStatusId(taskObj['status']);
			}
			toodleDo.addTask(function(hasErrors, data) {
				loader.toggle();
				if (!hasErrors) {
					$("#query").val('');
					notification.show("Task Added");
				}
				else {
					notification.show(data);
				}
			}, title, '', folderId, contextId, '', '', dueDate, startDate, '', '', '', statusId, '', priority, '', note);
			//title, tag, folderId, contextId, goalId, parentId, dueDate, startDate, dueTime, repeatId, repAdvanced, statusId, length, priority, star, note
		},
		showTaskList: function() {
			$("#"+listId).slideDown();
		},
		testParse: function() {
			var tasks = [
				'Call Jim !! @phone #today ^today +note',
				'Finish the Report ! #next friday *ProjectA @work',
				'Mow the lawn *Chores @home'
				]
			
			for (var i = 0; i < tasks.length; i++) {
				log(tasks[i]);
				log(parseTask(tasks[i]));
			}
		}
	}
}();

var sections = {
	'Login': loginSection,
	'Tasks': taskSection
}

var TextBoxHint = function(sectionId) {

	var showHint = function(textbox) {
		var hint = $(textbox).attr("hint");
		$(textbox).val(hint);
	};

	var hideHint = function(textbox) {
		$(textbox).val('');
	};

	$("#"+sectionId+" :input").each(function(i) {
		if ($(this).attr("type") != "submit") {
			showHint(this);

			$(this).bind("blur", function() {
				if ($(this).val() == "")
					showHint(this);
			});

			$(this).bind("focus", function() {
				if ($(this).val() == $(this).attr("hint"))
					hideHint(this);
			});
		}
	});
};

var autoComplete = function() {

	var _autoCompleteId = "AutoComplete";	
	var _timeoutCheck;
	var _textBoxId;
	var _triggers;
	var _selectedResultIndex = 0;
	var _matches;
	var _isActive = false;
	var _currentSearch;
	var _maxResults;
	var _currentKeyCode;

	var addTextBoxEvents = function(textBoxId) {
		_textBoxId = textBoxId;
		$("#"+textBoxId)
			.bind("keydown", keyDownEvent)
			.bind("keypress", keyPressEvent)
			.bind("keyup", keyUpEvent);
	}

	var keyDownEvent = function(event) {
		log("down");
		log(event.keyCode);
		if (event.keyCode != 0) {
			_currentKeyCode = event.keyCode;
			if (_currentKeyCode == 40 || 
					_currentKeyCode == 38 ||
				   	_currentKeyCode == 27 ||
				   	_currentKeyCode == 13 ||
					_currentKeyCode == 8
				)
				return keyPressEvent(event);
		}
	};

	var keyPressEvent = function(event) {
		log("press");
		if (_timeoutCheck)
			clearTimeout(_timeoutCheck)

		var key = event.which;
		log(String.fromCharCode(key))
		log(event);
		for (var i = 0; i < _triggers.length; i++) {
			if (_triggers[i].key == String.fromCharCode(key)) {
				_isActive = true;
				_currentTrigger = _triggers[i];
				_selectedResultIndex = 0;
				_currentSearch = '';
				showAutoComplete();
				return true;
			}
		}
		if (_isActive) {
			log(key);
			if (key == 8)
				_currentSearch = _currentSearch.substr(0, _currentSearch.length - 1)
			else if (key != 0 && key != 38 && key != 40)
				_currentSearch += String.fromCharCode(key);

			log(_currentKeyCode);
			log(_currentSearch);

			if (_currentKeyCode == 40) { //down
				hoverResultDown();
				return false;
			}
			else if (_currentKeyCode == 38) { //up
				hoverResultUp();
				return false;
			}
			else if (_currentKeyCode == 27) { //esc
				hideResults();
				return false;
			}
			else if (_currentKeyCode == 13) { //enter
				selectResult();	
				return false;
			}
			else if (_currentKeyCode == 32) { //space
				hideResults();
				_isActive = false;
				return true;
			}
			else {
				_timeoutCheck = setTimeout(function() {
					showAutoComplete();
				}, 300);
			}
		}
	}

	var keyUpEvent = function(event) {
	};

	var getCharCode = function(str) {
		var charCodes = '';
		for (var i = 0; i < str.length; i++) {
			charCodes += str.charCodeAt(i)+", ";
		}
		return charCodes;
	}

	var selectResult = function() {
		var result = _matches[_selectedResultIndex];
		log(result);
		var txt = $("#"+_textBoxId);
		var currentValue = trim(txt.val());
		if (result) {
			var mySearch = trim(_currentTrigger.key + _currentSearch);
			var myMatch = trim(_currentTrigger.key + result.Text);

			log(mySearch);
			log(myMatch);
				
			currentValue = currentValue.replace(mySearch, myMatch);
			txt.val(currentValue+" ");
		} else {
			txt.val(currentValue+" ");
		}
		_isActive = false;
		hideResults();

	};

	var showAutoComplete = function() {
		_matches = getMatches(_currentSearch, _currentTrigger.data);
		$("#"+_autoCompleteId).html('');
		var max = _maxResults;
		if (_matches.length < max)
			max = _matches.length;
		for(var i = 0; i < max; i++) {
			addMatch(_matches[i].Text);
		}
		hoverResult(0);
	}

	var addMatch = function(text) {
		$("#"+_autoCompleteId).append("<li>"+text+"</li>");
	}

	var getMatches = function(text, objects) {
		var re = new RegExp(text, "i");
		matches = [];
		for (var i = 0; i < objects.length; i++) {
			if (objects[i].Text.match(re))
				matches.push(objects[i]);
		}
		return matches;
	}

	var hoverResultDown = function() {
		var newIndex = _selectedResultIndex;
		if (_selectedResultIndex == -1 || _matches.length == (_selectedResultIndex + 1)) {
			newIndex = 0;
		}
		else {
			newIndex++;
		}
		hoverResult(newIndex);
	}

	var hoverResultUp = function() {
		var newIndex = _selectedResultIndex;
		if (_selectedResultIndex == -1 || _selectedResultIndex == 0) {
			newIndex = _matches.length - 1;
		}
		else {
			newIndex--;
		}
		hoverResult(newIndex);
	};

	var hoverResult = function(newIndex) {
		var liList = $("#"+_autoCompleteId).find("li");
		if (typeof(_selectedResultIndex) != 'undefined') {
			liList.eq(_selectedResultIndex).removeClass("selected");
		}
		_selectedResultIndex = newIndex;
		liList.eq(_selectedResultIndex).addClass("selected");
	};

	var hideResults = function() {
		$("#"+_autoCompleteId).html('');
	};

	var clearTextBox = function() {
		$("#"+_textBoxId).val('');
	};
	
	return {

		init: function(textBoxId, maxResults, triggers) {
			_triggers = triggers;
			_maxResults = maxResults;
			addTextBoxEvents(textBoxId);	
		},



	}

}();



var trim = function(str) {
	return str.replace(/^\s+|\s+$/g, '')
}


var updater = function() {
	var appUpdater;
	var initialize = function() {
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
	};

	var getCurrentVersion = function() {
		return appUpdater.currentVersion;
	};

	return {
		initialize: function() {
			initialize();
		}
	}
}();

