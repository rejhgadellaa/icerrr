
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

site.cast.routes = [];

// ---> Init

site.cast.setup = function() {

	loggr.debug("site.cast.setup()");

	// Setup
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

	console.warn(errorCode, errorDescription, errorData);

	var msg;
	if (errorCode.message) {
		msg = errorCode.message;
	} else if (errorDescription) {
		msg = errorDescription;
	}

	site.ui.showtoast("Cast error: "+ msg, 0, true);

	site.cast.destroy(true);

}

// ---> Init

site.cast.init = function() {

	loggr.debug("site.cast.init()");

	// Restore session data
	if (!site.cast.session) {
		site.cast.session = (site.cookies.get("cast_session")) ? JSON.parse(site.cookies.get("cast_session")) : null;
	}

	// Initialize
	site.cast.cfg.apiCfg = {
		sessionRequest:{
			appId:"B6089660",
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

site.cast.sessionListener = function(session) {

	loggr.debug("site.cast.sessionListener()");

	loggr.log(" > Session_id: "+ session.sessionId);

	// Check
	if (site.cast.session) {
		if (site.cast.session.sessionId != session.sessionId) {
			// stop session?
			site.cast.destroy();
		}
	}

	if (session.media.length != 0) {
		loggr.log('Found ' + session.media.length + ' sessions.');
		// TODO: reconnect :|||
	} else {
		site.cast.notifCancel(); // cancel any notifs
	}

	site.cast.session = session;
	site.cookies.put("cast_session",JSON.stringify(session));

}

// ---> receiverListener

site.cast.receiverListener = function(arg) {

	loggr.debug("site.cast.receiverListener()");

	switch(arg) {

		case chrome.cast.ReceiverAvailability.AVAILABLE:
			loggr.log(" > Available!");
			if (site.cast.session) {
				loggr.log(" > Session already running");
				site.cast.updateicon(2);
				if (typeof(site.cast.session.stop) != "function") {
					site.cast.destroy();
					if (!site.session.alarmActive) {
						navigator.notification.confirm(
							"An existing Chromecast session has been found. Would you like to reconnect?",
							function(buttonIndex) {
								if (buttonIndex==1) {
									setTimeout(function(){
										site.cast.requestSession();
									},1000);
								}
							},
							"Continue the cast?",
							"Yes,No"
						);
					}
				}
			} else {
				site.cast.updateicon(1);
			}
			break;

		case chrome.cast.ReceiverAvailability.UNAVAILABLE:
			loggr.log(" > Unavailable!");
			site.cast.updateicon(0);
			site.cast.notifCancel(); // cancel any notifs
			break;

		default:
			loggr.warn("Unknown arg: "+arg);
			site.cast.updateicon(0);
			site.cast.notifCancel(); // cancel any notifs
			break;

	}

}

// ---> Request session

site.cast.requestSession = function() {

	loggr.debug("site.cast.requestSession()");

	// chk
	if (site.cast.session) {
		loggr.log(" > Session already running, stopping...");
		site.ui.showtoast("Stopping Chromecast session...", 0, true);
		site.cast.destroy();
		site.cast.updateicon(1);
		return; // <- important :)
	}

	site.mp.stop();

	site.cast.session = "STARTING";

	loggr.log(" > Request session...");
	chrome.cast.requestSession(
		function(session) {
			loggr.log(" > Session ok!");
			loggr.log(" >> "+ session.displayName);
			site.cast.session = session;
			setTimeout(function() {
				site.cast.loadMedia();
			},500);
		},
		function(errorCode, errorDescription, errorData) {
			site.ui.hideloading();
			site.cast.onerror(errorCode, errorDescription, errorData);
		}
	);

}

// ---> Load Media

site.cast.loadMedia = function() {

	loggr.debug("site.cast.loadMedia()");

	site.ui.showloading(null,"Cast: Loading media...");

	// Get currentstation
	var station = site.session.currentstation;
	if (!station) { loggr.error(" > !site.session.currentstation"); }

	// Check session
	if (!site.cast.session) {
		site.cast.requestSession();
		return;
	}

	// Check media
	if (site.cast.media) {
		site.cast.media.removeUpdateListener(site.cast.mediaUpdateListener);
	}

	// https 'hack'
	var station_url_https = station.station_url // "https://dabble.me/cast/?video_link="+ encodeURIComponent(station.station_url);

	loggr.log(" > "+ station_url_https);
	loggr.log(" > "+ station.station_icon);

	// var mediaInfo = new chrome.cast.media.MediaInfo(station.station_id, "audio/mpeg");
	var mediaInfo = new chrome.cast.media.MediaInfo(station_url_https);
		mediaInfo.contentType = "audio/mpeg";
		mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
		mediaInfo.metadata.metadataType = chrome.cast.media.MetadataType.GENERIC;
		mediaInfo.metadata.title = station.station_name;
		mediaInfo.metadata.subtitle = $("#home .main .station_nowplaying").html();;
		mediaInfo.metadata.images = [{'url': station.station_icon}];
		mediaInfo.metadata.images.push({'url': 'https://www.dropbox.com/s/dkubszaqazpcqaj/bg_home_default.jpg?dl=1'});
	var request = new chrome.cast.media.LoadRequest(mediaInfo);
		request.autoplay = true;

	site.cast.mediaInfo = mediaInfo;

	console.log(" > Metadata Image: "+ mediaInfo.metadata.images[0].url);

	if (!site.cast.session.loadMedia) {
		loggr.error("site.cast.loadMedia called but site.cast.session.loadMedia is false?!");
		try {
			site.cast.destroy();
		} catch(e) {
			// ..
		}
		site.ui.hideloading();
		return;
	}
	site.cast.session.loadMedia(request,
		function(media) {

			site.ui.hideloading();
			site.cast.media = media;
			site.cast.media.addUpdateListener(site.cast.mediaUpdateListener);
			site.cast.updateicon(2);
			site.cast.play();
			site.cast.updateCurrentstation();

		},
		function(errorCode, errorDescription, errorData) {
			site.ui.hideloading();
			site.cast.onerror(errorCode, errorDescription, errorData);
		}
	);

}

// ---> Media Update Listener

site.cast.mediaUpdateListener = function(res) {
	loggr.debug("site.cast.mediaUpdateListener()");
}

// ---> Update currentstation

site.cast.updateCurrentstation = function() {

	loggr.debug("site.cast.updateCurrentstation()");

	if (!site.cast.session) { loggr.log(" > !site.cast.session, return"); return; }

	if (site.timeouts.updateCurrentstation) { clearTimeout(site.timeouts.updateCurrentstation); }

	site.cast.session.sendMessage("urn:x-cast:com.rejh.icerrr.chromecastapp",{"set_currentstation":site.session.currentstation},
		function(res){
			loggr.log(" > Message sent: "+ res);
		},
		function(err) {
			loggr.error(" > Message not sent: "+ err,{dontupload:true});
			//if (site.timeouts.updateCurrentstation) { clearTimeout(site.timeouts.updateCurrentstation); }
			//site.timeouts.updateCurrentstation = setTimeout(function(){site.cast.updateCurrentstation();},10000);
		}
	);

}

// ---> Update metadata

site.cast.updateMetadata = function() {

	loggr.debug("site.cast.updateMetadata()");

	if (!site.cast.session) { return; }

	// site.cast.session.sendMessage("urn:x-cast:com.google.cast.media.Image",site.session.currentstation.station_icon,alert,alert);

	/*
	mediaInfo.metadata = new chrome.cast.media.GenericMediaMetadata();
	mediaInfo.customData = null;
	mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED;
	mediaInfo.textTrackStyle = new chrome.cast.media.TextTrackStyle();
	mediaInfo.duration = null
	/**/

}

// ---> Media control

// Play

site.cast.play = function() {

	loggr.debug("site.cast.play()");

	// Stop mediaplayers
	if (site.mp.serviceRunning) {
		site.mp.stop();
	}

	site.cast.media.play(null,null,alert);

	site.cast.notif();

}

// Stop

site.cast.stop = function() {

	loggr.debug("site.cast.stop()");

	site.cast.destroy();

}

// ---> Volume up/down

site.cast.onVolumeUp = function() {
	loggr.debug("site.cast.onVolumeUp()");
	var level = site.cast.media.volume.level;
	level = (level+0.1>0.95) ? 1.0 : level+0.1;
	site.cast.setVolume(level,
		function() {
			site.ui.showtoast("Volume: "+ Math.round(level*100) +"%", 0, true);
		},
		function(err) {
			loggr.log(" > Volume UP FAILED");
			loggr.warn(err);
		}
	);
}

site.cast.onVolumeDown = function() {
	loggr.debug("site.cast.onVolumeDown()");
	var level = site.cast.media.volume.level;
	level = (level-0.1<0.05) ? 0.0 : level-0.1;
	site.cast.setVolume(level,
		function() {
			site.ui.showtoast("Volume: "+ Math.round(level*100) +"%", 0, true);
		},
		function(err) {
			loggr.log(" > Volume DOWN FAILED");
			loggr.warn(err);
			console.warn(err);
		}
	);
}

site.cast.setVolume = function(level,cb,cberr) {

	loggr.debug("site.cast.setVolume(): "+level);
	var volume = new chrome.cast.Volume(level);
	var volumeRequest = new chrome.cast.media.VolumeRequest(volume);
	site.cast.media.setVolume(volumeRequest,cb,cberr);

}

// ---> Destroy

site.cast.destroy = function(silent) {

	loggr.log("site.cast.destroy()");

	site.ui.hideloading();

	try {
		if (site.cast.media) {
			site.cast.media.stop();
			site.cast.media = null;
		}
	} catch(e) {
		loggr.warn(" > Exception stopping site.cast.media");
		console.warn(e);
		site.cast.media = null;
	}

	try {
		if (site.cast.session) {
			if (!silent) { site.ui.showtoast("Cast: Session.stop()", 0, true); }
			site.cast.updateicon(1);
			site.cast.session.stop();
			site.cast.session = null;
		}
	} catch(e) {
		loggr.warn(" > Exception stopping site.cast.session");
		console.warn(e);
		site.cast.session = null;
	}

	site.cast.notifCancel();

	site.cookies.put("cast_session",0);

	site.mp.mpstatus = Media.MEDIA_NONE;
	site.vars.lastMpStatus = -1;
	site.mp.lastmpstatus = -1;

	site.ui.hideloading();

}

// ---> Notifications

site.cast.notif = function() {

	loggr.debug("site.cast.notif()");

	var opts = {};

	// Required
	opts.id = 2;
	opts.title = "Icerrr: "+ site.session.currentstation.station_name;
	opts.message = "Casting to '"+ site.cast.session.receiver.friendlyName +"'";
	opts.smallicon = "ic_stat_hardware_cast_connected";
	opts.color = "#455A64";
	opts.intent = {
		type: "activity",
		package: "com.rejh.icerrr.itson",
		classname: "com.rejh.icerrr.itson.Icerrr"
	}

	// Optional
	// opts.largeicon = "ic_media_play";
	opts.priority = "HIGH";
	opts.ongoing = true;
	opts.alertOnce = true;

	// Actions..
	var action1 = {
		icon:"ic_stat_av_quit",
		title:"Stop casting",
		intent:{
			type:"activity",
			package:"com.rejh.icerrr.itson",
			classname:"com.rejh.icerrr.itson.Icerrr",
			extras:[
				{type:"string", name:"cmd", value:"cast_quit"}
			]
		}
	}
	opts.actions = [action1]; // TODO: should be able to auto-reconnect existing session before showing this option :S

	// Large icon?
	if (site.session.currentstation.station_icon_local) {
		opts.largeicon = site.session.currentstation.station_icon_local;
	}

	// Exec
	window.notifMgr.make(
		function(res) {
			loggr.log(" > Notification: "+ res);
		},
		function(errmsg) {
			loggr.error(" > Error creating notification: "+errmsg);
		},
		opts
	);

}

site.cast.notifCancel = function(id) {

	loggr.debug("site.cast.notifCancel()");

	if (!id && id!==0) { id = site.cfg.notifs.notifID_cast; }

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

}

// ---> Helpers

site.cast.updateicon = function(mode) {

	loggr.debug("site.cast.updateicon(): "+mode);

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

	loggr.log("site.cast.stuff()");

}
