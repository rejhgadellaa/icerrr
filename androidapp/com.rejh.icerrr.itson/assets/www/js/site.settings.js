
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
	
	// Use SAA
	window.mediaStreamer.getSetting("bool","useSAA",
		function(res) {
			if (res) { $("#settings input[name='useSAA']").attr("checked",true); }
			else { $("#settings input[name='useSAA']").attr("checked",false); }
		},
		function(err) {
			loggr.error(err);
		}
	);
	
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
	
	// Use SAA
	$("#settings input[name='useSAA']").off("change");
	$("#settings input[name='useSAA']").on("change",function(evt) {
		var targ = evt.currentTarget;
		loggr.log(" > Setting: useSAA: "+ (targ.checked));
		window.mediaStreamer.setting("bool","useSAA",(targ.checked),function(res){loggr.log(" > Stored: "+ res);},function(error){loggr.error(error);});
		if ((targ.checked)) {
			alert("Don't forget to set SAA's ringtone to 'silent'!");
		}
	});
	
}

// ---> Store

site.settings.store = function() {
	
	loggr.log("site.settings.store()");
	site.cookies.put("data_settings",JSON.stringify(site.data.settings));
	
}

// ---> Help

site.settings.helpSimple = function() {
	loggr.error("site.settings.helpSimple() > Empty stub");
}

site.settings.helpUseWifi = function() {
	loggr.log("site.settings.helpUseWifi()");
	var title = "Help: Settings";
	var buttonName = "OK";
	var message = ""
		+"Always turn on WiFi\n\n"
		+"When enabled, Icerrr will always turn on WiFi when a stream is started to limit data usage as much as possible.\n\n"
		+"WiFi will always be turned on when alarms fire, ignoring this setting.\n\n"
		+"Note: It is recommended to leave this option enabled."
		//+"All alarms that are are fired by SAA will then cause Icerrr to start the last station you listened to. It is therefore recommended to silence the alarm sound in SAA.\n\n"
		//+"Note: Alarms set in Icerrr are not affected and will have no interaction with SAA."
		;
	navigator.notification.alert(message, function(){}, title, buttonName)
}

site.settings.helpShowAlbumArt = function() {
	loggr.log("site.settings.helpShowAlbumArt()");
	var title = "Help: Settings";
	var buttonName = "OK";
	var message = ""
		+"Show album art\n\n"
		+"Icerrr can use Google Image Search to find and show album art. However, since (most) album art is copyrighted this is disabled by default because Icerrr could be held responsible for showing artwork it is not licensed to show. This is why Icerrr will do this on *your* behalf.\n\n"
		//+"All alarms that are are fired by SAA will then cause Icerrr to start the last station you listened to. It is therefore recommended to silence the alarm sound in SAA.\n\n"
		//+"Note: Alarms set in Icerrr are not affected and will have no interaction with SAA."
		;
	navigator.notification.alert(message, function(){}, title, buttonName)
}

site.settings.helpSaa = function() {
	loggr.log("site.settings.helpSaa()");
	var title = "Help: Settings";
	var buttonName = "OK";
	var message = ""
		+"Sleep As Android integration\n\n"
		+"If this option is enabled, Icerrr will respond to the following events generated by Sleep As Android (SAA): alarm start, stop and snooze.\n\n"
		+"Usage: enable this option and set up one or more alarms in Sleep As Android. Now, when SAA has detected that it's a good time to wake you up Icerrr will start the last station you listened to. You can then use SAA's snooze and dismiss buttons to (temporary) stop the stream."
		//+"All alarms that are are fired by SAA will then cause Icerrr to start the last station you listened to. It is therefore recommended to silence the alarm sound in SAA.\n\n"
		//+"Note: Alarms set in Icerrr are not affected and will have no interaction with SAA."
		;
	navigator.notification.alert(message, function(){}, title, buttonName)
}










