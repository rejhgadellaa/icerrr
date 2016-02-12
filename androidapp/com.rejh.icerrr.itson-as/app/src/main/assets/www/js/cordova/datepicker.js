/**
 * Phonegap DatePicker Plugin Copyright (c) Greg Allen 2011 MIT Licensed
 * Reused and ported to Android plugin by Daniel van 't Oever
 * https://github.com/VitaliiBlagodir/cordova-plugin-datepicker
 * Ported to Cordova 2.7.x by REJH Gadellaa
 */

(function() {
		  
	console.log("Load plugin: DatePicker");
		  
    /* This increases plugin compatibility */
    // var cordovaRef = window.PhoneGap || window.Cordova || window.cordova; // old to new fallbacks
	cordovaRef = window.cordova;

    /**
    * The Java to JavaScript Gateway 'magic' class 
    */
    function DatePicker() { }

	/**
	 * show - true to show the ad, false to hide the ad
	 */
	DatePicker.prototype.show = function(options, cb) {
	  
		if (options.date) {
			options.date = (options.date.getMonth() + 1) + "/" + 
						   (options.date.getDate()) + "/" + 
						   (options.date.getFullYear()) + "/" + 
						   (options.date.getHours()) + "/" + 
						   (options.date.getMinutes());
		}
	
		var defaults = {
			mode : 'date',
			date : '',
			minDate: 0,
			maxDate: 0
		};
	
		for (var key in defaults) {
			if (typeof options[key] !== "undefined") {
				defaults[key] = options[key];
			}
		}
	
		//this._callback = cb;
	
		var callback = function(message) {
			var timestamp = Date.parse(message);
			if(isNaN(timestamp) == false) {
				cb(new Date(message));
			}
		}
	  
		cordova.exec(callback, 
			null, 
			"DatePickerPlugin", 
			defaults.mode,
			[defaults]
		);
	};
	
	/**
	* Register the plugin
	*/
	try {
		window.datepicker = new DatePicker();
	} catch(e) { console.error("DatePicker could not be loaded"); console.error(e); }

})(); 