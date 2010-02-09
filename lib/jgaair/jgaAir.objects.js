jgaAir.objects.RememberLocation = function(airWindow) {
	var self = this;
	this.airWindow = airWindow;
	this.currentLocationX = 0;
	this.currentLocationY = 0;
	this.airWindow.addEventListener(air.NativeWindowBoundsEvent.MOVE, function() { self.getLocation(); });
	this.airWindow.addEventListener(air.Event.CLOSE, function() { self.saveLocation() });
	this.moveWindow();
}
jgaAir.objects.RememberLocation.extend({
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
		var point = jgaAir.db.readStoredValue("location");
		if (point)
			return point.split(",");
		else
			return false;
	},
	saveLocation: function() {
		jgaAir.db.writeStoredValue("location", this.currentLocationX+","+this.currentLocationY);
	}
});

jgaAir.objects.RememberSize = function(airWindow) {
	var self = this;
	this.airWindow = airWindow;
	this.currentWidth = this.airWindow.width;
	this.currentHeight = this.airWindow.height;
	this.airWindow.addEventListener(air.Event.RESIZE, function() { self.getSize(); });
	this.airWindow.addEventListener(air.Event.CLOSE, function() { self.saveSize() });

	this.resizeWindow();
}
jgaAir.objects.RememberSize.extend({
	getSize: function() {
		this.currentWidth = this.airWindow.width;
		this.currentHeight = this.airWindow.height;
	},
	resizeWindow: function() {
		var size = this.readSize();
		if (size) {
			this.airWindow.width = size[0];
			this.airWindow.height = size[1];
		}
	},
	readSize: function() {
		var point = jgaAir.db.readStoredValue("size");
		if (point)
			return point.split(",");
		else
			return false;
	},
	saveSize: function() {
		jgaAir.db.writeStoredValue("size", this.currentWidth+","+this.currentHeight);
	}
});

jgaAir.objects.Updater = function(updateUrl) {
	var appUpdater;
	var initialize = function() {
   		appUpdater = new runtime.air.update.ApplicationUpdaterUI();

        // start updater config  

       	//change this to point to the online update.xml.
		appUpdater.updateURL = updateUrl;
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

	initialize();
};
