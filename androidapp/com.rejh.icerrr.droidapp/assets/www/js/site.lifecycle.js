
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// LIFECYCLE

site.lifecycle = {};

site.session.lifecycle = {};
site.session.lifecycle.section_history = [];

// Init

site.lifecycle.init = function() {
	
	loggr.log("\n==================================================================================\n\n");
	loggr.log("site.lifecycle.init()");
	
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
	
	// Defaults..
	site.data.strings = jQuery.extend(true, {}, site.cfg.defaults.strings);
	
	// Vars..
	site.lifecycle.add_section_history("#home");
	
	// Attach 'onDeviceReady' event listener (cordova)
	document.addEventListener('deviceready', site.lifecycle.onDeviceReady, false);
	
	// Google Loader
	google.load("search", "1", {"callback" : function(){loggr.log(" > Loaded: google.load(search,1)");} });
	
	// Hacks..
	site.ui.hackActiveCssRule();
	
}

// Resize 

site.lifecycle.onResize = function() {
	
	loggr.log("site.lifecycle.onResize()");
	
	// TODO: figure out if orientation change..
	
	setTimeout(function(){
		$(".main").css("height",
			$(window).height() - ($(site.vars.currentSection+" .actionbar").height() + $(site.vars.currentSection+" .tabbar").height() + $(site.vars.currentSection+" .footer").height())
		);
		loggr.log(" > "+ $(site.vars.currentSection+" .main").css("height"));
	},10);
	
	site.ui.hackActiveCssRule()
	
}

// Device Ready

site.lifecycle.onDeviceReady = function() {
	
	loggr.log("site.lifecycle.onDeviceReady()");
	
	// Attach more event listeners (cordova)
	document.addEventListener('resume', site.lifecycle.onResume, false);
	document.addEventListener('pause', site.lifecycle.onPause, false);
	document.addEventListener("backbutton", site.lifecycle.onBackButton, false);
	
	// Device info
	loggr.log(" > Device Info: "
		+"model: "+ device.model
		+", platform: "+ device.platform
		+" "+ device.version
		+", cordova: "+ device.cordova
	);
	
	// Check internet connection
	/*
	switch (navigator.connection.type) {
		
		case Connection.UNKNOWN:
		case Connection.NONE:
			//loggr.warn(" > No internet connection!");
			break;
		
	}
	/**/
		
	// some stuff
	site.session.isPaused = false;
	
	// Firstlaunch...
	if (!site.cookies.get("app_is_installed") || site.cookies.get("app_version")<site.cfg.app_version) {
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
	
	// Restore user preferences
	site.data.userprefs = JSON.parse(site.cookies.get("userprefs"));
	if (!site.data.userprefs) {
		loggr.log(" > No userprefs found, copying defaults...");
		site.data.userprefs = jQuery.extend(true, {}, site.cfg.defaults.userprefs);
	}
	
	// Restore user session
	loggr.log(" > Restore site.session: "+ site.cookies.get("site.session"));
	site.session = JSON.parse(site.cookies.get("site.session"));
	if (!site.session) { site.session = {}; }
	
	// UI Init
	site.ui.init
	
	// Home
	var onstart_gotosection = site.cookies.get("onstart_gotosection");
	site.cookies.put("onstart_gotosection",0)
	switch(onstart_gotosection) {
		
		case "#channellist":
			site.chlist.init();
			break;
		
		default: 
			setTimeout(function() { site.home.init(); },1000);
			break;
			
	}
	
}

// Resume

site.lifecycle.onResume = function() {
	
	loggr.log("site.lifecycle.onResume()");
		
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
	
	loggr.log("site.lifecycle.onPause()");
	
	// Store some stuff
	site.cookies.put("site.session",JSON.stringify(site.session));
	
	// Write sessions
	site.storage.writefile(site.cfg.paths.json,"local.site_session.json",site.cookies.get("site.session"),
		function() {
			loggr.log("site.lifecycle.onPause > write local site.session OK");
		},
		function(err) {
			loggr.log("site.lifecycle.onPause > write local site.session Error");
		}
	);
	
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
	for (var i in site.loops) { if (site.loops[i]) { clearTimeout(site.loops[i]); } }
	
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
	
	loggr.log("site.lifecycle.onDestroy()");
	
	// Call pause..
	site.lifecycle.onPause();
	
	// Release some stuff
	// site.mp.destroy();
	
}

// Back button (android)

site.lifecycle.onBackButton = function() {
	
	loggr.log("site.lifecycle.onBackButton()");
	
	// List of selectors that when display==block, then ignore back!
	var thedonts = {
		"section#install" 			: ($("section#install").css("display")=="block"),
		""							: false // stop it
	}
	
	// TODO: needs some building in so we don't hit back in the middle of an operation..
	if (thedonts[site.vars.currentSection]) { loggr.log(" > Ignore '<' button, we're working here..."); return; }
	if (site.vars.isloading) { loggr.log(" > Ignore '<' button, we're working here..."); return; }
	
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
			site.chlist.init();
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
			
		default:
			loggr.log(" > '<' button on unhandled section: "+ currentBackKey);
			break;
		
	}
	
}

// ---> ACTIONS

// Exit, ..

site.lifecycle.exit = function() {
	loggr.log("site.lifecycle.exit()");
	site.lifecycle.onDestroy();
	navigator.app.exitApp();
}

// Section history

site.lifecycle.add_section_history = function(selector) {
	loggr.log("site.lifecycle.add_section_history()");
	if (!site.session.lifecycle) { site.session.lifecycle = {}; }
	if (!site.session.lifecycle.section_history) { site.session.lifecycle.section_history = []; }
	if (site.session.lifecycle.section_history[site.session.lifecycle.section_history.length-1] == selector) { return; }
	site.session.lifecycle.section_history.push(selector);
	loggr.log(" > "+ JSON.stringify(site.session.lifecycle.section_history));
}

site.lifecycle.clear_section_history = function() {
	loggr.log("site.lifecycle.clear_section_history()");
	if (!site.session.lifecycle) { site.session.lifecycle = {}; }
	site.session.lifecycle.section_history = [];
}

site.lifecycle.remove_section_history_item = function(selector) {
	loggr.log("site.lifecycle.remove_last_section_history_item()");
	if (!site.session.lifecycle) { site.session.lifecycle = {}; }
	if (!site.session.lifecycle.section_history) { site.session.lifecycle.section_history = []; }
	if (site.session.lifecycle.section_history[site.session.lifecycle.section_history.length-1] == selector) { 
		return site.session.lifecycle.section_history.pop();
	}
}

site.lifecycle.get_section_history_item = function(dontPop) {
	loggr.log("site.lifecycle.get_section_history_item()");
	loggr.log(" > "+ JSON.stringify(site.session.lifecycle.section_history));
	if (!site.session.lifecycle) { site.session.lifecycle = {}; }
	if (!site.session.lifecycle.section_history) { return false; }
	loggr.log(" > "+ JSON.stringify(site.session.lifecycle.section_history));
	if (dontPop) { return site.session.lifecycle.section_history[site.session.lifecycle.section_history.length-1]; }
	return site.session.lifecycle.section_history.pop();
}















