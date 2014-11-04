
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// LIFECYCLE

site.lifecycle = {};

site.session.lifecycle = {};
site.session.lifecycle.section_history = [];

site.lifecycle.loaded = false;
site.lifecycle.deviceReady = false;

// Onload + device ready

site.lifecycle.onload = function() {
	loggr.info("site.lifecycle.onload()");
	site.lifecycle.loaded = true;
	if (site.lifecycle.loaded && site.lifecycle.deviceReady) {
		setTimeout(function(){site.lifecycle.init();},250);
	}
}

site.lifecycle.onDeviceReady = function() {
	loggr.info("site.lifecycle.onDeviceReady()");
	site.lifecycle.deviceReady = true;
	if (site.lifecycle.loaded && site.lifecycle.deviceReady) {
		setTimeout(function(){site.lifecycle.init();},250);
	}
}

// Init

site.lifecycle.init = function() {
	
	loggr.info("\n==================================================================================\n\n");
	loggr.info("site.lifecycle.init()");
	
	// Detect android/ios
	if( /Android/i.test(navigator.userAgent) ) {
		site.vars.isAndroid = true;
		site.vars.deviceDesc = "Android";
	} else if( /iPhone|iPad|iPod/i.test(navigator.userAgent) ) {
		site.vars.isIOS = true;
		site.vars.deviceDesc = "iOS";
	} else {
		site.vars.deviceDesc = "Other";
	}
	
	// Debug
	loggr.log(" > Device: "+ site.vars.deviceDesc);
	loggr.log(" > Screen: "+ $(window).width() +" x "+ $(window).height());
	
	// Device info
	loggr.log(" > Device Info: "
		+"model: "+ device.model
		+", platform: "+ device.platform
		+" "+ device.version
		+", cordova: "+ device.cordova
	);
	
	// Defaults..
	site.data.strings = jQuery.extend(true, {}, site.cfg.defaults.strings);
	
	// Vars..
	site.lifecycle.add_section_history("#home");
	
	// Attach more event listeners (cordova)
	document.addEventListener('resume', site.lifecycle.onResume, false);
	document.addEventListener('pause', site.lifecycle.onPause, false);
	document.addEventListener("backbutton", site.lifecycle.onBackButton, false);
	document.addEventListener("volumeupbutton", site.lifecycle.onVolumeUp, true);
	document.addEventListener("volumedownbutton", site.lifecycle.onVolumeDown, true);
	
	/**/// Google Loader
	google.load("search", "1", {"callback" : function(){loggr.log(" > Loaded: google.load(search,1)");} });
	
	// Init app
	site.lifecycle.initApp();
	
}

// InitApp

site.lifecycle.initApp = function(force) {
	
	loggr.info("site.lifecycle.initApp();");
		
	// some stuff
	site.vars.currentSection = "#splash";
	site.session.isPaused = false;
	
	// Firstlaunch...
	if (!site.cookies.get("app_is_installed") || site.cookies.get("app_version")!=site.cfg.app_version) {
		if (site.vars.currentSection!="#install") { 
			setTimeout(function() { site.installer.init(); },2500);
			return; // <- important stuff yes
		}
	}
	
	// Update...
	if (site.cookies.get("app_update_time") < new Date().getTime()) {
		site.installer.init(true);
		return; // <- important. forgot it yet again.
	}
	
	// Important things first.. do we have stations?!
	if (!site.data.stations) {
		loggr.log(" > Read stations first...");
		site.storage.readfile(site.cfg.paths.json,"stations.json",
			function(resultstr) {
				loggr.log(" > Got stations data, save and re-run initApp()");
				resultjson = JSON.parse(resultstr);
				site.data.stations = resultjson;
				site.lifecycle.initApp();
			},
			function(err) {
				loggr.error(" > Could not read stations.json? "+err);
			}
		);
		/*
		setTimeout(function() { // TODO: it's ugly but I need to check if this continues...
			if (!site.data.stations) {
				loggr.error("DAFAQUE why doesn't site.lifecycle.initApp > readstations not work?! RETRY BITCH!");
				site.lifecycle.initApp();
			}
		},5000);
		/**/
		return; // <- important stuff yes
	}
	
	// Restore user preferences
	site.data.userprefs = JSON.parse(site.cookies.get("userprefs"));
	if (!site.data.userprefs) {
		loggr.log(" > No userprefs found, copying defaults...");
		site.data.userprefs = jQuery.extend(true, {}, site.cfg.defaults.userprefs);
	}
	
	// Restore user session
	site.helpers.readSession();
	
	// UI Init
	site.ui.init();
	
	// Home.. or?
	var onstart_gotosection = site.cookies.get("onstart_gotosection");
	site.cookies.put("onstart_gotosection",0)
	switch(onstart_gotosection) {
		
		case "#channellist":
			setTimeout(function(){site.chlist.init();},500);
			break;
			
		default:
			setTimeout(function(){site.home.init(true);},500);
			break;
			
	}
	
	// Check intents, if no alarm check connection
	if (!site.lifecycle.onNewIntent()) {
		// Internet connection..
		if (!site.helpers.isConnected() && !force) {
			navigator.notification.confirm(
				"Icerrr needs a working internet connection.\n\nYour current connections status is: "+ site.helpers.getConnType() +"\n\nContinue anyway?",
				function(buttonIndex) {
					if (buttonIndex==1) { site.lifecycle.initApp(true); }
					else {
						site.lifecycle.exit();
					}
				},
				"Warning",
				"Continue,Exit"
			);
			return;
		}
	}
	
	// On update: re-set alarms
	if (site.cookies.get("app_has_updated")!=0) {
		site.vars.app_has_updated_home = true;
		loggr.log(" > App_has_updated: "+site.cookies.get("app_has_updated"));
		site.cookies.put("app_has_updated",0);
		site.alarms.setAlarms();
		site.helpers.uploadStations();
	}
	
	// Hacks..
	site.ui.hackActiveCssRule();
	
}

// New Intent

site.lifecycle.onNewIntent = function(result) {
	
	loggr.info("site.lifecycle.onNewIntent()");
	
	// We need session.alarms..
	if (!site.session.alarms) {
		// Retry once...
		if (result!="retry") {
			setTimeout(function(){site.lifecycle.onNewIntent("retry");},1000);
		}
		return;
	}
	
	// Check if alarm is scheduled that we know of..
	loggr.log(" > Check if alarm is scheduled...");
	var alarmOkay = false;
	var hour = new Date().getHours();
	var minute = new Date().getMinutes();
	var alarms = site.session.alarms;
	var thealarm;
	for (var i in alarms) {
		
		var alarm = alarms[i];
		if (!alarm || !alarm.hour) { continue; }
		
		var alarmHour = parseInt(alarm.hour);
		var alarmMinute = parseInt(alarm.minute);
		
		var minuteDiff = alarmMinute - minute;
		
		if (alarmHour == hour && minuteDiff >= -2 && minuteDiff < 1) {
			
			loggr.log(" > Found alarm: "+ alarmHour +":"+ alarmMinute);
			
			// Does it need to fire todat?
			var day = new Date().getDay(); // 0 - 6
			var repeatCfg = alarm.repeatCfg;
			loggr.log(" > Day: "+ day +", repeat: "+ repeatCfg[day]);
			if (repeatCfg[day]!=1 && alarm.repeat) {
				loggr.log(" >> Don't repeat today..");
				continue;
			}
			
			alarmOkay = true;
			thealarm = alarm;
			break;
			
		}
		
	}
	
	if (!alarmOkay) { 
		loggr.log(" > Alarm is not scheduled? "+ alarmHour +":"+ alarmMinute);
		return;
	}
	
	
	// Check if alarm has already fired
	if (site.vars.thealarm) {
		
		loggr.log(" > An alarm has fired before: "+ site.vars.thealarm.alarm_id +", "+ site.vars.thealarm.hour+":"+ site.vars.thealarm.minute);
		
		if (site.vars.thealarm.alarm_id == thealarm.alarm_id) {
			
			loggr.log(" > Has the same id as the alarm firing right now...");
			
			var timenow = new Date().getTime();
			var thealarmtime = site.vars.thealarm.time;
			
			if (timenow-thealarmtime < (1000*60*3)) { // if the same alarm has fired within the last 3 minutes: something is wrong!
				loggr.warn(" > Alarm has already fired less than 3 minutes ago");
				return;
			}
			
		}
		
	}
	
	site.vars.thealarm = thealarm;
	site.vars.thealarm.time = new Date().getTime();
	
	/*
	if (site.vars.alarmHasFired) {
		loggr.warn(" > Alarm has already fired?");
		return;
	}
	/**/
	
	// Intents(!)
	// Check for share intent (webintent plugin)
	window.plugins.webintent.getExtra("station_id",
		function (station_id) {
			loggr.log(" > Extra: station_id: "+station_id);
			var tmpobj = {station_id:station_id};
			site.cast.destroy(); // make sure we're not firing an alarm over chromecast api
			site.chlist.selectstation(tmpobj,true); // select station
			site.home.init(); // refresh home
			site.session.alarmActive = true; // set alarm active
			site.session.alarmVolume = thealarm.volume;
			site.mp.play(); // and play
		}, function(err) {
			loggr.error(" > isAlarm but !station_id? "+err);
			site.vars.thealarm = null;
		}
	);
	
	// An alarm has been scheduled..
	return true;
	
}

// Resume

site.lifecycle.onResume = function() {
	
	loggr.info("site.lifecycle.onResume()");
		
	// some stuff
	site.session.isPaused = false;
	
	// set timeout now so we have little delay for async shit to rain down upon us
	if (site.timeouts.storage_queue) { clearTimeout(site.timeouts.storage_queue); }
	site.timeouts.storage_queue = setTimeout(function(){
		site.storage.runqueue();
	},1000); // TODO: determine update freq
	
	// Re-init ui updates.. || TODO: we really need a better way to do this..	
	// Call UI close function
	if (!site.session.ui_resume_callbacks) { site.session.ui_resume_callbacks = []; }
	for (var i=0; i<site.session.ui_resume_callbacks.length; i++) {
		var func = site.session.ui_resume_callbacks[i]; // same order as incoming..
		try { func(); } catch(e) { loggr.warn(" > Error on ui_resume_callbacks"); loggr.log(e); }
	}
	
}

// Pause

site.lifecycle.onPause = function() {
	
	loggr.info("site.lifecycle.onPause()");
	
	// Store some stuff
	site.helpers.storeSession();
	
	// Write stations
	if (site.data.stations) {
		site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),
			function() {
				loggr.log("site.lifecycle.onPause > write local site.data.stations OK");
			},
			function(err) {
				loggr.log("site.lifecycle.onPause > write local site.data.stations Error");
			}
		);
	}
	
	// Cancel timeouts
	for (var i in site.timeouts) { if (site.timeouts[i]) { clearTimeout(site.timeouts[i]); } }
	for (var i in site.loops) { if (site.loops[i]) { clearInterval(site.loops[i]); } }
	
	// Call UI close function
	if (!site.session.ui_pause_callbacks) { site.session.ui_pause_callbacks = []; }
	for (var i=0; i<site.session.ui_pause_callbacks.length; i++) {
		var func = site.session.ui_pause_callbacks[i]; // same order as incoming..
		try { func(); } catch(e) { }
	}
		
	// some stuff
	site.session.isPaused = true;
	
}

// Destroy
// - Note: simulated

site.lifecycle.onDestroy = function() {
	
	loggr.info("site.lifecycle.onDestroy()");
	
	// Call pause..
	site.lifecycle.onPause();
	
	// Release some stuff
	// site.mp.destroy();
	
}

// Back button (android)

site.lifecycle.onBackButton = function() {
	
	loggr.info("site.lifecycle.onBackButton()");
	
	// List of selectors that when display==block, then ignore back!
	var thedonts = {
		"section#install" 			: ($("section#install").css("display")=="block"),
		""							: false // stop it
	}
	
	// TODO: needs some building in so we don't hit back in the middle of an operation..
	if (thedonts[site.vars.currentSection]) { loggr.log(" > Ignore '<' button, we're working here..."); return; }
	if (site.vars.isLoading) { loggr.log(" > Ignore '<' button, we're working here..."); return; }
	
	var currentBackKey = site.lifecycle.get_section_history_item();
	loggr.log(currentBackKey);
	
	// Okay, that out of the way...
	switch(currentBackKey) {
		
		case "":
		case "#exit":
		case "#home":
			site.lifecycle.exit();
			break;
		
		case "#channellist":
			site.home.init();
			break;
		
		case "#searchstation":
			if (site.vars.isLoading) { 
				site.webapi.abort(site.chsearch.searchAjaxRequestId);
				site.chsearch.init();
			}
			else { site.chlist.init(); }
			break;
		
		case "#searchstation_results":
			site.chsearch.init();
			break;
			
		case "#searchicon": // TODO: Check this
			var lastsection = site.lifecycle.get_section_history_item(true);
			if (lastsection=="#editstation") {
				site.chedit.init(site.chicon.station.station_id);
			} else {
				site.ui.showtoast("Please choose an icon");
			}
			break;
		
		case "#editstation":
			site.chlist.init();
			break;
			
		case "#alarms":
			site.home.init();
			break;
			
		case "#alarms_add":
			site.alarms.init();
			break;
			
		case "#about":
			site.home.init();
			break;
			
		case "#viewlog":
			site.home.init();
			break;
			
		case "#settings":
			site.home.init();
			break;
			
		default:
			loggr.log(" > '<' button on unhandled section: "+ currentBackKey);
			break;
		
	}
	
}

// ---> Events

// Resize 
// TODO: this should go in site.ui?

site.lifecycle.onResize = function() {
	
	loggr.info("site.lifecycle.onResize()");
	
	// TODO: figure out if orientation change..
	
	setTimeout(function(){
		$(site.vars.currentSection+" .main").css("height",
			$(window).height() - ($(site.vars.currentSection+" .actionbar").height() + $(site.vars.currentSection+" .tabbar").height()) // $(site.vars.currentSection+" .footer").height()
		);
		site.helpers.masonryOnResize();
		loggr.log("Resized: "+site.vars.currentSection);
		loggr.log(" > Window height: "+ $(window).height());
		loggr.log(" > .main height:  "+ $(site.vars.currentSection+" .main").css("height"));
		try { loggr.log(" > .main inner:   "+ $(site.vars.currentSection+" .main")[0].scrollHeight); } catch(e) { }
	},100);
	
	site.ui.hackActiveCssRule();
	
}

site.lifecycle.onVolumeUp = function() {
	if (site.cast.media && site.cast.session) {
		site.cast.onVolumeUp();
	} else if (site.mp.serviceRunning) {
		window.mediaStreamer.incrVolume(null,null);
	}
}

site.lifecycle.onVolumeDown = function() {
	if (site.cast.media && site.cast.session) {
		site.cast.onVolumeDown();
	} else if (site.mp.serviceRunning) {
		window.mediaStreamer.decrVolume(null,null);
	}
}

// ---> ACTIONS

// Exit, ..

site.lifecycle.exit = function() {
	loggr.info("site.lifecycle.exit()");
	site.lifecycle.onDestroy();
	navigator.app.exitApp();
}

// ---> Others

// OnResume / OnPause

site.lifecycle.addOnResumeCb = function(cb) {
	if (!site.session.ui_resume_callbacks) { site.session.ui_resume_callbacks = []; }
	if (site.session.ui_resume_callbacks.indexOf(cb)<0) {
		site.session.ui_resume_callbacks.push(cb);
	}
}

site.lifecycle.addOnPauseCb = function(cb) {
	if (!site.session.ui_pause_callbacks) { site.session.ui_pause_callbacks = []; }
	if (site.session.ui_pause_callbacks.indexOf(cb)<0) {
		site.session.ui_pause_callbacks.push(cb);
	}
}

// Section history

site.lifecycle.add_section_history = function(selector) {
	loggr.debug("site.lifecycle.add_section_history()");
	if (!site.session.lifecycle) { site.session.lifecycle = {}; }
	if (!site.session.lifecycle.section_history) { site.session.lifecycle.section_history = []; }
	if (site.session.lifecycle.section_history[site.session.lifecycle.section_history.length-1] == selector) { return; }
	site.session.lifecycle.section_history.push(selector);
	loggr.log(" > "+ JSON.stringify(site.session.lifecycle.section_history));
}

site.lifecycle.clear_section_history = function() {
	loggr.debug("site.lifecycle.clear_section_history()");
	if (!site.session.lifecycle) { site.session.lifecycle = {}; }
	site.session.lifecycle.section_history = [];
}

site.lifecycle.remove_section_history_item = function(selector) {
	loggr.debug("site.lifecycle.remove_last_section_history_item()");
	if (!site.session.lifecycle) { site.session.lifecycle = {}; }
	if (!site.session.lifecycle.section_history) { site.session.lifecycle.section_history = []; }
	if (site.session.lifecycle.section_history[site.session.lifecycle.section_history.length-1] == selector) { 
		return site.session.lifecycle.section_history.pop();
	}
}

site.lifecycle.get_section_history_item = function(dontPop) {
	loggr.debug("site.lifecycle.get_section_history_item()");
	if (!site.session.lifecycle) { site.session.lifecycle = {}; }
	if (!site.session.lifecycle.section_history) { return false; }
	loggr.log(" > "+ JSON.stringify(site.session.lifecycle.section_history));
	loggr.log(" > "+ JSON.stringify(site.session.lifecycle.section_history));
	if (dontPop) { return site.session.lifecycle.section_history[site.session.lifecycle.section_history.length-1]; }
	return site.session.lifecycle.section_history.pop();
}















