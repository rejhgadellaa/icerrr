
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
	$("#home .main .station_image img").on("load",
		function(evt) { // TODO: detect transparent images..
			var img = $("#home .main .station_image img")[0];
			var color = site.helpers.getImgAvgColor(img,0,0,2,2);
			if (color[3]<1.0) {
				color = [255,255,255,1.0];
			} else {
				//var colorThief = new ColorThief();
				//var color = colorThief.getColor(img);
			}
			$("#home .main .station_image_wrap").css("background-color","rgba("+color[0]+","+color[1]+","+color[2]+","+color[3]+")");
		}
	);
	
	// image
	var station_image_url = (!station.station_image_local) ? site.cfg.urls.webapp +"rgt/rgt.php?w=512&h=512&src="+ station.station_icon : site.helpers.getImageLocally($("#home .main .station_image img")[0], site.cfg.paths.images, station.station_icon, station.station_icon, null, null); 
	$("#home .main .station_image img").on("error",
		function(evt) {
			if ($("#home .main .station_image img").attr("src")!=station_image_url) {
				$("#home .main .station_image img").attr("src",station_image_url);
			} else {
				$("#home .main .station_image img").attr("src","img/web_hi_res_512_001.png?");
			}
			
		}
	);
	
	// extra ui
	$("#home .main .station_image img").attr("src",site.session.currentstation.station_icon);
	$("#home .main .station_name").html(site.session.currentstation.station_name);
	$("#home .main .station_nowplaying").html("Now playing: ...");
	$("#home .main").css("background","rgba(0,0,0,0)");
	
	$("#home .main .station_image img").on("error",function(evt) {
		loggr.warn(" > !onload: "+ evt.originalEvent.target.src);
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
			site.cast.loadMedia();
		}
	} else {
		loggr.log(" > Toggle mediaplayer");
		site.mp.playToggle();
	}
	
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
		$(".button.center img").attr("src","img/icons-96/ic_stop_w.png");
	} else if (site.mp.mpstatus==Media.MEDIA_STARTING && !$(".button.center").hasClass("busy")) {
		$(".button.center").removeClass("active"); 
		$(".button.center").addClass("busy"); 
	} else if (site.mp.mpstatus!=Media.MEDIA_RUNNING && $(".button.center").hasClass("active")) {
		loggr.log(" > .button.center removeclass active");
		$(".button.center").removeClass("active"); 
		$(".button.center").removeClass("busy"); 
		$(".button.center img").attr("src","img/icons-96/ic_play_w.png");
		loggr.log(" >> "+ $(".button.center").attr("class"));
	} else if (site.mp.mpstatus==Media.MEDIA_NONE) {
		$(".button.center").removeClass("active"); 
		$(".button.center").removeClass("busy"); 
		$(".button.center img").attr("src","img/icons-96/ic_play_w.png");
	}
	
	// When paused, stop updates...
	if (site.session.isPaused) {
		site.home.stop_ui_updates();
	}
	
}

site.home.run_station_updates = function() {
	
	//loggr.log("site.home.run_station_updates()");
	
	if (site.session.currentstation.dirble_id) {
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
				$("#home .main .station_image img").attr("src",site.session.currentstation.station_icon);
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
				// site.session.currentstation.station_name = site.helpers.capitalize(data["data"]["icy-name"]); // <- dont set it, keep the json value
				site.session.currentstation.station_nowplaying = "Now playing: Unknown";
				$("#home .main .station_image img").attr("src",site.session.currentstation.station_icon);
			} else {
				try {
				// if (data["data"]["icy-name"]) { site.session.currentstation.station_name = site.helpers.capitalize(data["data"]["icy-name"]); }
				site.session.currentstation.station_nowplaying = site.helpers.capitalize(data["data"]["songhistory"][0].info.name,1) +" - "+ site.helpers.capitalize(data["data"]["songhistory"][0].info.title,1);
				} catch(e) { 
					site.session.currentstation.station_nowplaying = "Now playing: Unknown"; 
					$("#home .main .station_image img").attr("src",site.session.currentstation.station_icon);
				}
			}
			$("#home .main .station_name").html(site.session.currentstation.station_name);
			$("#home .main .station_nowplaying").html(site.session.currentstation.station_nowplaying);
			try {
				if (data["data"]["songhistory"][0].info.image) {
					$("#home .main .station_image img").attr("src",data["data"]["songhistory"][0].info.image);
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
	
	// Get station
	var station = site.session.currentstation;
	
	// Check now playing
	if (station.station_nowplaying=="Now playing: Unknown") {
		$("#home .main .station_image img").attr("src",site.session.currentstation.station_icon);
		return;
	}
	
	// Prep data || TODO: need more info, 'radio 1' returns image for bbc radio 1
	var searchstring = ""
		+ "\""+ station.station_nowplaying +"\" "
		+ "album art";
	
	var opts = {
		maxresults:4
	}
	
	if (google) { if (google.search) { if (google.search.ImageSearch) {
		opts.restrictions = [
			[google.search.ImageSearch.RESTRICT_IMAGESIZE, google.search.ImageSearch.IMAGESIZE_MEDIUM]
		];
	}}}
	
	site.helpers.googleImageSearch(searchstring,
		function(results) {
			// pick an image
			var result = results[0];
			$("#home .main .station_image img").attr("src",result.url);
		},
		function() {
			$("#home .main .station_image img").attr("src",site.session.currentstation.station_icon);
		},
		opts
	);
	
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



















