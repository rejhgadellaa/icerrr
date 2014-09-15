/*

	Manual:
	
	** SET **
	
	<pre>
	
	// -> window.alarmmgr.set(cb,cberr,opts);
	
	var opts = {};
	
	// Required
	opts.id = int // id, can later be used to modify or cancel an alarm
	opts.timeMillis = int // when the alarm should fire
	opts.repeat = STRING // optional; minutely, hourly, daily, [weekly, monthly, yearly,] custom
	opts.repeatDaily = [] // optional: list of days on which to actually fire the alarm; 0 = sunday, 6 = saturday, example: repeat only mondays: [0,1,0,0,0,0,0]
	opts.repeatMillis = int // optional, required when repeat is set to 'custom', millis between repeats
	opts.intent = {
		type: "STRING" // 'activity', 'receiver', 'service'
		package: "STRING", // ex 'com.rejh.icerrr.droidapp'
		classname: "STRING", // ex 'com.rejh.icerrr.droidapp.MainActivity' 	// either classname or action needs to be defined!
		action: "STRING", // ex: 'com.rejh.icerrr.droidapp.actions.SERVICE'
		extras: [ // optional
			{type:"string", name:"string", value:"string"},
			{type:"int", name:"string", value:0},
			{type:"float", name:"string", value:0.0},
			{type:"boolean", name:"string", value:true}
		]
	}
	
	// More opts // TODO: Implement
	opts.moreOpts = {
		startactivity: { flag_activity_clear_top:true, main_launcher:true }
	}
	
	window.alarmmgr.set(cb,cberr,opts)
	
	</pre>
	
	** SET ALL **
	window.alarmmgr.setAll(cb,cberr,{})
	
	** CANCEL **
	
	<pre>
	var opts = {};
	opts.id = int
	window.alarmmgr.cancel(cb,cberr,opts);
	</pre>
	
	** CANCEL ALL **
	
	<pre>
	window.alarmmgr.cancelAll(cb,cberr,{});
	</pre>
	
*/

/*
* 
* by REJH Gadellaa
*  MIT license
*
*/

(function() {
		  
	console.log("Load plugin: AlarmMgr");
		  
    /* This increases plugin compatibility */
    // var cordovaRef = window.PhoneGap || window.Cordova || window.cordova; // old to new fallbacks
	cordovaRef = window.cordova;

    /**
    * The Java to JavaScript Gateway 'magic' class 
    */
    function AlarmMgr() { }

    /**
    * Set
    */
    AlarmMgr.prototype.set = function(win, fail, opts) {
		console.log("AlarmMgr.prototype.set()");
        cordova.exec(win, fail, "AlarmMgr", "set", [opts]);
    };

    /**
    * Set All
    */
    AlarmMgr.prototype.setAll = function(win, fail, opts) {
		console.log("AlarmMgr.prototype.setAll()");
        cordova.exec(win, fail, "AlarmMgr", "setAll", [opts]);
    };

    /**
    * Cancel
    */
    AlarmMgr.prototype.cancel = function(win, fail, opts) {
		console.log("AlarmMgr.prototype.cancel()");
        cordova.exec(win, fail, "AlarmMgr", "cancel", [opts]);
    };

    /**
    * Cancel All
    */
    AlarmMgr.prototype.cancelAll = function(win, fail, opts) {
		console.log("AlarmMgr.prototype.cancelAll()");
        cordova.exec(win, fail, "AlarmMgr", "cancelAll", [opts]);
    };
	
	/**
	* Register the plugin
	*/
	try {
		window.alarmMgr = new AlarmMgr();
	} catch(e) { console.error("AlarmMgr could not be loaded"); console.error(e); }

})(); 





























