jgaAir.db = { 
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
