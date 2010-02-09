if (typeof(JGAAIRLOCATION) === "undefined")
	JGAAIRLOCATION = "";

JGALOCATION = JGAAIRLOCATION + "/jga/";
var jgaAirWriteScript = function(script) {
	document.write('<script type="text/javascript" src="' + JGAAIRLOCATION + "/" + script + '"></script>');
}

jgaAirWriteScript("jga/jga.js");
jgaAirWriteScript("jgaAir.core.js");
jgaAirWriteScript("jgaAir.db.js");
jgaAirWriteScript("jgaAir.objects.js");

