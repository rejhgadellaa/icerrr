
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// HOME

site.settings = {};

// ---> Init

site.settings.init = function(initApp) {
	
	loggr.debug("site.settings.init()");
	
	// goto section
	site.ui.gotosection("#settings");
	
	// Init + Close callback for #home
	// Best for last :)
	site.lifecycle.addOnPauseCb(site.settings.onpause);
	site.lifecycle.addOnResumeCb(site.settings.onresume);
	
	// Reg listeners
	site.settings.registerListeners();
	
}

// ---> OnPause, OnResume

site.settings.onresume = function() {
	loggr.log("site.settings.onresume()");
}

site.settings.onpause = function() {
	loggr.log("site.settings.onpause()");
}

// ---> Listeners

site.settings.registerListeners = function() {
	
	loggr.debug("site.settings.registerListeners()");
	
	// ---> Update
	
	// Use Wifi
	window.mediaStreamer.getSetting("bool","useWifi",
		function(res) {
			if (res) { $("#settings input[name='useWifi']").attr("checked",true); }
			else { $("#settings input[name='useWifi']").attr("checked",false); }
		},
		function(err) {
			loggr.error(err);
		}
	);
	
	// Show Album Art
	var showAlbumArt = site.cookies.get("setting_showAlbumArt");
	loggr.log(" > showAlbumArt: "+ showAlbumArt);
	if (showAlbumArt==1) { $("#settings input[name='showAlbumArt']").attr("checked",true); }
	else { $("#settings input[name='showAlbumArt']").attr("checked",false); }
	
	// ---> Listener
	
	// Use Wifi
	$("#settings input[name='useWifi']").off("change");
	$("#settings input[name='useWifi']").on("change",function(evt) {
		var targ = evt.currentTarget;
		loggr.log(" > Setting: useWifi: "+ (targ.checked));
		window.mediaStreamer.setting("bool","useWifi",(targ.checked),function(res){loggr.log(" > Stored: "+ res);},function(error){loggr.error(error);});
	});
	
	// Shot Album Art
	$("#settings input[name='showAlbumArt']").off("change");
	$("#settings input[name='showAlbumArt']").on("change",function(evt) {
		var targ = evt.currentTarget;
		loggr.log(" > Setting: showAlbumArt: "+ (targ.checked)?1:0);
		site.cookies.put("setting_showAlbumArt",(targ.checked)?1:0);
		loggr.log(" > "+ site.cookies.get("setting_showAlbumArt"));
	});
	
}

// ---> Store

site.settings.store = function() {
	
	loggr.log("site.settings.store()");
	site.cookies.put("data_settings",JSON.stringify(site.data.settings));
	
}