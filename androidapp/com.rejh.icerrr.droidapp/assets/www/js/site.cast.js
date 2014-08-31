
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
	
	loggr.info("site.cast.setup()");
	
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
	
	loggr.info("site.cast.init()");
	
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
			// setTimeout(function() { site.cast.requestSession(); },500);
			if (site.cast.session) {
				loggr.log(" > Session already running");
				site.cast.updateicon(2);
			} else {
				site.cast.updateicon(1);
			}
			break;
		
		case chrome.cast.ReceiverAvailability.UNAVAILABLE:
			loggr.log(" > Unavailable!");
			site.cast.updateicon(0);
			break;
			
		default:
			loggr.warn("Unknown arg: "+arg);
			site.cast.updateicon(0);
			break;
	
	}
	
		
	
}

// ---> Stuff

site.cast.requestSession = function() {
	
	loggr.info("site.cast.requestSession()");
	
	// chk
	if (site.cast.session) {
		loggr.log(" > Session already running, stopping...");
		site.ui.showtoast("Stopping Chromecast session...");
		site.cast.session.stop();
		site.cast.updateicon(1);
		return; // <- important :)
	}
	
	chrome.cast.requestSession(
		function(session) {
			loggr.log(" > Session ok!");
			loggr.log(" >> "+ session.displayName);
			site.cast.session = session;
			site.cast.loadMedia();
		},
		site.cast.onerror
	);
	
	
	
}

// ---> Load Media

site.cast.loadMedia = function() {
	
	loggr.info("site.cast.loadMedia()");
	
	// Get currentstation
	var station = site.session.currentstation;
	if (!station) { loggr.error(" > !site.session.currentstation"); }
	
	var mediaInfo = new chrome.cast.media.MediaInfo(station.station_id, "audio/mpeg");
	// var mediaInfo = new chrome.cast.media.MediaInfo(station.station_url);
	var request = new chrome.cast.media.LoadRequest(mediaInfo);
	
	site.cast.mediaInfo = mediaInfo;
	
	site.cast.session.loadMedia(request,
		function(media) {
			site.cast.media = media;
			site.cast.play();
		},
		site.cast.onerror
	);
	
}

// ---> Media control

// Play

site.cast.play = function() {
	
	loggr.info("site.cast.play()");
	
	site.cast.media.play();
	
}

// Stop

site.cast.stop = function() {
	
	loggr.info("site.cast.play()");
	
	site.cast.media.stop();
	
}

// ---> Helpers

site.cast.updateicon = function(mode) {
	
	loggr.info("site.cast.updateicon(): "+mode);
	
	if (!mode) { mode = 0; } // unavailable
	
	switch (mode) {
		
		case 2: // on
			$(".cast_icon").attr("class","cast_icon cast_on");
			break;
		
		case 1: // off
			$(".cast_icon").attr("class","cast_icon cast_off");
			break;
		
		default: // unavail
			$(".cast_icon").attr("class","cast_icon cast_unavailable");
		
	}
	
	loggr.log(" > "+ $(".cast_icon").attr("class"));
	
	
}

// ---> Stuff

site.cast.stuff = function() {
	
	console.log("site.cast.stuff()");
	
}


















