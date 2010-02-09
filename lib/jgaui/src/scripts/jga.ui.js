
(function($) { 

	$.fn.textboxHint = function(hint, options) {
		var opts = $.extend({}, $.fn.textboxHint.defaults, options);

		var hideHint = function() {
			this
				.removeClass(opts.hintClass)
				.val('');
		};

		var showHint = function() {
			this
				.addClass(opts.hintClass)
				.val(hint);
		};

		var isPassword = function() {
			if (this.attr("type").toLowerCase() == "password")
				return true;
			else
				return false;
		};

		return this.each(function() {
			var $this = $(this);
			
			$this.bind("focus", function() {
				if ($this.val() == hint)
					hideHint.call($this)
			});
			$this.bind("blur", function() {
				if ($this.val() == "") 
					showHint.call($this);
			});

			showHint.call($this);
		});
	};
	$.fn.textboxHint.defaults = {
		hintClass: 'Hint'
	}
})(jQuery);


(function($) {
		
	$.fn.inlineEdit = function(options) {
		
		return this.each(function() {
			var $this = $(this);

			$this.bind("click", function() {
				var $txt = $('<input type="text"/>');
				$this
					.hide()
					.after($txt)
				$txt	
					.attr("name", $this.attr("id"))
					.val($this.text())
					.focus()
					.bind("blur", function() {
						$txt.hide();
						var span = $txt.prev();
						span.show().html($txt.val());
					});
			});
		});
		
	}
})(jQuery);
