
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// HOME

site.cast = {};

// ---> Config

site.cast.cfg = {};

site.cast.cfg.apiCfg = {}

// ---> Init

site.cast.setup = function() {
	
	console.log("site.cast.setup()");
	
	execute('setup', function(err) {
		if (!err) {
			chrome.cast.isAvailable = true;
			site.cast.init();
		} else {
			throw new Error('Unable to setup chrome.cast API' + err);
		}
	});
	
}

// ---> Error

site.cast.onerror = function(errorCode, errorDescription, errorData) {
	
	loggr.warn("CHROMECAST: Error: "+ errorCode +", "+ errorDescription);
	loggr.warn(" > "+ errorData);
	
}

// ---> Init

site.cast.init = function() {
	
	console.log("site.cast.init()");
	
	site.cast.cfg.apiCfg = {
		sessionRequest:{
			appId:"9B4DB672",
			capabilities:[chrome.cast.Capability.AUDIO_OUT],
			dialRequest:null
		},
		sessionListener:function(){ loggr.log("CHROMECAST: sessionListener()") },
		receiverListener:function(){ loggr.log("CHROMECAST: receiverListener()") },
		autoJoinPolicy: chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
		defaultActionPolicy: chrome.cast.DefaultActionPolicy.CREATE_SESSION
	};
	
	chrome.cast.initialize(site.cast.cfg.apiCfg,
		function() { loggr.log("CHROMECAST: init.success"); },
		site.cast.onerror
	);
	
}

// ---> sessionListener

site.cast.sessionListener = function(args) {
	
	loggr.log("site.cast.sessionListener()");
	
}

// ---> sessionListener

site.cast.receiverListener = function(arg) {
	
	loggr.log("site.cast.sessionListener()");
	
	switch(arg) {
		
		case chrome.cast.ReceiverAvailability.AVAILABLE:
			loggr.log(" > Available!");
			
			break;
		
		case chrome.cast.ReceiverAvailability.UNAVAILABLE:
			loggr.log(" > Unavailable");
			break;
			
		default:
			loggr.warn("Unknown arg: "+arg);
			break;
	
	}
	
		
	
}


















