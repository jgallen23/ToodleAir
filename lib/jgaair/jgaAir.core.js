var DEBUG = false;
var log = function(item) {
	if (DEBUG) {
		air.trace(item);
		air.Introspector.Console.log(item);
	}
};

jgaAir = {}
jgaAir.objects = {}

