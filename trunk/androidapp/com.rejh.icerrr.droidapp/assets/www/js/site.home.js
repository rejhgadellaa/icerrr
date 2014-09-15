
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// HOME

site.home = {};

// ---> Init

site.home.init = function() {
	
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
	
	// bla
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
	$("#home .main .station_image img").on("error",
		function(evt) {
			$("#home .main .station_image img").attr("src","img/web_hi_res_512_001.png?c="+(new Date().getTime()));
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
	if (!site.session.ui_pause_callbacks) { site.session.ui_pause_callbacks = []; }
	if (!site.session.ui_resume_callbacks) { site.session.ui_resume_callbacks = []; }
	if (site.session.ui_pause_callbacks.indexOf(site.home.onpause)<0) { site.session.ui_pause_callbacks.push(site.home.onpause); }
	if (site.session.ui_resume_callbacks.indexOf(site.home.onresume)<0) { site.session.ui_resume_callbacks.push(site.home.onresume); }
	
	// Test: chromecast
	site.cast.setup();
	
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
	
	loggr.info("site.home.mpPlay()");
	
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
					site.cast.media.stop();
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
	
}

// ---> UI stuff

// Ui updater

site.home.init_ui_updates = function() {
	
	loggr.info("site.home.init_ui_updates()");
	
	if (site.timeouts.home_ui_timeout) { clearTimeout(site.timeouts.home_ui_timeout); }
	site.timeouts.home_ui_timeout = setTimeout(function(){site.home.run_ui_updates()},1000);
	
	if (site.timeouts.home_station_timeout) { clearTimeout(site.timeouts.home_station_timeout); }
	site.timeouts.home_station_timeout = setTimeout(function(){site.home.run_station_updates()},1000);
	
}

site.home.stop_ui_updates = function() {
	
	loggr.info("site.home.stop_ui_updates()");
	
	if (site.timeouts.home_ui_timeout) { clearTimeout(site.timeouts.home_ui_timeout); }
	if (site.timeouts.home_station_timeout) { clearTimeout(site.timeouts.home_station_timeout); }
	
}

site.home.run_ui_updates = function() {
	
	//loggr.log("site.home.run_ui_updates()");
	
	// Home >> Footer >> Play button
	if (site.mp.mpstatus==Media.MEDIA_RUNNING && !$(".button.center").hasClass("active")) {
		loggr.log(" > .button.center addclass active");
		$(".button.center").removeClass("busy"); 
		$(".button.center").addClass("active"); 
	} else if (site.mp.mpstatus==Media.MEDIA_STARTING && !$(".button.center").hasClass("busy")) {
		$(".button.center").removeClass("active"); 
		$(".button.center").addClass("busy"); 
	} else if (site.mp.mpstatus!=Media.MEDIA_RUNNING && $(".button.center").hasClass("active")) {
		loggr.log(" > .button.center removeclass active");
		$(".button.center").removeClass("active"); 
		$(".button.center").removeClass("busy"); 
	}
	
	if (site.timeouts.home_ui_timeout) { clearTimeout(site.timeouts.home_ui_timeout); }
	site.timeouts.home_ui_timeout = setTimeout(function(){site.home.run_ui_updates()},2000);
	
}

site.home.run_station_updates = function() {
	
	//loggr.log("site.home.run_station_updates()");
	
	if (site.session.currentstation.dirble_id) {
		//site.home.useDirbleNowPlaying();
		//return;
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
			
			} else {
				// if (data["data"]["icy-name"]) { site.session.currentstation.station_name = site.helpers.capitalize(data["data"]["icy-name"]); }
				site.session.currentstation.station_nowplaying = data["data"]["nowplaying"];
				site.home.getAlbumArt();
			}
			$("#home .main .station_name").html(site.session.currentstation.station_name);
			$("#home .main .station_nowplaying").html(site.session.currentstation.station_nowplaying);
			try { if (site.mp.isPlaying) site.mp.notif(); } catch(e) {}
			
			// Cast
			if (site.cast.session && site.cast.media) {
				// urn:x-cast:com.google.cast.media.
				// site.cast.session.sendMessage("","urn:x-cast:com.google.cast.media.Image
			}
		},
		function(error) {
			if (error.message) { site.ui.showtoast(error.message); loggr.warn(error.message); }
			else { loggr.log(error); }
		}
	);
	
	if (!site.session.isPaused) {
		if (site.timeouts.home_station_timeout) { clearTimeout(site.timeouts.home_station_timeout); }
		site.timeouts.home_station_timeout = setTimeout(function(){site.home.run_station_updates()},1.5*60*1000); // every ~minute
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
			
			} else {
				try {
				// if (data["data"]["icy-name"]) { site.session.currentstation.station_name = site.helpers.capitalize(data["data"]["icy-name"]); }
				site.session.currentstation.station_nowplaying = site.helpers.capitalize(data["data"]["songhistory"][0].info.name,1) +" - "+ site.helpers.capitalize(data["data"]["songhistory"][0].info.title,1);
				} catch(e) { site.session.currentstation.station_nowplaying = "Now playing: Unknown"; }
			}
			$("#home .main .station_name").html(site.session.currentstation.station_name);
			$("#home .main .station_nowplaying").html(site.session.currentstation.station_nowplaying);
			if (data["data"]["songhistory"][0].info.image) {
				// $("#home .main").css("background","url("+data["data"]["songhistory"][0].info.image+")");
			}
		},
		function(error) {
			if (error.message) { site.ui.showtoast(error.message); loggr.log(error.message); }
			else { loggr.log(error); }
		}
	);
	
	if (!site.session.isPaused) {
		if (site.timeouts.home_station_timeout) { clearTimeout(site.timeouts.home_station_timeout); }
		site.timeouts.home_station_timeout = setTimeout(function(){site.home.run_station_updates()},1.5*60*1000); // every ~minute
	}
	
}

site.home.getAlbumArt = function() {
	
	loggr.info("site.home.getAlbumArt()");
	
	// Get station
	var station = site.session.currentstation;
	
	// Prep data || TODO: need more info, 'radio 1' returns image for bbc radio 1
	var searchstring = ""
		+ "\""+ station.station_nowplaying +"\" "
		+ "album art";
	
	var opts = {
		restrictions:[
			[google.search.ImageSearch.RESTRICT_IMAGESIZE, google.search.ImageSearch.IMAGESIZE_MEDIUM]
		],
		maxresults:4
	}
	
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
	




















