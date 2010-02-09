jQuery.tooltipDefaults = {
	delay: 400,
	speed: 100,
	maxWidth: 250,
	className: 'ToolTip',
	yOffset: 2
};
jQuery.fn.tooltip = function(message, options){
	// private properties
	var self = this;
	var timeoutId = null;
	
	// private methods
	function killTimer(){ clearTimeout(timeoutId); }
	
	// public properties
	self.options = jQuery.extend({ }, jQuery.tooltipDefaults, options);
	self.tooltip = jQuery('<span></span>')
		.addClass(self.options.className)
		.css('position', 'absolute')
		.html(message)
		.hide();
	
	// public methods
	self.hideTooltip = function(){
		killTimer();
		
		timeoutId = setTimeout(function(){
			self.tooltip.fadeOut(self.options.speed);
		}, self.options.delay);
		
		return self;
	};
	self.showTooltip = function(target){	
		var _$target = jQuery(target);
		var _position = _$target.offset();
		
		_position.top += _$target.height() + self.options.yOffset;
		
		killTimer();
		self.tooltip.css(_position);
		
		if(self.tooltip.width() > self.options.maxWidth)
			self.tooltip.width(self.options.maxWidth);

		self.tooltip.fadeIn(self.options.speed);
		
		return self;
	};
	self.destroy = function(){
		self.tooltip.remove();
		self.unbind('.ToolTip');
		
		for(var property in self)
			delete self[property];

		return self;
	};
	
	return self.each(function(){
		jQuery(this)
			.bind('mouseover.ToolTip', function show(){ self.showTooltip(this); })
			.bind('mouseout.ToolTip', self.hideTooltip);
		self.tooltip
			.bind('focus.ToolTip', killTimer)
			.bind('blur.ToolTip', self.hideTooltip)
			.bind('mouseover.ToolTip', killTimer)
			.bind('mouseout.ToolTip', self.hideTooltip)
		jQuery(function(){
			self.tooltip.appendTo('body');
		});
	});
};

