
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// MEDIAPLAYER

site.mp = {};

site.mp.lastmpstatus = -1;

// ---> Lifecycle

// Init

site.mp.init = function() {
	
	loggr.info("site.mp.init()");
	
	// Check if a station is selected
	if (!site.session.currentstation){
		loggr.log("ERROR: cannot init mediaplayer when !site.session.currentstation");
		return;
	}
	
	loggr.log(" > "+site.session.currentstation.station_url);
	
	// Media None
	site.mp.mpstatus = Media.MEDIA_NONE;
	
	// Check service
	window.mediaStreamer.isServiceRunning(
		function(resInt) {
			if (resInt==1) {
				loggr.log(" > Service is running, resume..");
				site.mp.serviceRunning = true;
				site.mp.isPlaying = true;
				site.session.mpIsPlaying = true;
				site.mp.initStatusPoll();
				site.mp.notif();
			}
		},
		function(errmsg) {
			loggr.error("window.mediaStreamer.isServiceRunning()");
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

// Destroy

site.mp.destroy = function() {
	site.mp.stop();
	if (site.mp.mp) { 
		site.mp.mp.release(); 
	}
	site.mp.mpstatus = Media.MEDIA_NONE;
}

// ---> Play, stop, toggle

site.mp.playToggle = function() {
	
	loggr.info("site.mp.playToggle()");
	
	window.mediaStreamer.isServiceRunning(
		function(resInt) {
			if (resInt==1) {
				loggr.log(" > Service running, stop");
				site.mp.stop();
			} else {
				loggr.log(" > Service not running, play");
				site.mp.play();
			}
		}
	);
	
}

site.mp.play = function() {
	
	loggr.info("site.mp.play()");
	
	// Start MediaStreamer
	window.mediaStreamer.play(site.session.currentstation.station_url,
		function(msg) {
			loggr.log(" > mediaStreamer.play()."+msg);
			site.mp.serviceRunning = true;
			site.mp.isPlaying = true;
			site.session.mpIsPlaying = true;
			site.mp.initStatusPoll();
			site.mp.notif();
		},
		function(errmsg) {
			loggr.error("window.mediaStreamer.play()");
			loggr.error(errmsg);
			site.ui.showtoast("Error: "+errmsg);
			site.mp.serviceRunning = false;
			site.mp.isPlaying = false;
			site.mp.stopStatusPoll();
			site.mp.notifCancel(-1);
		}
	);
	
}

site.mp.stop = function() {
	
	loggr.info("site.mp.stop()");
	
	window.mediaStreamer.stop(
		function(msg) {
			loggr.log(" > mediaStreamer.stop()."+msg);
			site.mp.serviceRunning = false;
			site.mp.isPlaying = false;
			site.session.mpIsPlaying = false;
			site.mp.getStatus(); // just once..
			site.mp.notifCancel(-1);
		},
		function(errmsg) {
			loggr.error("window.mediaStreamer.stop()");
			loggr.error(errmsg);
			site.mp.stopStatusPoll();
			site.mp.notifCancel(-1);
		}
	);
	
	site.session.alarmActive = false;
	site.mp.mpstatus = Media.MEDIA_NONE;
	
}

// ---> Status Polls

// Init, stop

site.mp.initStatusPoll = function() {
	loggr.info("site.mp.initStatusPoll()");
	site.mp.stopStatusPoll();
	site.loops.mpGetStatus = setInterval(function(){
		site.mp.getStatus(site.mp.handleStatus);
	},2500);
	loggr.log(" > inited status poll");
}

site.mp.stopStatusPoll = function(force) {
	loggr.info("site.mp.stopStatusPoll()");
	// TODO: we DO want to stop poll when app is being paused...
	if (site.mp.mpstatus!=Media.MEDIA_NONE && !force) {
		loggr.warn(" > site.mp.mpstatus!=Media.MEDIA_NONE, value = "+site.mp.getStatusByCode(site.mp.mpstatus));
		return;
	}
	if (site.loops.mpGetStatus) { clearInterval(site.loops.mpGetStatus); }
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
	var doStoreSession = false;
	if (statusCode != site.mp.lastmpstatus) {
		loggr.log(" > MediaStreamer.getStatus: "+ site.mp.getStatusByCode(statusCode));
		site.mp.mpstatus = statusCode;
		site.mp.lastmpstatus = statusCode;
		site.home.run_ui_updates();
		doStoreSession = true;
	}
	if (statusCode==Media.MEDIA_NONE || statusCode==Media.MEDIA_STOPPED) { 
		site.mp.isPlaying = false;
		site.mp.notifCancel(-1);
		site.mp.stopStatusPoll(); 
		site.session.mpIsPlaying = false;
		site.home.run_ui_updates(); // TODO: is dit handig?
	} else {
		site.mp.isPlaying = true;
		site.session.mpIsPlaying = true;
		site.home.run_ui_updates();
	}
	if (doStoreSession) {
		site.helpers.storeSession();
	}
	if (site.session.isPaused) {
		site.mp.stopStatusPoll(true);
	}
}

// ---> Notifications || Notif

// Notif

site.mp.notif = function() {
	
	loggr.info("site.mp.notif()");
	
	var opts = {};
	
	// Required
	opts.id = 1;
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
	
	
}

// Cancel

site.mp.notifCancel = function(id) {
	
	loggr.info("site.mp.notif(): "+id);
	
	if (!id || id<0) { 
		loggr.log(" > Cancel all");
		window.notifMgr.cancelAll(function(res){},function(errmsg) {
			loggr.warn(" > Could not cancel notification: "+ errmsg);
		});
	} else {
		loggr.log(" > Cancel: "+id);
		var opts = {id:id};
		window.notifMgr.cancel(function(res){},function(errmsg) {
			loggr.warn(" > Could not cancel notification: "+ errmsg);
		},opts);
	}
	
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





















