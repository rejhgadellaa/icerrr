
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// HOME

site.mp = {};

// ---> Init

site.mp.init = function() {
	
	console.log("site.mp.init();");
	
	if (!site.session.currentstation){
		console.log("ERROR: cannot init mediaplayer when !site.session.currentstation");
		return;
	}
	
	console.log(" > "+site.session.currentstation.station_url);
	
	// Destroy mp if exists
	site.mp.destroy();
	
	// Create mediaplayer..
	console.log(" > Create new mediaplayer..");
	site.mp.mp = new Media(
		site.session.currentstation.station_url,
		function() {
			console.log(" > MediaPlayer ready: "+ site.session.currentstation.station_url);
		}, 
		function(error) {
			console.log(" > Mediaplayer error: "+site.mp.getErrorByCode(error));
			site.ui.showtoast("MP: "+site.mp.getErrorByCode(error));
		},
		function(statuscode) {
			console.log(" > MediaPlayer status: "+ site.mp.getStatusByCode(statuscode));
			site.mp.mpstatus = statuscode;
			site.ui.showtoast("MP: "+site.mp.getStatusByCode(statuscode));
		}
	);
	
}

site.mp.destroy = function() {
	site.mp.stop();
	if (site.mp.mp) { 
		site.mp.mp.release(); 
	}
}

site.mp.play = function() {
	
	console.log("site.mp.play()");
	
	site.mp.init();
	site.mp.mp.play();
	site.mp.isPlaying = true;
	
}

site.mp.stop = function() {
	
	console.log("site.mp.stop()");
	
	if (site.mp.mp) {
		site.mp.mp.stop();
	}
	site.mp.isPlaying = false
	
}

site.mp.playToggle = function() {
	
	console.log("site.mp.playToggle()");
	
	if (site.mp.isPlaying) {
		site.mp.stop();
	} else {
		site.mp.play();
	}
	
}

site.mp.getErrorByCode = function(error) {
	
	switch(error.code) {
		case MediaError.MEDIA_ERR_ABORTED: return "MediaError.MEDIA_ERR_ABORTED, "+error.message;
		case MediaError.MEDIA_ERR_NETWORK: return "MediaError.MEDIA_ERR_NETWORK, "+error.message;
		case MediaError.MEDIA_ERR_DECODE: return "MediaError.MEDIA_ERR_DECODE, "+error.message;
		case MediaError.MEDIA_ERR_NONE_SUPPORTED: return "MediaError.MEDIA_ERR_NONE_SUPPORTED, "+error.message;
		default: return "UNKNOWN, "+error.message;
	}
	
}

site.mp.getStatusByCode = function(code) {
	
	switch(code) {
		case Media.MEDIA_NONE: return "Media.MEDIA_NONE";
		case Media.MEDIA_STARTING: return "Media.MEDIA_STARTING";
		case Media.MEDIA_RUNNING: return "Media.MEDIA_RUNNING";
		case Media.MEDIA_PAUSED: return "Media.MEDIA_PAUSED";
		case Media.MEDIA_STOPPED: return "Media.MEDIA_STOPPED";
		default: return "UNKNOWN";
	}
	
}












