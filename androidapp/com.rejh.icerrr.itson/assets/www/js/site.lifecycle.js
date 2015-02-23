
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
	try {
		google.load("search", "1", {"callback" : function(){loggr.log(" > Loaded: google.load(search,1)");} });
	} catch(e) {
		loggr.warn(" > google.load() has failed");
	}
	
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
	if (!site.cookies.get("app_is_installed")) {
		if (site.vars.currentSection!="#install") { 
			setTimeout(function() { site.installer.init(); },2500);
			return; // <- important stuff yes
		}
	} else if (site.cookies.get("app_version")!=site.cfg.app_version) {
		if (site.vars.currentSection!="#install") { 
			setTimeout(function() { site.installer.init(true); },1250);
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
			site.home.init(true);
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
	
	// Album art.. the big question
	if (site.cookies.get("app_has_asked_about_albumart")!=1) {
		site.cookies.put("app_has_asked_about_albumart",1);
		var message = "Icerrr can search and show album art based on the 'now playing' information (if any) of a stream. Note, however, that the imagery that is shown may contain copyrighted material and that you, the user, have hereby agreed that Icerrr does this on your behalf and not to the benefit of the developer.\n\nShort version: The developer is not responsible for Icerrr showing copyrighted material when you enable this option.\n\nYou may change this later under Settings.";
		navigator.notification.confirm(message,
			function(buttonIndex){
				loggr.error(buttonIndex,{dontupload:true});
				if (buttonIndex==1) {
					site.cookies.put("setting_showAlbumArt",1);
				} else {
					site.cookies.put("setting_showAlbumArt",0);
				}
				if (site.session.currentstation_id) { site.home.getAlbumArt(); } 
			},
			"Show album art?",
			"Yes,No"
		);
	} 
	// Check for messages
	else {
		site.lifecycle.checkMsgs();
	}
	
	// On update: re-set alarms
	if (site.cookies.get("app_has_updated")!=0) {
		site.vars.app_has_updated_home = true;
		loggr.log(" > App_has_updated: "+site.cookies.get("app_has_updated"));
		site.cookies.put("app_has_updated",0);
		site.helpers.uploadStations();
	}
	
	// Re-set alarms
	site.alarms.setAlarms();
	
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
		if (minuteDiff>58) { minuteDiff = 1; }
		
		if (alarmHour == hour && minuteDiff >= -2 && minuteDiff < 1 || alarmHour == hour-1 && minuteDiff>58) {
			
			loggr.log(" > Found alarm: "+ alarmHour +":"+ alarmMinute);
			
			// Does it need to fire today?
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
	
	// Stop! Resize!
	site.lifecycle.onResize();
	
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
	
	// Call UI close function
	if (!site.session.ui_pause_callbacks) { site.session.ui_pause_callbacks = []; }
	for (var i=0; i<site.session.ui_pause_callbacks.length; i++) {
		var func = site.session.ui_pause_callbacks[i]; // same order as incoming..
		try { func(); } catch(e) { }
	}
	
	// Cancel timeouts
	loggr.log(" > "+ site.helpers.countObj(site.timeouts) +" timeout(s), "+ site.helpers.countObj(site.loops) +" loop(s)");
	for (var i in site.timeouts) { if (site.timeouts[i]) { loggr.log(" >> Cancel timeout "+ i); clearTimeout(site.timeouts[i]); } }
	for (var i in site.loops) { if (site.loops[i]) { loggr.log(" >> Cancel loop "+ i); clearInterval(site.loops[i]); } }
	site.timeouts = [];
	site.loops = [];
		
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
			if (site.home.overflowMenuIsVisible) {
				site.home.dismissOverflowMenu();
				site.lifecycle.add_section_history("#home");
			} else {
				site.lifecycle.exit();
			}
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
			site.lifecycle.add_section_history(currentBackKey);
			break;
		
	}
	
}

// ---> Events

// Resize 
// TODO: this should go in site.ui?

site.lifecycle.onResize = function() {
	
	loggr.info("site.lifecycle.onResize()");
	
	if (site.timeouts.onresize) { clearTimeout(site.timeouts.onresize); }
	site.timeouts.onresize = setTimeout(function(){
		$(site.vars.currentSection+" .main").css("height",
			$(window).height() - ($(site.vars.currentSection+" .actionbar").height() + $(site.vars.currentSection+" .tabbar").height()) // $(site.vars.currentSection+" .footer").height()
		);
	},50);
	
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

// ---> Messages

site.lifecycle.checkMsgs = function(startedByUser) {
	
	loggr.info("site.lifecycle.checkMsgs()");
	
	if (startedByUser) {
		
		// Check conntype
		var conntype = site.helpers.getConnType();
		if (conntype!="WIFI" && conntype!="ETHERNET") {
			alert("Please enable wifi and try again");
			return;
		}
		
		// Set flag..
		site.lifecycle.checkingForUpdates = true;
		
	}
	
	var action = "get";
	var queryobj = {
		"get":"messages"
	};
	
	site.webapi.exec(action, JSON.stringify(queryobj),
		function(res) {
			site.lifecycle.handleMsgs(res["data"]);
		},
		function(err) {
			// do nothing..
			loggr.error(" > lifecycle.checkMsgs().Error: "+ err.message);
		}
	);
	
}

site.lifecycle.handleMsgs = function(data) {
	
	loggr.info("site.lifecycle.handleMsgs()");
	
	// Get local data thingie
	var lidsStr = site.cookies.get("message_ids");
	loggr.log(" > Stored message ids: "+ lidsStr);
	if (!lidsStr) { lidsStr = "[]"; }
	var lids = JSON.parse(lidsStr);
	
	for (var i=0; i<data.length; i++) {
		
		var ditem = data[i];
		if (!ditem) { continue; }
		if (!ditem.crit) { continue; }
		
		loggr.log(" > "+ ditem.id);
		
		var critvalue;
		switch(ditem.crit) {
			case "version":
				critvalue = site.cookies.get("app_version");
				break;
			case "time":
				critvalue = new Date().getTime();
				break;
			case "install-update":
				critvalue = site.cookies.get("app_updated_at_time");
				break;
			case "remove_station":
				critvalue = 0;
				break;
			default:
				loggr.error(" > ditem.crit as invalid value: '"+ ditem.crit +"'");
				continue;
		}
		
		// Check install-update
		if (critvalue>ditem.critvalue || !ditem.repeat && lids.indexOf(ditem.id)>=0 && ditem.action!="install-update") {
			loggr.log(" >> Skip");
			continue;
		}
		
		// Check wifiOnly && conntype (msg will wait until wifi || ethernet)
		if (ditem.onlyOnWifi) {
			var conntype = site.helpers.getConnType();
			if (conntype!="WIFI" && conntype!="ETHERNET") {
				loggr.log(" >> no wifi! wait until we have it");
				break; // -> onlyOnWifi should be blocking other messages?
				// continue;
			}
		}
		
		// Check message
		if (!ditem.message && ditem.action!="install-update-app") { 
			loggr.log(" >> No message! next!");
			continue; 
		}
		
		// Build message
		var message = "";
		if (!ditem.message) { ditem.message = ""; }
		for (var i=0; i<ditem.message.length; i++) {
			message += ditem.message[i];
		}
		
		// Made it so far, show message
		if (ditem.action=="url" && !ditem.url) { loggr.error(" > ditem.action = url but ditem.url is false"); ditem.action = "none"; }
		switch(ditem.action) {
			case "url":
				var buttonLabels = "OK,Cancel";
				if (ditem.buttonLabels) { buttonLabels = ditem.buttonLabels; }
				navigator.notification.confirm(message, function(buttonIndex){
					if (buttonIndex==1) {
						window.open(ditem.url,"_system");
						site.lifecycle.storeMsgId(ditem.id,lids);
					} else {
						// do not store msg id if repeat==true, we need to prompt the user the next time
						if (!ditem.repeat) { site.lifecycle.storeMsgId(ditem.id,lids); }
					}
				}, ditem.title, buttonLabels);
				break;
			case "install-update-app":
				site.lifecycle.installUpdateApp(ditem.url);
				site.lifecycle.storeMsgId(ditem.id,lids);
				site.lifecycle.checkingForUpdates = false;
				break;
			case "install-update":
				message = "An update for the stations database is available. Press OK to continue.";
				navigator.notification.alert(message, function(){ site.installer.init(true); }, ditem.title, "OK");
				site.lifecycle.storeMsgId(ditem.id,lids);
				break;
			case "remove_station":
				if (!ditem.station_ids) { 
					loggr.error(" >> remove_station message: !station_ids");
					continue; 
				}
				for (var j=0; j<ditem.station_ids.length; j++) {
					var station_id = ditem.station_ids[j];
					var index = site.helpers.session.getStationIndexById(station_id);
					if (index<0) { loggr.log(" > Station not found: "+ station_id); continue; }
					loggr.log(" >> Remove station: "+ station_id +" @ index "+ j);
					site.data.stations[index] = null;
				}
				var newstations = [];
				for (var j=0; j<site.data.stations.length; j++) {
					var station_data = site.data.stations[j];
					if (station_data) { newstations.push(station_data); }
					else {
						loggr.log(" >> Remove @ index: "+ j);
					}
				}
				site.data.stations = newstations;
				site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),
					function(evt) { 
						loggr.log(" >> stations.json saved");
					},
					function(e){ 
						loggr.error(" >> Could not save station.json!",{dontupload:true});
						loggr.error(site.storage.getErrorType(e)); 
					}
				);
				if (ditem.station_ids.indexOf(site.session.currentstation_id)>=0) {
					// clear current station
					loggr.log(" >> Removed currentstation, let user choose another");
					site.session.currentstation_id = null;
					site.session.currentstation = null;
					site.helpers.storeSession();
					alert("The station you were listening to has been removed from the database (probably because it no longer exists).\n\nPress OK to choose another.");
					site.chlist.init();
				}
				site.lifecycle.storeMsgId(ditem.id,lids);
				break;
			default:
				navigator.notification.alert(message, function(){}, ditem.title, "OK");
				site.lifecycle.storeMsgId(ditem.id,lids);
				break;
		}
		
		// Show one message, then stop
		break;
		
	}
	
	if (site.lifecycle.checkingForUpdates) {
		message = "Icerrr is up to date (version "+ site.cfg.app_version +")";
		navigator.notification.alert(message, function(){ }, "Up to date!", "OK");
	}
	site.lifecycle.checkingForUpdates = false;
	
}

site.lifecycle.storeMsgId = function(id,lids) {
	loggr.log("site.lifecycle.storeMsgId(): "+ id);
	if (lids.indexOf(id)>=0) { return; }
	lids.push(id);
	lidsStr = JSON.stringify(lids);
	site.cookies.put("message_ids",lidsStr);
}

// Download apk

site.lifecycle.installUpdateApp = function(url) {
	
	loggr.info("site.lifecycle.installUpdateApp_init()");
	
	// Prep some stuff
	var targetPath = site.cfg.paths.other;
	var targetFile = "Icerrr.apk";
			
	// success -> Prompt user
	message = "An update for Icerrr is availabe. Do you want to install it now?";
	var buttonLabels = "OK,Cancel";
	navigator.notification.confirm(message, function(buttonIndex){
		if (buttonIndex==1) {
	
			site.ui.showloading(false,"Downloading update...");
	
			// We'll just assume we need to download the file, we're not going to check if it exists whatever...
			site.webapi.download(url,targetPath,targetFile,
				function(fileEntry){
					
					loggr.log(" > Downloaded: "+ fileEntry.fullPath);
							
					site.ui.hideloading();
					
					// A-go-go
					window.mediaStreamer.installUpdateApp(
						fileEntry.fullPath,
						function(res) {
							loggr.log(" > mediaStreamer.installUpdateApp success :D -> "+res);
						},
						function(err) {
							loggr.error(" > mediaStreamer.installUpdateApp failed?! -> "+ err);
							site.ui.showtoast("Install failed :(");
							site.ui.hideloading();
						}
					);
					
				},
				function(fileError) {
					// Error -> Log
					loggr.error("Error downloading icerrr.apk, fileTransferError "+ err.code);
					// Just to be sure: remove the file if it somehow already exists..
					site.storage.deletefile(targetPath,targetFile,function(){},function(){});
					site.ui.showtoast("Download failed :(");
					site.ui.hideloading();
				}
			);
					
		} else {
			// nothin..
		}
	}, "Update available", buttonLabels);
	
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















