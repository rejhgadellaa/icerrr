
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
	
	// Attach 'onDeviceReady' event listener (cordova)
	document.addEventListener('deviceready', site.lifecycle.onDeviceReady, false);
	
}

// Device Ready

site.lifecycle.onDeviceReady = function() {
	
	console.log("site.lifecycle.onDeviceReady()");
	
	// Attach more event listeners (cordova)
	document.addEventListener('resume', site.lifecycle.onResume, false);
	document.addEventListener('pause', site.lifecycle.onPause, false);
	document.addEventListener("backbutton", site.lifecycle.onBackButton, false);
	
	// Firstlaunch...
	if (!site.cookies.get("app_is_installed")) {
		
	}
	
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
	
}