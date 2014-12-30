
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// HOME

site.home = {};

// ---> Init

site.home.init = function() {
	
	loggr.info("------------------------------------");
	loggr.info("site.home.init();");
	
	// Check if station has been selected
	if (!site.session.currentstation_id) {
		loggr.log(site.session.currentstation_id);
		site.ui.showtoast("Please choose a station");
		site.chlist.init();
		return; // <- important
	}
	
	// Get station
	var station = site.session.currentstation;
	
	// Clear lifecycle history || TODO: NOTE: IMPORTANT: always do 'clear_section_history()' before 'gotosection()'...
	site.lifecycle.clear_section_history();
	
	// --> Do something...
	
	// goto section
	site.ui.gotosection("#home");

	// player
	site.mp.init();
	
	// ui updates
	site.home.init_ui_updates();
	
	// average color
	$("#home .main .station_image img").off("load");
	$("#home .main .station_image img").off("error");
	$("#home .main .station_image img").on("load",
		function(evt) { // TODO: detect transparent images..
			var img = $("#home .main .station_image img")[0];
			var color = site.helpers.getImgAvgColor(img,0,0,2,2);
			var colorIcon;
			if (color[3]<1.0 || color[0]>=250 && color[1]>=250 && color[2]>=250) {
				color = [51,51,51,1.0];
				colorIcon = [255,255,255,1]
			} else {
				//var colorThief = new ColorThief();
				//var color = colorThief.getColor(img);
			}
			// $("#home .main .station_image").css("background-color","rgba("+color[0]+","+color[1]+","+color[2]+","+color[3]+")");
			// $("#home .main .station_image").css("-webkit-background-blend-mode","multiply");
			// $("#home .main .station_image").css("background-blend-mode","multiply");
			$("#home .main .station_image").css("background-image","url('img/bg_home_default.jpg')");
			if (colorIcon) { 
				if (!$("#home .main .station_image img").hasClass("shadow_z2")) { $("#home .main .station_image img").addClass("shadow_z2"); }
				$("#home .main .station_image img").css("background-color","rgba("+colorIcon[0]+","+colorIcon[1]+","+colorIcon[2]+","+colorIcon[3]+")");
			}
			else { 
				if ($("#home .main .station_image img").hasClass("shadow_z2")) { $("#home .main .station_image img").removeClass("shadow_z2"); }
				$("#home .main .station_image img").css("background-color","rgba("+color[0]+","+color[1]+","+color[2]+","+color[3]+")");
			}
			$("#home .main .station_image img").css("opacity",1.0);
		}
	);
	$("#home .main .station_image img").on("error",function(evt) {
		loggr.error(" > Error loading image: "+evt.currentTarget.src,{dontupload:true});
		evt.currentTarget.src = "img/icons-48/ic_launcher.png";
	});
	
	// extra ui
	if (site.home.lastStationId!=site.session.currentstation.station_id) {
		site.home.handleStationImage(site.session.currentstation.station_icon);
	}
	site.home.lastStationId = site.session.currentstation.station_id;
	$("#home .main .station_name").html(site.session.currentstation.station_name);
	$("#home .main .station_nowplaying").html("Now playing: ...");
	$("#home .main").css("background","rgba(0,0,0,0)");
	
	$("#home .main .station_image img").on("error",function(evt) {
		loggr.warn(" > !onload: "+ evt.originalEvent.target.src);
		$("#home .main .station_image img").attr("src","img/icons-48/ic_launcher.png");
	});
	
	// extra events
	$("#home .main .station_nowplaying")[0].onclick = function(ev) {
		site.home.run_station_updates();
	}
	
	
	// hacks..
	site.ui.hackActiveCssRule();
	
	// Init + Close callback for #home
	// Best for last :)
	site.lifecycle.addOnPauseCb(site.home.onpause);
	site.lifecycle.addOnResumeCb(site.home.onresume);
	
	// Test: chromecast
	site.cast.setup();
	
	// Cleanup other containers || TODO
	//$("#alarms .main").html("");
	//$("#channellist .main").html("");
	//$("#searchstation_results .main").html("");
	//$("#searchicon .main").html("");
	
	// App updated
	/*
	if (site.cookies.get("donate_button_shown")!=1 && site.vars.app_has_updated_home) {
		site.vars.app_has_updated_home = false; // do once
		site.cookies.put("donate_button_shown",1);
		$("#dialog").fadeIn(500);
		$("#dialog_inner").html(""
			+"<h2>Icerrr <span style='font-size:12pt'>"+ site.cfg.app_version +"</span></h2>"
			+"<p>Thanks for using Icerrr!</p>"
			+"<p>Please consider making a small donation to keep the project (and me) alive :)</p>"
			+"<p>(This message will auto-destruct in ~5 seconds)</p>"
			+"<img src=\"https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif\" onclick=\"window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=S6BCCM9LESNBU&lc=US&item_name=REJH%20Gadellaa&item_number=icerrr_droidapp&currency_code=EUR&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted','_system');\" style='position:absolute; bottom:32px; left:50%; margin-left:-72px;' />"
		);
		setTimeout(function(){ $("#dialog").fadeOut(500); },5500);
	}
	/**/
	
	// Save to mediastreamer
	station.station_port = ""+station.station_port;
	loggr.log(" > Store as default_station for MediaStreamer plugin");
	window.mediaStreamer.setting("string","default_station",JSON.stringify(station),function(res){loggr.log(" > Stored: "+ res);},function(error){loggr.error(error);});
	
}

// PAUSE RESUME
// - Important stuff: this is function that will be called whenever site.ui.gotosection is called

site.home.onpause = function() {
	loggr.info("site.home.onpause()");
	site.home.stop_ui_updates();
}

site.home.onresume = function() {
	loggr.info("site.home.onresume()");
	site.home.init_ui_updates();
}

// ---> Media: play, stop

site.home.mpPlayToggle = function() {
	
	loggr.info("site.home.mpPlayToggle()");
	
	// Limit button presses to 1 per .. second?
	// If user start bashing let him through..
	if (site.vars.mpPlayToggleBusy) {
		site.vars.mpPlayToggleBusy = false;
		return false;
	}
	
	site.vars.mpPlayToggleBusy = true;
	setTimeout(function(){ site.vars.mpPlayToggleBusy = false; },1250);
	
	// MP or cast?
	if (site.cast.session) {
		loggr.log(" > Chromecast session found...");
		// check mp
		if (site.mp.mp) { site.mp.destroy(); }
		// check media...
		if (site.cast.media) {
			loggr.log(" > Chromecast media found...");
			// TODO: site.cast.media.getStatusRequest
			switch (site.cast.media.playerState) {
				
				case chrome.cast.media.PlayerState.PLAYING:
				case chrome.cast.media.PlayerState.BUFFERING:
					loggr.log(" >> stop");
					site.cast.destroy();
					break;
					
				default:
					loggr.log(" >> play");
					site.cast.media.play();
					break;		
					
			}
		} else {
			loggr.log(" > No media, loadMedia()");
			
			try {
				site.cast.loadMedia(); // <-- PROBLEM??
			} catch(e) {
				site.cast.session = null;
			}
			
		}
	} else {
		loggr.log(" > Toggle mediaplayer");
		site.mp.playToggle();
	}
	
	$(".button_play_bufferAnim").fadeIn(500);
	return true;
	
}

// ---> UI stuff

// Ui updater

site.home.init_ui_updates = function() {
	
	loggr.info("site.home.init_ui_updates()");
	
	if (site.loops.home_ui_timeout) { clearInterval(site.loops.home_ui_timeout); }
	site.loops.home_ui_timeout = setInterval(function(){site.home.run_ui_updates()},2000);
	site.home.run_ui_updates(); // run once because interval will only fire after xxx sec
	
	if (site.loops.home_station_timeout) { clearInterval(site.loops.home_station_timeout); }
	site.loops.home_station_timeout = setInterval(function(){site.home.run_station_updates()},(60*1000)*1.5); // ~every minute
	site.home.run_station_updates(); // run once because interval will only fire after xxx sec
	
}

site.home.stop_ui_updates = function() {
	
	loggr.info("site.home.stop_ui_updates()");
	
	if (site.loops.home_ui_timeout) { clearInterval(site.loops.home_ui_timeout); }
	if (site.loops.home_station_timeout) { clearInterval(site.loops.home_station_timeout); }
	
}

site.home.run_ui_updates = function() {
	
	//loggr.log("site.home.run_ui_updates()");
	
	// Home >> Footer >> Play button
	if (site.mp.mpstatus==Media.MEDIA_RUNNING && !$(".button.center").hasClass("active")) {
		loggr.log(" > .button.center addclass active");
		$(".button.center").removeClass("busy"); 
		$(".button.center").addClass("active"); 
		$(".button_play_bufferAnim").fadeOut(250);
		$(".button.center img").attr("src","img/icons-96/ic_stop_w.png");
	} else if (site.mp.mpstatus==Media.MEDIA_STARTING) {
		$(".button.center").removeClass("active"); 
		$(".button.center").removeClass("busy");
		$(".button.center").addClass("busy");
		$(".button_play_bufferAnim").fadeIn(500);
		$(".button.center img").attr("src","img/icons-96/ic_stop_w.png");
	} else if (site.mp.mpstatus==Media.MEDIA_PAUSED && !$(".button.center").hasClass("busy")) {
		$(".button.center").removeClass("active"); 
		$(".button.center").addClass("busy");
		$(".button_play_bufferAnim").fadeOut(250);
		$(".button.center img").attr("src","img/icons-96/ic_stop_w.png");
	} else if (site.mp.mpstatus!=Media.MEDIA_RUNNING && $(".button.center").hasClass("active")) {
		$(".button.center").removeClass("active"); 
		$(".button.center").removeClass("busy"); 
		$(".button_play_bufferAnim").fadeOut(250);
		$(".button.center img").attr("src","img/icons-96/ic_play_w.png");
	} else if (site.mp.mpstatus==Media.MEDIA_NONE) {
		$(".button.center").removeClass("active"); 
		$(".button.center").removeClass("busy"); 
		$(".button_play_bufferAnim").fadeOut(250);
		$(".button.center img").attr("src","img/icons-96/ic_play_w.png");
	}
	
	// When paused, stop updates...
	if (site.session.isPaused) {
		site.home.stop_ui_updates();
	}
	
}

site.home.run_station_updates = function(dontUseDirble) {
	
	//loggr.log("site.home.run_station_updates()");
	
	if (site.session.currentstation.dirble_id && !dontUseDirble) {
		site.home.useDirbleNowPlaying();
		return;
	}
	
	var apiqueryobj = {
		"get":"station_info",
		"station_id":site.session.currentstation.station_id,
		"station_host":site.session.currentstation.station_host,
		"station_port":site.session.currentstation.station_port,
		"station_path":site.session.currentstation.station_path
	}
	
	var apiaction = "get";
	var apiquerystr = JSON.stringify(apiqueryobj);
	
	site.webapi.exec(apiaction,apiquerystr,
		function(data) {
			if (data["error"]) {
				loggr.warn(" > "+data["errormsg"]);
				return;
			}
			if (!data["data"]["nowplaying"]) { 
				// site.session.currentstation.station_name = site.helpers.capitalize(data["data"]["icy-name"]); // <- dont set it, keep the json value
				site.session.currentstation.station_nowplaying = "Now playing: Unknown";
				site.home.handleStationImage(site.session.currentstation.station_icon);
			} else {
				// if (data["data"]["icy-name"]) { site.session.currentstation.station_name = site.helpers.capitalize(data["data"]["icy-name"]); }
				site.session.currentstation.station_nowplaying = data["data"]["nowplaying"];
				site.home.getAlbumArt();
			}
			$("#home .main .station_name").html(site.session.currentstation.station_name);
			$("#home .main .station_nowplaying").html(site.session.currentstation.station_nowplaying);
			
			// Cast
			if (site.cast.session && site.cast.media) {
				// urn:x-cast:com.google.cast.media.
				// site.cast.session.sendMessage("","urn:x-cast:com.google.cast.media.Image
				site.cast.updateMetadata();
			}
		},
		function(error) {
			if (error.message) { site.ui.showtoast(error.message); loggr.warn(error.message); }
			else { loggr.log(error); }
		}
	);
	
	// When paused, stop updates...
	if (site.session.isPaused) {
		site.home.stop_ui_updates();
	}
	
	if (site.mp.serviceRunning) {
		site.mp.notif();
	}
	
}

// ---> Dirble nowplaying

site.home.useDirbleNowPlaying = function() {
	
	loggr.info("site.home.useDirbleNowPlaying()");
	
	var apiqueryobj = {
		"get":"nowplaying_dirble",
		"dirble_id":site.session.currentstation.dirble_id,
	}
	
	var apiaction = "get";
	var apiquerystr = JSON.stringify(apiqueryobj);
	
	site.webapi.exec(apiaction,apiquerystr,
		function(data) {
			if (!data["data"]["songhistory"]) { 
				site.home.run_station_updates(true);
			} else {
				try {
				site.session.currentstation.station_nowplaying = site.helpers.capitalize(data["data"]["songhistory"][0].name,1) +" - "+ site.helpers.capitalize(data["data"]["songhistory"][0].title,1);
				if ((data["data"]["songhistory"][0].date.sec*1000) < (new Date().getTime()+(1000*60*60))) {
					site.home.run_station_updates(true);
					return;
				}
				} catch(e) { 
					site.home.run_station_updates(true);
					return;
				}
			}
			$("#home .main .station_name").html(site.session.currentstation.station_name);
			$("#home .main .station_nowplaying").html(site.session.currentstation.station_nowplaying);
			try {
				if (data["data"]["songhistory"][0].info.image) {
					site.home.handleStationImage(data["data"]["songhistory"][0].info.image);
				} else {
					site.home.getAlbumArt();
				}
			} catch(e) {
				site.home.getAlbumArt();
			}
		},
		function(error) {
			if (error.message) { site.ui.showtoast(error.message); loggr.log(error.message); }
			else { loggr.warn(error); }
			site.home.run_station_updates(true);
		}
	);
	
	if (site.session.isPaused) {
		site.home.stop_ui_updates();
	}
	
	if (site.mp.serviceRunning) {
		site.mp.notif();
	}
	
}

site.home.getAlbumArt = function() {
	
	loggr.info("site.home.getAlbumArt()");
	
	// Enabled?
	if (site.cookies.get("setting_showAlbumArt")!=1) {
		loggr.log(" > Disabled. Return.");
		$("#home .main .station_image img").css("opacity",1.0);
		$("#home .main .station_image").css("background-image","url('img/bg_home_default.jpg')");
		return;
	}
	
	// Get station
	var station = site.session.currentstation;
	
	// Check now playing
	if (station.station_nowplaying=="Now playing: Unknown") {
		site.home.handleStationImage(site.session.currentstation.station_icon);
		return;
	}
	
	// Prep data || TODO: need more info, 'radio 1' returns image for bbc radio 1
	var searchstring = ""
		+ "\""+ station.station_nowplaying.toLowerCase() +"\" "
		+ "album art";
	
	var opts = {
		maxresults:4
	}
	
	if (google) { if (google.search) { if (google.search.ImageSearch) {
		var conntype = site.helpers.getConnType();
		if (conntype=="WIFI" || conntype=="ETHERNET") {
			opts.restrictions = [
				[google.search.ImageSearch.RESTRICT_IMAGESIZE, google.search.ImageSearch.IMAGESIZE_LARGE]
			];
		} else {
			opts.restrictions = [
				[google.search.ImageSearch.RESTRICT_IMAGESIZE, google.search.ImageSearch.IMAGESIZE_MEDIUM]
			];
		}
	}}}
	
	site.helpers.googleImageSearch(searchstring,
		function(results) {
			// pick an image
			var result = results[0];
			site.home.handleStationImage(result.url);
		},
		function() {
			site.home.handleStationImage(site.session.currentstation.station_icon);
		},
		opts
	);

}

site.home.handleStationImage = function(src) {
	
	loggr.log("site.home.handleStationImage()");
	loggr.log(" > "+ src);
		
	var station = site.session.currentstation;
	
	// Icon or album art..
	if (src == site.session.currentstation.station_icon) {
		// icon
		
		var station = site.session.currentstation;
		
		if (site.helpers.shouldDownloadImage(station.station_image_local,station.station_icon)) {
			var filename = site.helpers.imageUrlToFilename(station.station_icon,"station_image_"+station.station_name.split(" ").join("-").toLowerCase(),false);
			site.helpers.downloadImage($("#home .main .station_image img")[0], filename, station.station_icon,
				function(fileEntry,imgobj) {
					var stationIndex = site.helpers.session.getStationIndexById(station.station_id);
					loggr.log(" > DL "+ stationIndex +", "+ fileEntry.fullPath);
					site.data.stations[stationIndex].station_image_local = fileEntry.fullPath;
					site.data.stations[stationIndex].station_edited["station_image_local"] = new Date().getTime();
					site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json");
				},
				function(error) {
					loggr.error(" > Error downloading '"+ station.station_icon +"'",{dontupload:true});
					console.error(error);
					$("#home .main .station_image img").attr("src","img/icons-48/ic_launcher.png");
				}
			);
		} else {
			$("#home .main .station_image img").attr("src",station.station_image_local);
		}
		
		// $("#home .main .station_image img").attr("src",site.helpers.addCachebust(src));
		return;
		
	}
	
	// Check if image already loaded..
	if ($("#home .main .station_image").css("background-image").indexOf(src)>=0) {
		loggr.log(" > Image already loaded: "+ src);
		return;
	}
	
	// Clear preloader
	if (site.home.stationImagePreloader) {
		site.home.stationImagePreloader.onload = function() {};
	}
	
	site.home.stationImagePreloader = new Image();
	site.home.stationImagePreloader.onload = function() {
		// $("#home .main .station_image").css("background-color","#333");
		$("#home .main .station_image").css("background-image","url('"+ this.src +"')");
		$("#home .main .station_image img").css("opacity",0.0);
		$("#home .main .station_image").css("background-blend-mode","normal");
		$("#home .main .station_image").css("-webkit-background-blend-mode","normal");
	}
	
	if (site.timeouts.handleStationImage) { clearTimeout(site.timeouts.handleStationImage); }
	site.timeouts.handleStationImage = setTimeout(function(){
		// 3fm serious request
		if (station.station_nowplaying.indexOf("NPO 3FM")>-1){
			var seriousrequestImage = "img/station-art/3fmportrait.jpg";
			if ($(window).width()>$(window).height()){
				seriousrequestImage = "img/station-art/3fmlandscape.jpg";
			}
			site.home.stationImagePreloader.src = seriousrequestImage;
			return;
		} else {
			site.home.stationImagePreloader.src = site.helpers.addCachebust(src);
		}
	},1000);
	
	
}

// ---> Overflow menu

site.home.dismissOverflowMenu = function() {
	site.home.overflowMenuIsVisible = false;
	$(".overflow_menu").fadeOut(125);
	$(".overflow_menu").removeClass("active");
}

site.home.toggleOverflowMenu = function() {
	
	loggr.info("site.home.toggleOverflowMenu()");
	
	var visible = site.home.overflowMenuIsVisible;
	
	if (!visible) {
		site.home.overflowMenuIsVisible = true;
		$(".overflow_menu").fadeIn(125);
		$(".overflow_menu").addClass("active");
	} else {
		site.home.overflowMenuIsVisible = false;
		$(".overflow_menu").fadeOut(125);
		$(".overflow_menu").removeClass("active");
	}
	
}

// ---> Send feedback

site.home.sendfeedback = function() {
	
	loggr.info("site.home.sendfeedback()");
	
	// Gather some info
	var info = ""
		+ "Device Info:"
		+"\n\tIdentifier: "+ site.cookies.get("device_id")
		+"\n\tModel: "+ device.model
		+"\n\tPlatform: "+ device.platform +", "+ device.version
		+"\n\tCordova: "+ device.cordova;
	info += "\nApp version: "+ site.cfg.app_version;
	
	// Upload log..
	loggr.upload();
	
	// Send mail intent
	var extras = {};
	extras[window.plugins.webintent.EXTRA_EMAIL] = "droidapps@rejh.nl";
	extras[window.plugins.webintent.EXTRA_SUBJECT] = "Icerrr Feedback";
	extras[window.plugins.webintent.EXTRA_TEXT] = info +"\n\n-- Please type below this line:\n\n";
	
	var params = {
		action: window.plugins.webintent.ACTION_SEND,
		type: 'text/plain',
		extras: extras
	}
	
	window.plugins.webintent.startActivity(params,function(){},function(){ alert("An error occured");});
	
	
}

// ---> View log
	
site.home.viewlog = function() {
	
	loggr.info("site.home.viewLog()");
	
	var loghtml = loggr.gethtml(128) +"<p>&nbsp;</p>";
	
	site.ui.gotosection("#viewlog");
	
	setTimeout(function(){
	
		$("#viewlog .main .block.content").html(loghtml);
		
	},500);
	
}



















