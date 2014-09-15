
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
			if (resInt==1 || site.session.alarmActive) {
				loggr.log(" > Service is running, resume..");
				//site.mp.play();
				site.mp.serviceRunning = true;
				site.mp.isPlaying = true;
				site.session.mpIsPlaying = true;
				site.mp.initStatusPoll();
				site.mp.notif();
			}
			/*
			TODO: Check if I need this..
			else if (site.session.mpIsPlaying) {
				loggr.warn(" > Service not running but site.session.mpIsPlaying is true..?");
				// site.mp.destroy();
			} else {
				loggr.log(" > Service not running but I don't think we need to do anything about it");
				//site.mp.destroy();
			}
			/**/
		},
		function(errmsg) {
			loggr.error("window.mediaStreamer.isServiceRunning()");
			loggr.error(errmsg);
		}
	);
	
	// Init + Close callback for #home
	// Best for last :)
	if (!site.session.ui_pause_callbacks) { site.session.ui_resume_callbacks = []; }
	if (!site.session.ui_resume_callbacks) { site.session.ui_resume_callbacks = []; }
	if (site.session.ui_pause_callbacks.indexOf(site.mp.stopStatusPoll)<0) {
		site.session.ui_pause_callbacks.push(site.mp.stopStatusPoll); 
	}
	if (site.session.ui_resume_callbacks.indexOf(site.mp.initStatusPoll)<0) { 
		site.session.ui_resume_callbacks.push(site.mp.initStatusPoll); 
	}
	
	site.mp.initStatusPoll();
	
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
	
	loggr.log("site.mp.stop()");
	
	window.mediaStreamer.stop(
		function(msg) {
			loggr.log(" > mediaStreamer.stop()."+msg);
			site.mp.serviceRunning = false;
			site.mp.isPlaying = false;
			site.session.mpIsPlaying = false;
			site.mp.getStatus(site.mp.handleStatus); // just once..
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
	site.mp.mpstatus = 4;
	
}

site.mp.initStatusPoll = function() {
	loggr.info("site.mp.initStatusPoll()");
	site.mp.stopStatusPoll();
	site.loops.mpGetStatus = setInterval(function(){
		site.mp.getStatus(site.mp.handleStatus);
	},2500);
	loggr.log(" > inited status poll");
}

site.mp.stopStatusPoll = function() {
	loggr.info("site.mp.stopStatusPoll()");
	if (site.loops.mpGetStatus) { clearInterval(site.loops.mpGetStatus); }
}
 
site.mp.getStatus = function(cb) {
	
	/*
	loggr.log(Media.MEDIA_NONE); // ?
	loggr.log(Media.MEDIA_STARTING); // 1
	loggr.log(Media.MEDIA_RUNNING); // 2
	loggr.log(Media.MEDIA_PAUSED); // 3
	loggr.log(Media.MEDIA_STOPPED); // 4
	/**/
	
	if (cb) { site.mp.getStatusCb = cb; }
	else { site.mp.getStatusCb = null; }
	
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

site.mp.handleStatus = function(statusCode) {
	if (statusCode != site.mp.lastmpstatus) {
		loggr.log(" > MediaStreamer.getStatus: "+ site.mp.getStatusByCode(statusCode));
		site.mp.mpstatus = statusCode;
		site.mp.lastmpstatus = statusCode;
	}
	if (statusCode==Media.MEDIA_NONE || statusCode==Media.MEDIA_STOPPED) { 
		site.mp.isPlaying = false;
		site.mp.notifCancel(-1);
		site.mp.stopStatusPoll(); 
	} else {
		site.mp.isPlaying = true;
	}
}

site.mp.playToggle = function() {
	
	loggr.log("site.mp.playToggle()");
	
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
	/**/
	
	
	
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

site.mp.notifCancel = function(id) {
	
	loggr.info("site.mp.notif(): "+id);
	
	if (!id || id<0) { 
		window.notifMgr.cancelAll(function(res){},function(errmsg) {
			loggr.warn(" > Could not cancel notification: "+ errmsg);
		});
	} else {
		var opts = {id:id};
		window.notifMgr.cancel(function(res){},function(errmsg) {
			loggr.warn(" > Could not cancel notification: "+ errmsg);
		},opts);
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












