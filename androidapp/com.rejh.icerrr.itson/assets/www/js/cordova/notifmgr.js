/*

	Manual:
	
	** MAKE **
	
	<pre>
	var opts = {};
	
	// REQUIRED
	opts.id = INTEGER // used to cancel it later
	opts.title = STRING
	opts.message = STRING
	opts.smallicon = STRING // (file:///storage/etc) // TODO: wildcard for cordova assets/www/ prefix
	
	// REQUIRED: INTENT
	// 
	opts.intent = {
		type: "STRING" // 'activity', 'receiver', 'service'
		package: "STRING", // ex 'com.rejh.icerrr.itson'
		classname: "STRING", // ex 'com.rejh.icerrr.itson.MainActivity'
		action: "STRING", // ex: com.rejh.icerrr.itson.actions.SERVICE
		extras: [ // optional
			{type:"string", name:"string", value:"string"},
			{type:"int", name:"string", value:0},
			{type:"float", name:"string", value:0.0},
			{type:"boolean", name:"string", value:true}
		]
	}
	
	// OPTIONAL
	opts.largeicon = STRING // (file:///storage/etc)
	opts.ticker = STRING // default opts.title
	opts.priority = STRING // default: 'DEFAULT', values MAX, HIGH, DEFAULT, LOW, MIN
	opts.autoCancel = BOOLEAN // default false
	opts.ongoing = BOOLEAN // default false
	opts.alertOnce = BOOLEAN // default false
	
	// OPTIONAL: IsLollipopMediaRemote // TODO
	opts.isLollipopMediaRemote = BOOLEAN // default false
	
	// OPTIONAL: Actions
	opts.actions = [
		{
			icon: STRING, // file:///storage/etc
			title: STRING,
			intent: OBJECT // see opts.intent
		}
	]
	
	// And run it
	window.notifMgr.make(cb,cberr,opts);
	</pre>
	
	** CANCEL **
	
	<pre>
	var opts = {};
	opts.id = INT
	window.notifMgr.cancel(cb,cberr,opts);
	</pre>
	
	** CANCEL ALL **
	
	<pre>
	window.notifMgr.cancelAll(cb,cberr);
	</pre>

*/

/*
* 
* by REJH Gadellaa
*  MIT license
*
*/

(function() {
		  
	console.log("Load plugin: NotifMgr");
		  
    /* This increases plugin compatibility */
    // var cordovaRef = window.PhoneGap || window.Cordova || window.cordova; // old to new fallbacks
	cordovaRef = window.cordova;

    /**
    * The Java to JavaScript Gateway 'magic' class 
    */
    function NotifMgr() { }

    /**
    * Make
    */
    NotifMgr.prototype.make = function(win, fail, opts) {
		console.log("NotifMgr.prototype.make()");
        cordova.exec(win, fail, "NotifMgr", "make", [opts]);
    };

    /**
    * Cancel
    */
    NotifMgr.prototype.cancel = function(win, fail, opts) {
		console.log("NotifMgr.prototype.cancel()");
        cordova.exec(win, fail, "NotifMgr", "cancel", [opts]);
    };

    /**
    * Cancel All
    */
    NotifMgr.prototype.cancelAll = function(win, fail) {
		console.log("NotifMgr.prototype.cancelAll()");
        cordova.exec(win, fail, "NotifMgr", "cancelAll", []);
    };
	
	/**
	* Register the plugin
	*/
	try {
		window.notifMgr = new NotifMgr();
	} catch(e) { console.error("NotifMgr could not be loaded"); console.error(e); }

})(); 