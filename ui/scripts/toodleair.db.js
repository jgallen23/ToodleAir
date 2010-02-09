var db = function() {



return {
	saveUser: function(userId, password, authKey) {
		this.writeStoredValue("userId", userId);
		this.writeStoredValue("password", password);
		this.writeStoredValue("authKey", authKey);
		this.writeStoredValue("authKeyTime", new Date().getTime());
	},
	getUser: function() {
		var user = {
			userId: this.readStoredValue("userId"),
			password: this.readStoredValue("password"),
			authKey: this.readStoredValue("authKey"),
			authKeyTime: this.readStoredValue("authKeyTime")
		}
		if (user.userId && user.password)
			return user;
		else
			return false;
	},
	getSavedLocation: function() {
		var loc = this.readStoredValue("location");
		if (loc) {
			return loc.split(",");
		} else { 
			return '';
		}
	},
	saveLocation: function(x, y) {
		writeStoredValue("location", x+","+y);
	},
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
	}
}

}();

