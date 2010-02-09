/*
 * Adobe Air AutoHide
 *
 * Copyright (c) 2008 Greg Allen (www.jga23.com)
 * Licensed under the GPL (GPL-LICENSE.txt) license.
 *
 * Date: 12.25.2008
 * Version: 1.11
 */

var AutoHide = function(nativeWindow, autoStart) {
	var DEBUG = false;
	var me = this;
	var x = 0;
	var y = 0;
	var lastX = 0;
	var lastY = 0;
	var height = 0;
	var width = 0;
	var sidePadding = 10;
	var moveOffset = 2;
	var animateStep = 10;
	var moveTimer;
	var isDocked = false;
	var trackMove = true;
	var isHover = false;
	var currentScreen;
	//EVENT HANDLERS
	var dockEventHandler;
	var unDockEventHandler;
	var showEventHandler;
	var hideEventHandler;

	var log = function(item) {
		if (DEBUG) {
			air.trace(item);
			air.Introspector.Console.log(item);
		}
	};

	var onMove = function() {
		if (!trackMove)
			return;
		log("move");
		x = nativeWindow.x;
		y = nativeWindow.y;
		if (!moveTimer)
			movePoll();
	
	};

	var movePoll = function() {
		moveTimer = setTimeout(function() {
			log("move poll");
			if (nativeWindow.x == lastX && nativeWindow.y == lastY) {
				//done moving
				moveTimer = '';
				dockWindow();
			}
			else {
				lastX = nativeWindow.x;
				lastY = nativeWindow.y;
				movePoll();
			}
		}, 500);
	};

	var onResize = function() {
		height = nativeWindow.height;
		width = nativeWindow.width;
	};

	var mouseEnter = function() {
		isHover = true;
		log("enter");
		if (isDocked) {
			showWindow();
		}
	};

	var mouseLeave = function() {
		isHover = false;
		log("leave");
		setTimeout(function() {
			if (!isHover && isDocked) {
				dockWindow();
			}
		}, 1500);
	};

	var isNearBound = function() {
		currentScreen = getCurrentScreen();
		log(currentScreen);

		if ((x + width) > (currentScreen.visibleBounds.x + currentScreen.visibleBounds.width - sidePadding)) {
			return "right"
		}

		if (x < (currentScreen.visibleBounds.x + sidePadding)) {
			return "left"
		}
		return false;
	};

	var dockWindow = function() {
		log("check dock");
		var dockSide = isNearBound();

		if (dockSide) {
			if (!isDocked && dockEventHandler)
				dockEventHandler();
			if (isDocked && hideEventHandler)
				hideEventHandler();
			isDocked = dockSide;
			log(dockSide);
			nativeWindow.alwaysInFront = true;
			if (dockSide == "left")
				dockLeft();
			else if(dockSide == "right")
				dockRight();
		}
		else {
			if (isDocked) {
				if (unDockEventHandler)
					unDockEventHandler();
				nativeWindow.alwaysInFront = false;
			}

			isDocked = false;
		}
	};

	var dockRight = function() {
		log("dock right");
		animateWithoutTracking(currentScreen.visibleBounds.x + (currentScreen.visibleBounds.width - moveOffset));
	};

	var dockLeft = function() {
		log("dock left");
		animateWithoutTracking((currentScreen.visibleBounds.x - width + moveOffset));
	};

	var showWindow = function() {
		log("show");
		if (isDocked) {
			if (showEventHandler)
				showEventHandler();
			nativeWindow.activate();
			if (isDocked == "left") {
				//nativeWindow.activate();
				animateWithoutTracking(currentScreen.visibleBounds.x + moveOffset);
			}
			else {
				animateWithoutTracking(currentScreen.visibleBounds.x + currentScreen.visibleBounds.width - (width + moveOffset));
			}
		}

	};

	var getCurrentScreen = function(){ 
		var current; 
		var screens = air.Screen.getScreensForRectangle(nativeWindow.bounds); 
		(screens.length > 0) ? current = screens[0] : current = air.Screen.mainScreen; 
		return current; 
	} ;

	var moveWithoutTracking = function(xPos) {
		log(xPos);
		trackMove = false;
		nativeWindow.x = xPos;
		setTimeout(function() { trackMove = true; }, 500);
	};

	var animateWithoutTracking = function(xPos) {
		log(xPos);
		trackMove = false;
		var currentX = nativeWindow.x;
		if (xPos < currentX) {
			for (i = currentX; i >= xPos; i -= animateStep) {
				nativeWindow.x = i;
			}
		}
		else {
			for (i = currentX; i <= xPos; i += animateStep) {
				nativeWindow.x = i;
			}
		}
		nativeWindow.x = xPos;

		setTimeout(function() { trackMove = true; }, 500);
	};

	var windowActivate = function() {
		log("activate");
		if (isDocked) {
			showWindow();
		}
	};

	var windowDeactivate = function() {
		log("deactivate");
		if (isDocked) {
			dockWindow();
		}
	};

	this.enable = function() {
		log("show console");
		trackMove = true;
		onMove();
		onResize();
		nativeWindow.addEventListener(air.Event.ACTIVATE, windowActivate);
		nativeWindow.addEventListener(air.Event.DEACTIVATE, windowDeactivate);
		nativeWindow.stage.addEventListener("mouseOver",mouseEnter);
		nativeWindow.stage.addEventListener("mouseOut",mouseLeave);
		nativeWindow.addEventListener(air.NativeWindowBoundsEvent.MOVE, onMove);
		nativeWindow.addEventListener(air.NativeWindowBoundsEvent.RESIZE, onResize);
	}

	this.disable = function() {
		trackMove = false;
	}

	this.bind = function(event, callback) {
		if (event == "dock")
			dockEventHandler = callback;
		else if (event == "undock")
			unDockEventHandler = callback;
		else if (event == "show")
			showEventHandler = callback;
		else if (event == "hide")
			hideEventHandler = callback;
	}

	if (autoStart) {
		this.enable();
	}
};
