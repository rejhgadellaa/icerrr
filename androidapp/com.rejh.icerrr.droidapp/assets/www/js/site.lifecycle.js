
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// LIFECYCLE

site.lifecycle = {};

site.session.lifecycle = {};
site.session.lifecycle.section_history = [];

// Init

site.lifecycle.init = function() {
	
	console.log("\n==================================================================================\n\n");
	console.log("site.lifecycle.init()");
	
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
	console.log(" > Device: "+ site.vars.deviceDesc);
	console.log(" > Screen: "+ $(window).width() +" x "+ $(window).height());
	
	// Defaults..
	site.data.strings = jQuery.extend(true, {}, site.cfg.defaults.strings);
	
	// Vars..
	site.lifecycle.add_section_history("#home");
	
	// Attach 'onDeviceReady' event listener (cordova)
	document.addEventListener('deviceready', site.lifecycle.onDeviceReady, false);
	
	// Google Loader
	google.load("search", "1", {"callback" : function(){console.log(" > Loaded: google.load(search,1)");} });
	
	// Hacks..
	site.ui.hackActiveCssRule();
	
}

// Resize 

site.lifecycle.onResize = function() {
	
	console.log("site.lifecycle.onResize()");
	
	// TODO: figure out if orientation change..
	
	$(".main").css("height",
		$(window).height() - ($(site.vars.currentSection+" .actionbar").height() + $(site.vars.currentSection+" .tabbar").height() + $(site.vars.currentSection+" .footer").height())
	);
	
}

// Device Ready

site.lifecycle.onDeviceReady = function() {
	
	console.log("site.lifecycle.onDeviceReady()");
	
	// Attach more event listeners (cordova)
	document.addEventListener('resume', site.lifecycle.onResume, false);
	document.addEventListener('pause', site.lifecycle.onPause, false);
	document.addEventListener("backbutton", site.lifecycle.onBackButton, false);
	
	// Firstlaunch...
	if (!site.cookies.get("app_is_installed") || site.cookies.get("app_version")<site.cfg.app_version) {
		if (site.vars.currentSection!="#install") { 
			setTimeout(function() { site.installer.init(); },2500);
			return; // <- important stuff yes
		}
	}
	
	// Restore user preferences
	site.data.userprefs = JSON.parse(site.cookies.get("userprefs"));
	if (!site.data.userprefs) {
		console.log(" > No userprefs found, copying defaults...");
		site.data.userprefs = jQuery.extend(true, {}, site.cfg.defaults.userprefs);
	}
	
	// Restore user session
	console.log(" > Restore site.session: "+ site.cookies.get("site.session"));
	site.session = JSON.parse(site.cookies.get("site.session"));
	if (!site.session) { site.session = {}; }
	
	// UI Init
	site.ui.init
	
	// Home
	setTimeout(function() { site.home.init(); },1000);
		
	
	
}

// Resume

site.lifecycle.onResume = function() {
	
	console.log("site.lifecycle.onResume()");
	
	// set timeout now so we have little delay for async shit to rain down upon us
	if (site.timeouts.storage_queue) { clearTimeout(site.timeouts.storage_queue); }
	site.timeouts.storage_queue = setTimeout(function(){
		site.storage.runqueue();
	},1000); // TODO: determine update freq
	
	// Re-init ui updates.. || TODO: we really need a better way to do this..	
	// Call UI close function
	if (!site.session.ui_init_callbacks) { site.session.ui_init_callbacks = []; }
	while (site.session.ui_init_callbacks.length>0) {
		var func = site.session.ui_init_callbacks.shift(); // same order as incoming..
		func();
	}
	
}

// Pause

site.lifecycle.onPause = function() {
	
	console.log("site.lifecycle.onPause()");
	
	// Store some stuff
	site.cookies.put("site.session",JSON.stringify(site.session));
	
	// Write some stuff
	site.storage.writefile(site.cfg.paths.json,"local.site_session.json",site.cookies.get("site.session"),
		function() {
			console.log("site.lifecycle.onPause > write local site.session OK");
		},
		function(err) {
			console.log("site.lifecycle.onPause > write local site.session Error");
		}
	);
	
	// Cancel timeouts
	for (var i in site.timeouts) { if (site.timeouts[i]) { clearTimeout(site.timeouts[i]); } }
	for (var i in site.loops) { if (site.loops[i]) { clearTimeout(site.loops[i]); } }
	
	// Call UI close function
	if (!site.session.ui_pause_callbacks) { site.session.ui_pause_callbacks = []; }
	while (site.session.ui_pause_callbacks.length>0) {
		var func = site.session.ui_pause_callbacks.shift(); // same order as incoming..
		func();
	}
	
}

// Destroy
// - Note: simulated

site.lifecycle.onDestroy = function() {
	
	console.log("site.lifecycle.onDestroy()");
	
	// Call pause..
	site.lifecycle.onPause();
	
	// Release some stuff
	site.mp.destroy();
	
}

// Back button (android)

site.lifecycle.onBackButton = function() {
	
	console.log("site.lifecycle.onBackButton()");
	
	// List of selectors that when display==block, then ignore back!
	var thedonts = {
		"section#install" 			: ($("section#install").css("display")=="block"),
		""							: false // stop it
	}
	
	// TODO: needs some building in so we don't hit back in the middle of an operation..
	if (thedonts[site.vars.currentSection]) { console.log(" > Ignore '<' button, we're working here..."); return; }
	if (site.vars.isloading) { console.log(" > Ignore '<' button, we're working here..."); return; }
	
	var currentBackKey = site.lifecycle.get_section_history_item();
	console.log(currentBackKey);
	
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
		
		case "#editstation":
			site.chlist.init();
			break;
			
		default:
			console.log(" > '<' button on unhandled section: "+ currentBackKey);
			break;
		
	}
	
}

// ---> ACTIONS

// Exit, ..

site.lifecycle.exit = function() {
	console.log("site.lifecycle.exit()");
	site.lifecycle.onDestroy();
	navigator.app.exitApp();
}

// Section history

site.lifecycle.add_section_history = function(selector) {
	console.log("site.lifecycle.add_section_history()");
	if (!site.session.lifecycle) { site.session.lifecycle = {}; }
	if (!site.session.lifecycle.section_history) { site.session.lifecycle.section_history = []; }
	if (site.session.lifecycle.section_history[site.session.lifecycle.section_history.length-1] == selector) { return; }
	site.session.lifecycle.section_history.push(selector);
	console.log(" > "+ JSON.stringify(site.session.lifecycle.section_history));
}

site.lifecycle.clear_section_history = function() {
	console.log("site.lifecycle.clear_section_history()");
	if (!site.session.lifecycle) { site.session.lifecycle = {}; }
	site.session.lifecycle.section_history = [];
}

site.lifecycle.get_section_history_item = function() {
	console.log("site.lifecycle.get_section_history_item()");
	console.log(" > "+ JSON.stringify(site.session.lifecycle.section_history));
	if (!site.session.lifecycle) { site.session.lifecycle = {}; }
	if (!site.session.lifecycle.section_history) { return false; }
	console.log(" > "+ JSON.stringify(site.session.lifecycle.section_history));
	return site.session.lifecycle.section_history.pop();
}















