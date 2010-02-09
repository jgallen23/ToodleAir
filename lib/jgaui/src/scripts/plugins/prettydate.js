$.ux.behavior("PrettyDate", {
	initialize: function() {
		var prettyDate = this.getPrettyDate(this.element.html());
		this.element.html(prettyDate);
	},
	getPastPrettyDate: function(day_diff, diff) {
		return day_diff == 0 && (
				diff < 60 && "just now" ||
				diff < 120 && "1 minute ago" ||
				diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
				diff < 7200 && "1 hour ago" ||
				diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
			day_diff == 1 && "Yesterday" ||
			day_diff < 7 && day_diff + " days ago" ||
			false
	},
	getFuturePrettyDate: function(day_diff, diff) {
		return day_diff == 0 && (
				diff < 60 && "in a minute" ||
				diff < 360 && "in a few minutes" ||
				diff < 3600 && "in " + Math.floor( diff / 60 ) + " minutes" ||
				diff < 7200 && "in 1 hour" ||
				diff < 86400 && "in " + Math.floor( diff / 3600 ) + " hours") ||
			day_diff == 1 && "Tomorrow" ||
			day_diff < 7 && "in " + day_diff + " days" ||
			false
	},
	getPrettyDate: function(time) {
		var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
			diff = (((new Date()).getTime() - date.getTime()) / 1000),
			day_diff = Math.floor(Math.abs(diff) / 86400);				
		console.log(time, day_diff, diff);
		if (isNaN(day_diff))
			return time;
		else if ( diff > 0)
			return this.getPastPrettyDate(day_diff, diff) || time;
		else if ( diff < 0) 
			return this.getFuturePrettyDate(day_diff, -diff) || time;
	}
});
