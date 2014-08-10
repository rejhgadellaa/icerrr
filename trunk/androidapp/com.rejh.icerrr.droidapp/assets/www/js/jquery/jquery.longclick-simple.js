// Stackoverflow: http://stackoverflow.com/questions/2625210/long-press-in-javascript
(function($) {
    $.fn.longClick = function(callback, timeout) {
        var timer;
        timeout = timeout || 500;
        $(this).mousedown(function(ev) {
			for (key in ev.originalEvent) {
				console.log(key +" = "+ev.originalEvent[key]);
			}
            timer = setTimeout(function() { callback(ev.originalEvent.target); }, timeout);
            return false;
        });
        $(document).mouseup(function() {
            clearTimeout(timer);
            return false;
        });
    };

})(jQuery);