
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
site.lifecycle.loadedPolymer = false;

// Polymer async stuff

site.lifecycle.loadPolymer = function() {

	loggr.debug("site.lifecycle.loadPolymer()");

	var webComponentsSupported = ('registerElement' in document
		&& 'import' in document.createElement('link')
	    && 'content' in document.createElement('template'));

	if (!webComponentsSupported) {
		try {
			loggr.log("-> !webComponentsSupported -> Load it") // can't use loggr yet...
			var script = document.createElement('script');
			script.async = true;
			script.onload = site.lifecycle.onloadPolymer;
			script.src = 'bower_components/webcomponentsjs/webcomponents-lite.min.js';
			document.getElementsByTagName('head')[0].appendChild(script);
		} catch(e) {
			var errstr = "site.lifecycle.loadPolymer().Error: "+e
			if (e.stack) {
				errstr += "\n"+ e.stack;
			}
			loggr.error(errstr);
		}
	} else {
	 	site.lifecycle.onloadPolymer();
	}

}

site.lifecycle.onloadPolymer = function() {

	loggr.debug("site.lifecycle.onloadPolymer()");

	// Check import
	var link = document.querySelector('#polymerBundle');
	if (link.import && link.import.readyState === 'complete') {
		site.lifecycle.onloadedPolymer();
	} else {
		link.addEventListener('load', site.lifecycle.onloadedPolymer);
	}

}

site.lifecycle.onloadedPolymer = function() {

	loggr.debug("site.lifecycle.onloadedPolymer()");
	site.lifecycle.loadedPolymer = true;
	if (site.lifecycle.loaded && site.lifecycle.deviceReady && site.lifecycle.loadedPolymer) {
		setTimeout(function(){site.lifecycle.init();},250);
	}

}

// Onload + device ready

site.lifecycle.onload = function() {
	loggr.debug("site.lifecycle.onload()");
	site.lifecycle.loadPolymer();
	site.lifecycle.loaded = true;
	if (site.lifecycle.loaded && site.lifecycle.deviceReady && site.lifecycle.loadedPolymer) {
		setTimeout(function(){site.lifecycle.init();},250);
	}
}

site.lifecycle.onDeviceReady = function() {
	loggr.debug("site.lifecycle.onDeviceReady()");
	site.lifecycle.deviceReady = true;
	if (site.lifecycle.loaded && site.lifecycle.deviceReady && site.lifecycle.loadedPolymer) {
		setTimeout(function(){site.lifecycle.init();},250);
	}
}

// Init

site.lifecycle.init = function() {

	loggr.debug("==================================================================================");
	loggr.debug("site.lifecycle.init()");

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
	document.addEventListener("menubutton", site.lifecycle.onMenuButton, false);
	document.addEventListener("backbutton", site.lifecycle.onBackButton, false);
	document.addEventListener("volumeupbutton", site.lifecycle.onVolumeUp, true);
	document.addEventListener("volumedownbutton", site.lifecycle.onVolumeDown, true);

	// Init app
	site.lifecycle.initApp();

}

// InitApp

site.lifecycle.initApp = function(force) {

	loggr.debug("site.lifecycle.initApp();");

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

	// Check permissions..
	if (!window.JSInterface.hasIcerrrPermissions()) {
		setTimeout(function() { site.installer.init(true); },1250);
		return; // <- important stuff yes
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
		return; // <- important stuff yes
	}

	// Restore user session
	site.helpers.readSession();

	// Register device..
	loggr.log(" > Register device..");
	var apiquery = {
		"get":"register_device",
		"id":site.cookies.get("device_id")
	};
	var apiquerystr = JSON.stringify(apiquery);
	site.webapi.exec("get",apiquerystr,
		function(res) {
			if (res["error"]) {
				loggr.error(res["errormsg"]);
				return;
			}
			loggr.log(" -> Registered device: "+ res["data"]["saved"]);
		},
		function(err) {
			//...
		}
	);

	// Analytics
	var analquery = {
		"get":"analytics",
		"id":site.cookies.get("device_id"),
		"device_model":device.model,
		"device_platform":device.platform +" "+ device.version,
		"app_version":site.cookies.get("app_version")
	}
	var analquerystr = JSON.stringify(analquery);
	site.webapi.exec("get",analquerystr,
		function(res) {
			if (res["error"]) {
				loggr.error(res["errormsg"]);
				return;
			}
			loggr.log(" -> Sent analytics data: "+ res["data"]["saved"]);
		},
		function(err) {
			//...
		}
	);

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
			//site.alarms.testAlarm(); // TODO: REMOVE // COMMENT // DEBUG
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

	// On update..
	if (site.cookies.get("app_has_updated")!=0) {
		site.vars.app_has_updated_home = true;
		loggr.log(" > App_has_updated: "+site.cookies.get("app_has_updated"));
		site.cookies.put("app_has_updated",0);
		site.ui.showtoast("Icerrr was updated :D <span style='float:right; color:#FF5722; pointer-events:auto;' onclick='window.open(\"https://github.com/rejhgadellaa/icerrr/wiki/Changelog\",\"_system\");'>LEARN MORE</span>",10,true);
		site.helpers.uploadStations();
	}

	// Re-set alarms
	site.alarms.setAlarms();

	// Hacks..
	site.ui.hackActiveCssRule();

}

// New Intent

site.lifecycle.onNewIntent = function(result,intentTime) {

	loggr.debug("site.lifecycle.onNewIntent()");

	loggr.log(" -> site.vars.onNewIntentTime: "+ site.vars.onNewIntentTime);
	loggr.log(" -> intentTime: "+ intentTime);
	loggr.log(" -> Same: "+ (site.vars.onNewIntentTime==intentTime));

	// Check intentTime..
	if (!site.vars.onNewIntentTime) { site.vars.onNewIntentTime = -2; }
	if (site.vars.onNewIntentTime==intentTime) {
		loggr.log(" > intentTime not changed, return");
		//alert("Hehe got it! :D");
		return;
	}
	site.vars.onNewIntentTime=intentTime;

	// Handle intents other than alarms (like snooze_cancel cmd)
	// Check for cmd intent..
	window.plugins.webintent.getExtra("cmd",
		function(cmd) {

			loggr.log(" > GetExtra 'cmd': "+ cmd);

			// Alarm
			if (cmd == "alarm") {
				window.plugins.webintent.getExtra("station_id",
					function (station_id) {
						loggr.log(" > Extra: station_id: "+station_id);
						var tmpobj = {station_id:station_id};
						site.cast.destroy(); // make sure we're not firing an alarm over chromecast api
						site.chlist.selectstation(tmpobj,true,true); // select station
						site.session.alarmActive = true; // set alarm active
						site.home.init(); // refresh home
						site.helpers.storeSession(); // store session
						site.home.alarmUpdateTime();
						if (site.session.snoozeAlarm) {
							site.home.alarmSnoozeCancel(true);
						}

					},
					function(err) {
						loggr.warn("site.lifecycle.onNewIntent.getExtra 'station_id' failed: "+ err,{dontsave:true});
					}
				);
			}

			// Cancel_snooze
			if (cmd == "snooze") {
				setTimeout(function(){site.home.alarmSnooze();},1000);
			}

			// Cancel_snooze
			if (cmd == "cancel_snooze") {
				setTimeout(function(){site.home.alarmSnoozeCancel();},1000);
			}

			// Cast: quit
			if (cmd == "cast_quit") {
				setTimeout(function(){site.cast.destroy();},1000);
			}

		},
		function(err) {
			loggr.warn("site.lifecycle.onNewIntent.getExtra 'cmd' failed: "+ err);
		}
	);

	return; // <-- STOP IT HERE

}

// Resume

site.lifecycle.onResume = function() {

	loggr.debug("site.lifecycle.onResume()");

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

	// Fabscroll..
	site.ui.initFabScroll(site.vars.currentSection);

	// Stop! Resize!
	site.lifecycle.onResize();

}

// Pause

site.lifecycle.onPause = function() {

	loggr.debug("site.lifecycle.onPause()");

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

	loggr.debug("site.lifecycle.onDestroy()");

	// Call pause..
	site.lifecycle.onPause();

	// Release some stuff
	// site.mp.destroy();

}

// Menu button

site.lifecycle.onMenuButton = function() {

	loggr.debug("site.lifecycle.onMenuButton()");

	if (site.vars.currentSection == "#home") {
		site.home.toggleOverflowMenu();
	}

}

// Back button (android)

site.lifecycle.onBackButton = function() {

	loggr.debug("site.lifecycle.onBackButton()");

	// List of selectors that when display==block, then ignore back!
	var thedonts = {
		"section#install" 			: ($("section#install").css("display")=="block"),
		""							: false // stop it
	}

	// TODO: needs some building in so we don't hit back in the middle of an operation..
	if (thedonts[site.vars.currentSection]) { loggr.log(" > Ignore '<' button, we're working here..."); return; }
	if (site.vars.isLoading) { loggr.log(" > Ignore '<' button, we're working here..."); return; }

	var currentBackKey = site.lifecycle.get_section_history_item();
	loggr.log(" > currentBackKey: "+ currentBackKey);

	// Okay, that out of the way...
	switch(currentBackKey) {

		case "":
		case "#exit":
		case "#home":
			if (site.home.overflowMenuIsVisible) {
				site.home.dismissOverflowMenu();
				site.lifecycle.add_section_history("#home");
			} else {
				//site.lifecycle.exit();
				site.lifecycle.add_section_history("#home");
				window.JSInterface.moveTaskToBack();
				site.lifecycle.onPause();
				site.helpers.checkImageCache();
			}
			break;

		case "#channellist":
			site.home.init();
			break;

		case "#detailstation":
			if (site.lifecycle.get_section_history_item(true)=="#home") {
				site.home.init();
			} else {
				site.chlist.init(true);
			}
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
				site.lifecycle.add_section_history("#searchicon");
				site.ui.showtoast("Please choose an icon");
			}
			break;

		case "#editstation":
			if (site.lifecycle.get_section_history_item(true)=="#detailstation") {
				site.detailstation.init(null,false,true);
			} else {
				site.chlist.init(true);
			}
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

	loggr.debug("site.lifecycle.onResize()");

	if (site.timeouts.onresize) { clearTimeout(site.timeouts.onresize); }
	site.timeouts.onresize = setTimeout(function(){
		try {
			$(site.vars.currentSection+" .main").css("height",
				// $(window).height() - ($(site.vars.currentSection+" .actionbar").height() + $(site.vars.currentSection+" .tabbar").height()) // $(site.vars.currentSection+" .footer").height()
				$(window).height() - ($(site.vars.currentSection+" .main").offset().top)
			);
		} catch(e) {}
	},10);

	site.ui.hackActiveCssRule();

}

site.lifecycle.onVolumeUp = function() {
	if (site.cast.media && site.cast.session) {
		site.cast.onVolumeUp();
	} else {
		window.mediaStreamer.incrVolume(null,null);
	}
}

site.lifecycle.onVolumeDown = function() {
	if (site.cast.media && site.cast.session) {
		site.cast.onVolumeDown();
	} else {
		window.mediaStreamer.decrVolume(null,null);
	}
}

// ---> ACTIONS

// Exit, ..

site.lifecycle.exit = function() {
	loggr.debug("site.lifecycle.exit()");
	site.lifecycle.onDestroy();
	navigator.app.exitApp();
}

// ---> Messages

site.lifecycle.checkMsgs = function(startedByUser) {

	loggr.debug("site.lifecycle.checkMsgs()");

	/*
	if (startedByUser) {

		// Check conntype
		var conntype = site.helpers.getConnType();
		if (conntype!="WIFI" && conntype!="ETHERNET" && conntype!="UNKNOWN") {
			alert("Please enable wifi and try again");
			return;
		}

		// Set flag..
		site.lifecycle.checkingForUpdates = true;

	}
	/**/

	site.lifecycle.checkingForUpdatesByUser = false;
	if (startedByUser) {
		site.lifecycle.checkingForUpdates = true;
		site.lifecycle.checkingForUpdatesByUser = true;
	}

	var action = "get";
	var queryobj = {
		"get":"messages"
	};

	site.webapi.exec(action, JSON.stringify(queryobj),
		function(res) {
			site.lifecycle.handleMsgs(res["data"],startedByUser);
		},
		function(err) {
			// do nothing..
			loggr.error(" > lifecycle.checkMsgs().Error: "+ err.message);
		}
	);

}

site.lifecycle.handleMsgs = function(data,startedByUser) {

	loggr.debug("site.lifecycle.handleMsgs()");

	// Get local data thingie
	var lidsStr = site.cookies.get("message_ids");
	loggr.log(" > Stored message ids: "+ lidsStr, {toconsole:site.cfg.debugging});
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
			if (critvalue<=ditem.critvalue && startedByUser && ditem.action=="install-update-app") {
				loggr.log(" >>> Don't skip :D started by user dude && it's a new version!");
				loggr.log(" --> "+ critvalue +" <= "+ ditem.critvalue);
			} else {
				continue;
			}
		}

		// Check wifiOnly && conntype (msg will wait until wifi || ethernet)
		if (ditem.onlyOnWifi && !site.lifecycle.checkingForUpdatesByUser) {
			var conntype = site.helpers.getConnType();
			if (conntype!="WIFI" && conntype!="ETHERNET" && conntype!="UNKNOWN") {
				loggr.log(" >> no wifi! wait until we have it");
				break; // -> onlyOnWifi should be blocking other messages?
				// continue;
			}
		}

		// Check message
		if (!ditem.message && ditem.action!="install-update-app") {
			loggr.log(" >> No message! next!", {toconsole:site.cfg.debugging});
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
				site.lifecycle.installUpdateApp(ditem,startedByUser);
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
		site.lifecycle.checkingForUpdates = false;
		break;

	}

	if (site.lifecycle.checkingForUpdates) {
		message = "Icerrr is up to date (version "+ site.helpers.formatFloat(site.cfg.app_version,3) +")";
		//navigator.notification.alert(message, function(){ }, "Up to date!", "OK");
		site.ui.showtoast(message,5,true);
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

site.lifecycle.installUpdateApp = function(ditem,startedByUser) {

	loggr.debug("site.lifecycle.installUpdateApp_init()");

	// Prep values from ditem
	var url = ditem.url;
	if (!url) { loggr.error(" > ditem.url is not defined: "+ url); }
	var title = (ditem.title) ? ditem.title : "Update available";
	var message = (ditem.message) ? ditem.message.join("\n") : "An update for Icerrr is availabe. Do you want to install it now?";
	var buttonLabels = (ditem.buttonLabels) ? ditem.buttonLabels : "Yes,No";
	var critical = (ditem.critical) ? ditem.critical : 0;

	loggr.log(" > "+ buttonLabels +", "+ ditem.buttonLabels);

	// Prep some stuff
	var targetPath = site.cfg.paths.other;
	var targetFile = "Icerrr.apk";

	// Check chrome runtime
	if (device.model.indexOf("App Runtime for Chrome")>=0) {

		if (startedByUser) {
			alert("App Runtime for Chrome does not yet support Icerrr's automatic update mechanism. Press OK to download the apk manually and use ARC Welder to install it.");
			window.open(url.split("dl=1").join("dl=0"),'_system');
			return;
		} else {
			loggr.warn(" > Don't prompt for update because we're in App Runtime for Chrome");
			return;
		}

	}

	// Store ditem
	site.vars.ditem = ditem;

	if (critical || startedByUser) {

		// success -> Prompt user
		navigator.notification.confirm(
			message,
			site.lifecycle.downloadUpdateApp,
			title,
			buttonLabels
		);

	} else {

		site.ui.showtoast(title +" <span style='float:right; color:#FF5722; pointer-events:auto;' onclick='site.lifecycle.installUpdateApp(site.vars.ditem,true);'>LEARN MORE</span>",10,true);

	}

}

site.lifecycle.downloadUpdateApp = function(buttonIndex){

	if (site.cast.session) {
		site.cast.destroy();
	} else {
		site.mp.stop();
	}

	var ditem = site.vars.ditem;

	// Prep some stuff
	var targetPath = site.cfg.paths.other;
	var targetFile = "Icerrr.apk";

	// Prep values from ditem
	var url = ditem.url;
	if (!url) { loggr.error(" > ditem.url is not defined: "+ url); }
	var title = (ditem.title) ? ditem.title : "Update available";
	var message = (ditem.message) ? ditem.message.join("\n") : "An update for Icerrr is availabe. Do you want to install it now?";
	var buttonLabels = (ditem.buttonLabels) ? ditem.buttonLabels : "Yes,No";
	var critical = (ditem.critical) ? ditem.critical : 0;

	if (buttonIndex==1) {

		site.ui.hidetoast();
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
						alert("Sorry, the installation failed :(");
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
};

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
	if (site.session.lifecycle.section_history[site.session.lifecycle.section_history.length-1] != selector) {
		site.session.lifecycle.section_history.push(selector);
	} else {
		loggr.log(" > Selector exsits in history: "+ selector);
	}
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
