
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
	site.vars.currentSection = "#home";
	
	// Attach 'onDeviceReady' event listener (cordova)
	document.addEventListener('deviceready', site.lifecycle.onDeviceReady, false);
	
	// Google Loader
	google.load("search", "1", {"callback" : function(){console.log(" > Loaded: google.load(search,1)");} });
	
}

// Resize 

site.lifecycle.onResize = function() {
	
	console.log("site.lifecycle.onResize()");
	
	// TODO: figure out if orientation change..
	
	$(".main").css("height",
		$(window).height() - ($(site.vars.currentSection+" .actionbar").height() + $(site.vars.currentSection+" .footer").height())
	);
	
}

// Device Ready

site.lifecycle.onDeviceReady = function() {
	
	console.log("site.lifecycle.onDeviceReady()");
	
	// Attach more event listeners (cordova)
	document.addEventListener('resume', site.lifecycle.onResume, false);
	document.addEventListener('pause', site.lifecycle.onPause, false);
	document.addEventListener("backbutton", site.lifecycle.onBackButton, false);
	
	// Give splash some time...
	setTimeout(function() {
	
		// Firstlaunch...
		if (!site.cookies.get("app_is_installed") || site.cookies.get("app_version")<site.cfg.app_version) {
			if (site.vars.currentSection!="#install") { 
				site.installer.init(); 
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
		site.session = JSON.parse(site.cookies.get("site.session"));
		if (!site.session) { site.session = {}; }
		
		// Home
		site.home.init();
		
	},2500);
	
}

// Resume

site.lifecycle.onResume = function() {
	
	console.log("site.lifecycle.onResume()");
	
}

// Pause

site.lifecycle.onPause = function() {
	
	console.log("site.lifecycle.onPause()");
	
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
	
	
	// Okay, that out of the way...
	switch(site.vars.currentSection) {
		
		case "":
		case "#exit":
		case "#home":
			navigator.app.exitApp();
			break;
		
		case "#channellist":
			site.home.init();
			break;
			
		default:
			console.log(" > '<' button on unhandled section: "+ site.vars.currentSection);
			break;
		
	}
	
}

















