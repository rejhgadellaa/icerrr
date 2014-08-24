
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
	
	console.info("site.cast.setup()");
	
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
	loggr.warn(errorCode);
	loggr.warn(errorData);
	
}

// ---> Init

site.cast.init = function() {
	
	console.info("site.cast.init()");
	
	site.cast.cfg.apiCfg = {
		sessionRequest:{
			appId:"9B4DB672",
			capabilities:[chrome.cast.Capability.AUDIO_OUT],
			dialRequest:null
		},
		sessionListener:site.cast.sessionListener,
		receiverListener:site.cast.receiverListener,
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

// ---> receiverListener

site.cast.receiverListener = function(arg) {
	
	loggr.info("site.cast.receiverListener()");
	
	switch(arg) {
		
		case chrome.cast.ReceiverAvailability.AVAILABLE:
			loggr.log(" > Available!");
			// TMP || TODO: tmp code
			setTimeout(function() { site.cast.requestSession(); },500);
			break;
		
		case chrome.cast.ReceiverAvailability.UNAVAILABLE:
			loggr.log(" > Unavailable");
			break;
			
		default:
			loggr.warn("Unknown arg: "+arg);
			break;
	
	}
	
		
	
}

// ---> Stuff

site.cast.requestSession = function() {
	
	console.log("site.cast.requestSession()");
	
	chrome.cast.requestSession(
		function(session) {
			loggr.log(" > Session ok!");
			loggr.log(" >> "+ session.displayName);
			site.cast.session = session;
		},
		site.cast.onerror
	);
	
	
	
}

// ---> Stuff

site.cast.stuff = function() {
	
	console.log("site.cast.stuff()");
	
}


















