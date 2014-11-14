
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
	
	loggr.info("site.mp.init()");
	
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
	site.mp.initStatusPoll();
	
}

// ---> Play/stop

// ---> Play, stop, toggle

site.mp.playToggle = function() {
	
	loggr.info("site.mp.playToggle()");
	
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

site.mp.play = function() {
	
	loggr.debug("site.mp.play()");
	
	// Start MediaStreamer
	window.mediaStreamer.play(site.session.currentstation.station_url, site.session.alarmActive, site.session.alarmVolume, 
		function(msg) {
			loggr.log(" > mediaStreamer.play()."+msg);
			site.mp.setPlaying();
		},
		function(errmsg) {
			loggr.error("window.mediaStreamer.play()");
			loggr.error(errmsg);
			site.ui.showtoast("Error: "+errmsg);
			site.mp.setStopped();
		}
	);
	
}

site.mp.stop = function() {
	
	loggr.debug("site.mp.stop()");
	
	window.mediaStreamer.stop(
		function(msg) {
			loggr.log(" > mediaStreamer.stop()."+msg);
			site.mp.setStopped();
		},
		function(errmsg) {
			loggr.error("window.mediaStreamer.stop().Error");
			loggr.error(errmsg);
			site.ui.showtoast("Error: "+errmsg);
		}
	);
	
	site.session.alarmActive = false;
	site.session.alarmVolume = -1;
	site.mp.mpstatus = Media.MEDIA_NONE;
	
}

// ---> Set Playing, stopped

site.mp.setPlaying = function() {
	loggr.debug("site.mp.setPlaying()");
	site.mp.serviceRunning = true;
	if (!site.loops.mpGetStatus) { site.mp.initStatusPoll(); }
	if (!site.mp.notifActive) { site.mp.notif(); }
}

site.mp.setStopped = function() {
	loggr.debug("site.mp.setStopped()");
	site.mp.serviceRunning = false;
	site.mp.stopStatusPoll();
	site.mp.notifCancel();
	site.mp.getStatus(); // just once.
}

// ---> Status Polls

// Init, stop

site.mp.initStatusPoll = function() {
	loggr.info("site.mp.initStatusPoll()");
	site.mp.stopStatusPoll();
	site.mp.getStatus(site.mp.handleStatus);
	if (site.loops.mpGetStatus) { clearInterval(site.loops.mpGetStatus); }
	site.loops.mpGetStatus = setInterval(function(){
		site.mp.getStatus(site.mp.handleStatus);
	},1000);
	loggr.log(" > inited status poll");
}

site.mp.stopStatusPoll = function(force) {
	loggr.info("site.mp.stopStatusPoll()"); 
	if (site.loops.mpGetStatus) { clearInterval(site.loops.mpGetStatus); }
	site.loops.mpGetStatus = setInterval(function(){
		site.mp.getStatus(site.mp.handleStatus); // actually, don't stop but do it on a much slower cycle!
	},5000);
}

// Get status
 
site.mp.getStatus = function(cb) {
	
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
		site.mp.isPlaying = true;
	}
	
	// ...
	site.home.run_ui_updates();
	
}

// ---> Notifications || Notif

// Notif

site.mp.notif = function() {
	
	loggr.info("site.mp.notif()");
	
	var opts = {};
	
	// Required
	opts.id = site.cfg.notifs.notifID_mediaplayer;
	opts.title = "Icerrr: "+ site.session.currentstation.station_name;
	opts.message = (!site.session.currentstation.station_nowplaying) ? "Now playing: Unknown" : site.session.currentstation.station_nowplaying;
	opts.smallicon = "ic_stat_hardware_headphones";
	opts.intent = {
		type: "activity",
		package: "com.rejh.icerrr.droidapp",
		classname: "com.rejh.icerrr.droidapp.Icerrr"
	}
	
	// Optional
	// opts.largeicon = "ic_media_play";
	opts.priority = "HIGH";
	opts.ongoing = true;
	opts.alertOnce = true;
	
	// Actions
	opts.actions = [
		{
			icon: "ic_stat_av_stop",
			title: "Stop playback",
			intent: {
				type: "receiver",
				package: "com.rejh.icerrr.droidapp",
				classname: "com.rejh.cordova.mediastreamer.MediaStreamerReceiver",
				extras:[
					{type:"string", name:"cmd", value:"destroy"}
				]
			}
		},
		{
			icon: "ic_stat_av_pause",
			title: "Pause/Resume",
			intent: {
				type: "receiver",
				package: "com.rejh.icerrr.droidapp",
				classname: "com.rejh.cordova.mediastreamer.MediaStreamerReceiver",
				extras:[
					{type:"string", name:"cmd", value:"pause_resume"}
				]
			}
		}
	];
	
	// Exec
	window.notifMgr.make(
		function(res) {
			loggr.log(" > Notification: "+ res);
		},
		function(errmsg) {
			loggr.log(" > Error creating notification: "+errmsg);
		},
		opts
	);
	
	site.mp.notifActive = true;
	
}

// Cancel

site.mp.notifCancel = function(id) {
	
	loggr.info("site.mp.notifCancel(): "+id);
	
	if (!id && id!==0) { id = site.cfg.notifs.notifID_mediaplayer; }
	
	if (id<0) { 
		loggr.log(" > Cancel all");
		window.notifMgr.cancelAll(function(res){},function(errmsg) {
			loggr.error(" > Could not cancel notification: "+ errmsg);
		});
	} else {
		loggr.log(" > Cancel: "+id);
		var opts = {id:id};
		window.notifMgr.cancel(function(res){},function(errmsg) {
			loggr.error(" > Could not cancel notification: "+ errmsg);
		},opts);
	}
	
	site.mp.notifActive = false;
	
}

// ---> Helpers

site.mp.getErrorByCode = function(error) {
	
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


































