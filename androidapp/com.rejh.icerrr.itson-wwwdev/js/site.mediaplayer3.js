
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// MEDIAPLAYER

site.mp = {};

// --- Variables

site.mp.mpstatus = -1;
site.mp.lastmpstatus = -1;

// --- INIT

site.mp.init = function() {
	
	loggr.debug("site.mp.init()");
	
	// Check if a station is selected
	if (!site.session.currentstation){
		loggr.log("INFO: cannot init mediaplayer when !site.session.currentstation");
		return;
	}
	
	loggr.log(" > "+site.session.currentstation.station_url);
	
	// Media None, reset
	site.mp.lastmpstatus = -1;
	site.mp.mpstatus = Media.MEDIA_NONE;
	
	// Check service
	window.mediaStreamer.isServiceRunning(
		function(resInt) {
			if (resInt==1) {
				loggr.log(" > Service is running, resume..");
				site.mp.setPlaying();
			}
		},
		function(errmsg) {
			loggr.error("window.mediaStreamer.isServiceRunning().Error",{dontupload:true});
			loggr.error(errmsg);
		}
	);
	
	// Init + Close callback for #home
	// Best for last :)
	site.lifecycle.addOnPauseCb(site.mp.stopStatusPoll);
	site.lifecycle.addOnResumeCb(site.mp.initStatusPoll); 
	
	// Poll status at least once
	site.mp.stopStatusPoll();
	
}

// ---> Play/stop

// ---> Play, stop, toggle

site.mp.playToggle = function() {
	
	loggr.debug("site.mp.playToggle()");
	
	// Check if we're casting..
	if (site.cast.session) {
		loggr.log(" > Casting in progress, don't mp.playToggle");
		return;
		// TODO: We might want to play/stop the cast
	}
	
	window.mediaStreamer.isServiceRunning(
		function(resInt) {
			if (resInt==1) {
				if (site.mp.mpstatus==Media.MEDIA_PAUSED) {
					loggr.log(" > Service is paused, play!");
					site.mp.play();
				} else {
					loggr.log(" > Service running, stop");
					site.mp.stop();
				}
			} else {
				loggr.log(" > Service not running, play");
				site.mp.play();
			}
		}
	);
	
}

site.mp.play = function(cb,cberr) {
	
	loggr.debug("site.mp.play()");
	
	site.mp.mpstatus = Media.MEDIA_STARTING;
	
	// Check if wifi && station_url_highquality, else use default
	var station_url = site.session.currentstation.station_url;
	if (site.helpers.isConnectedWifi(true)) {
		loggr.warn(" > High quality: "+ site.session.currentstation.station_url_highquality);
		if (site.session.currentstation.station_url_highquality) {
			loggr.warn(" > Wifi or ethernet && high quality stream available :D");
			station_url = site.session.currentstation.station_url_highquality;
		}
	}
	
	// Send starred stations 
	window.mediaStreamer.storeStarredStations(site.session.starred,site.session.currentstation,
		function(res) {
			
			loggr.log(" > Starred stations sent to MediaStreamer: "+res);
			
			// Save session
			site.helpers.storeSession();
	
			// Start MediaStreamer
			window.mediaStreamer.play(station_url, site.session.alarmActive, -1, site.session.currentstation,
				function(msg) {
					loggr.log(" > mediaStreamer.play()."+msg);
					site.mp.setPlaying();
					if (cb) { cb(); }
				},
				function(errmsg) {
					loggr.error("window.mediaStreamer.play()");
					loggr.error(errmsg);
					site.ui.showtoast("Error: "+errmsg);
					site.mp.setStopped();
					if (cberr) { cberr(); }
				}
			);
		
		},
		function(err) {
			loggr.error(" > Error sending starred stations to MediaStreamer",{dontupload:true});
			loggr.error(err);
		}
	);
	
}

site.mp.stop = function(cb,cberr) {
	
	loggr.debug("site.mp.stop()");
	
	window.mediaStreamer.stop(
		function(msg) {
			loggr.log(" > mediaStreamer.stop()."+msg);
			site.mp.setStopped();
			if (cb) { cb(); }
		},
		function(errmsg) {
			loggr.error("window.mediaStreamer.stop().Error");
			loggr.error(errmsg);
			site.ui.showtoast("Error: "+errmsg);
			if (cberr) { cberr(); }
		}
	);
	
	site.session.alarmActive = false;
	site.mp.mpstatus = Media.MEDIA_NONE;
	
	// Remove snooze alarm if any
	// site.home.alarmSnoozeCancel(true); // TODO: DEPRECATED
	
}

// ---> Set Playing, stopped

site.mp.setPlaying = function() {
	loggr.debug("site.mp.setPlaying()");
	site.mp.isPlaying = true;
	site.mp.serviceRunning = true;
	if (site.loops.mpGetStatus) { clearInterval(site.loops.mpGetStatus); }
	site.mp.initStatusPoll();
	if (!site.mp.notifActive) { site.mp.notif(); }
}

site.mp.setStopped = function() {
	loggr.debug("site.mp.setStopped()");
	site.mp.isPlaying = false;
	site.mp.serviceRunning = false;
	site.mp.stopStatusPoll();
	site.mp.notifCancel();
	site.mp.getStatus(); // just once.
	//site.session.alarmActive = false;
	//site.helpers.storeSession();
}

// ---> Status Polls

// Init, stop

site.mp.initStatusPoll = function() {
	loggr.debug("site.mp.initStatusPoll()");
	site.mp.stopStatusPoll();
	// site.mp.lastmpstatus = -1;
	site.mp.getStatus(site.mp.handleStatus);
	if (site.loops.mpGetStatus) { clearInterval(site.loops.mpGetStatus); }
	site.loops.mpGetStatus = setInterval(function(){
		site.mp.getStatus(site.mp.handleStatus);
	},1000);
	loggr.log(" > inited status poll");
}

site.mp.stopStatusPoll = function(force) {
	loggr.debug("site.mp.stopStatusPoll()"); 
	/*
	if (site.loops.mpGetStatus) { clearInterval(site.loops.mpGetStatus); }
	site.loops.mpGetStatus = setInterval(function(){
		site.mp.getStatus(site.mp.handleStatus); // actually, don't stop but do it on a much slower cycle!
	},2000);
	/**/
}

// Get status
 
site.mp.getStatus = function(cb) {
	
	//loggr.error("site.mp.getStatus()",{dontupload:true});
	
	if (cb) { site.mp.getStatusCb = cb; }
	else { site.mp.getStatusCb = site.mp.handleStatus; }
	
	window.mediaStreamer.getStatus(
		function(msg) {
			var msgInt = parseInt(msg);
			if (site.mp.getStatusCb) { site.mp.getStatusCb(msgInt); }
		},
		function(errmsg) {
		loggr.error("window.mediaStreamer.getStatus()");
			loggr.error(errmsg);
		}
	);
	
}

// Handle status

site.mp.handleStatus = function(statusCode) {
	
	// Only run when statusCode has changed
	if (statusCode != site.mp.lastmpstatus) {
		loggr.log(" > MediaStreamer.getStatus: "+ site.mp.getStatusByCode(statusCode));
		site.mp.mpstatus = statusCode;
		site.mp.lastmpstatus = statusCode;
	} else {
		return;
	}
	
	// Handle changed status code
	if (statusCode==Media.MEDIA_NONE || statusCode==Media.MEDIA_STOPPED) { 
		site.mp.setStopped();
	} else {
		site.mp.setPlaying();
	}
	
	// ...
	site.home.run_ui_updates();
	
}

// ---> Notifications || Notif

// Notif

site.mp.notif = function() {
	
	loggr.debug("site.mp.notif()");
	
	site.mp.notifActive = true;
	
}

// Cancel

site.mp.notifCancel = function(id) {
	
	loggr.debug("site.mp.notifCancel(): "+id);
	
	site.mp.notifActive = false;
	
	return;
	
}

// ---> Helpers

site.mp.getErrorByCode = function(error) {
	
	if (!error.code) {
		error = {code:error};
	}
	
	switch(error.code) {
		case MediaError.MEDIA_ERR_ABORTED: return "MediaError.MEDIA_ERR_ABORTED, "+error.message;
		case MediaError.MEDIA_ERR_NETWORK: return "MediaError.MEDIA_ERR_NETWORK, "+error.message;
		case MediaError.MEDIA_ERR_DECODE: return "MediaError.MEDIA_ERR_DECODE, "+error.message;
		case MediaError.MEDIA_ERR_NONE_SUPPORTED: return "MediaError.MEDIA_ERR_NONE_SUPPORTED, "+error.message;
		default: return "UNKNOWN, "+error.message;
	}
	
	site.mp.stop();
	
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


































