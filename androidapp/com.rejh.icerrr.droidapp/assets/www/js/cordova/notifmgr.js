/*

	Manual:
	
	* Prepare your notification
	
	<pre>
	var opts = {};
	
	// REQUIRED
	opts.id = INTEGER // used to cancel it later
	opts.title = STRING
	opts.message = STRING
	opts.smallicon = STRING // (file:///storage/etc) // TODO: wildcard for cordova assets/www/ prefix
	
	// REQUIRED: INTENT
	opts.intent = {
		package: "STRING", // ex 'com.rejh.icerrr.droidapps'
		classname: "STRING", // ex 'com.rejh.icerrr.droidapps.MainActivity'
		intentExtras: [ // optional
			{type:"string", name:"string", value:"string"},
			{type:"int", name:"string", value:0},
			{type:"float", name:"string", value:0.0},
			{type:"boolean", name:"string", value:true}
		]
	}
	
	// OPTIONAL
	opts.largeicon = STRING // (file:///storage/etc)
	opts.ticker = STRING // default opts.title
	opts.autoCancel = BOOLEAN // default true
	opts.ongoing = BOOLEAN // default false
	opts.alertOnce = BOOLEAN // default false
	
	
	// OPTIONAL: Actions
	opts.actions = [
		{
			icon: STRING, // file:///storage/etc
			title: STRING,
			intent: OBJECT // see opts.intent
		}
	]
	
	// And run it
	window.notifMgr.make(cb,cberr,[opts]);
	</pre>
		

*/