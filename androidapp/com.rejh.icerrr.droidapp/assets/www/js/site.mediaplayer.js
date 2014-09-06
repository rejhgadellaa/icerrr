
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// HOME

site.mp = {};

site.mp.lastmpstatus = -1;

// ---> Init

site.mp.init = function() {
	
	loggr.log("site.mp.init();");
	
	if (!site.session.currentstation){
		loggr.log("ERROR: cannot init mediaplayer when !site.session.currentstation");
		return;
	}
	
	loggr.log(" > "+site.session.currentstation.station_url);
	
	// Check service
	window.mediaStreamer.isServiceRunning(
		function(resInt) {
			if (resInt==1) {
				loggr.log(" > Service is running, resume..");
				site.mp.play();
			} else {
				loggr.log(" > Service not running, destroy..");
				site.mp.destroy();
			}
		},
		function(errmsg) {
			loggr.error("window.mediaStreamer.isServiceRunning()");
			loggr.error(errmsg);
		}
	);
	
	// Init + Close callback for #home
	// Best for last :)
	if (!site.session.ui_resume_callbacks) { site.session.ui_resume_callbacks = []; }
	site.session.ui_resume_callbacks.push(site.mp.init);
	
}

site.mp.destroy = function() {
	site.mp.stop();
	if (site.mp.mp) { 
		site.mp.mp.release(); 
	}
	site.mp.mpstatus = 0;
}

site.mp.play = function() {
	
	loggr.log("site.mp.play()");
	
	// Start MediaStreamer
	window.mediaStreamer.play(site.session.currentstation.station_url,
		function(msg) {
			loggr.log(" > mediaStreamer.play()."+msg);
			site.mp.serviceRunning = true;
			site.mp.isPlaying = true;
			site.session.mpIsPlaying = true;
			site.mp.getStatus(site.mp.handleStatus);
		},
		function(errmsg) {
			loggr.error("window.mediaStreamer.play()");
			loggr.error(errmsg);
			site.ui.showtoast("Error: "+errmsg);
			site.mp.serviceRunning = false;
			site.mp.isPlaying = false;
		}
	);
	
}

site.mp.stop = function() {
	
	loggr.log("site.mp.stop()");
	
	window.mediaStreamer.stop(
		function(msg) {
			loggr.log(" > mediaStreamer.stop()."+msg);
			site.mp.serviceRunning = false;
			site.mp.isPlaying = false;
			site.session.mpIsPlaying = false;
			site.mp.getStatus(site.mp.handleStatus,true);
		},
		function(errmsg) {
			loggr.error("window.mediaStreamer.stop()");
			loggr.error(errmsg);
		}
	);
	
	/*
	if (site.mp.mp) {
		site.mp.mp.stop();
	}
	site.mp.isPlaying = false
	/**/
	
	site.mp.mpstatus = 4;
	
}

site.mp.getStatus = function(cb,cancel) {
	
	/*
	loggr.log(Media.MEDIA_NONE); // ?
	loggr.log(Media.MEDIA_STARTING); // 1
	loggr.log(Media.MEDIA_RUNNING); // 2
	loggr.log(Media.MEDIA_PAUSED); // 3
	loggr.log(Media.MEDIA_STOPPED); // 4
	/**/
	
	if (cb) { site.mp.getStatusCb = cb; }
	else { site.mp.getStatusCb = null; }
	
	if (site.timeouts.mpGetStatus) { clearTimeout(site.timeouts.mpGetStatus); }
	if (cancel) { return; }
	site.timeouts.mpGetStatus = setTimeout(function(){
		window.mediaStreamer.getStatus(
			function(msg) {
				var msgInt = parseInt(msg);
				if (site.mp.getStatusCb) { site.mp.getStatusCb(msgInt); }
				site.mp.getStatus(site.mp.getStatusCb);
			},
			function(errmsg) {
			loggr.error("window.mediaStreamer.getStatus()");
				loggr.error(errmsg);
			}
		);
	},1000);
	
}

site.mp.handleStatus = function(statusCode) {
	if (statusCode != site.mp.lastmpstatus) {
		loggr.log(" > MediaStreamer.getStatus: "+ site.mp.getStatusByCode(statusCode));
		site.mp.mpstatus = statusCode;
		site.mp.lastmpstatus = statusCode;
	}
}

site.mp.playToggle = function() {
	
	loggr.log("site.mp.playToggle()");
	
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
	
	site.mp.destroy();
	
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












