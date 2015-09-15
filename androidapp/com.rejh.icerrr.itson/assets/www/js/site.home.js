
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// HOME

site.home = {};

// ---> Init

site.home.init = function() {
	
	loggr.debug("------------------------------------");
	loggr.debug("site.home.init();");
	
	// Lalala
	$("#version_string").html("You're currently rocking version "+ site.cfg.app_version);
	
	// Check if station has been selected
	if (!site.session.currentstation_id) {
		loggr.log(site.session.currentstation_id);
		site.ui.showtoast("Please choose a station");
		site.chlist.init();
		return; // <- important
	}
	
	// Get station
	var station = site.session.currentstation;
	
	// Update currentstation...
	if (station) {
		var currentStationIndex = site.helpers.session.getStationIndexById(station.station_id,site.data.stations);
		if (currentStationIndex>=0) {
			site.session.currentstation = site.data.stations[currentStationIndex];
			station = site.session.currentstation;
		}
	}
	
	// Update starred stations data
	if (site.session.starred) {
		for (var i=0; i<site.session.starred.length; i++) {
			var index = site.helpers.session.getStationIndexById(site.session.starred[i].station_id,site.data.stations);
			if (index>=0) {
				site.session.starred[i] = site.data.stations[index];
			}
			
		}
	}
	
	// Clear lifecycle history || TODO: NOTE: IMPORTANT: always do 'clear_section_history()' before 'gotosection()'...
	site.lifecycle.clear_section_history();
	
	// --> Do something...
	
	// goto section
	site.ui.gotosection("#home");

	// player
	site.mp.init();
	
	// ui updates
	site.home.init_ui_updates();
	
	// Pre-handle some image/settings related stuff
	if (site.cookies.get("setting_showStationIcon")!=1) {
		$("#home .main .station_image img").css("opacity",0.0);
		$("#home .main .station_image img")[0].src = "img/web_hi_res_512_002.jpg";
	}
	if (site.cookies.get("setting_showAlbumArt")!=1) {
		site.home.loadAlbumArt('img/bg_home_default.jpg');
	}
	
	// Onload/error events for .station_image
	$("#home .main .station_image img").off("load");
	$("#home .main .station_image img").off("error");
	$("#home .main .station_image img").on("load",
		function(evt) { // TODO: detect transparent images..
			console.log(" > Loaded: '.station_image img'");
			var img = $("#home .main .station_image img")[0];
			var color = site.helpers.getImgAvgColor(img,0,0,2,2);
			var colorIcon;
			if (color[3]<1.0 || color[0]>=250 && color[1]>=250 && color[2]>=250) {
				color = [51,51,51,1.0];
				colorIcon = [255,255,255,1]
			} else {
				//var colorThief = new ColorThief(); // TODO: DEPRECATED
				//var color = colorThief.getColor(img);
			}
			//$("#home .main .station_image").css("background-color","rgba("+color[0]+","+color[1]+","+color[2]+","+color[3]+")"); // TODO: DEPRECATED
			//$("#home .main .station_image").css("-webkit-background-blend-mode","multiply");
			//$("#home .main .station_image").css("background-blend-mode","multiply");
			site.home.loadAlbumArt('img/bg_home_default.jpg');
			if (colorIcon) { 
				if (!$("#home .main .station_image img").hasClass("shadow_z2")) { $("#home .main .station_image img").addClass("shadow_z2"); }
				$("#home .main .station_image img").css("background-color","rgba("+colorIcon[0]+","+colorIcon[1]+","+colorIcon[2]+","+colorIcon[3]+")");
			}
			else { 
				if ($("#home .main .station_image img").hasClass("shadow_z2")) { $("#home .main .station_image img").removeClass("shadow_z2"); }
				$("#home .main .station_image img").css("background-color","rgba("+color[0]+","+color[1]+","+color[2]+","+color[3]+")");
			}
			if (site.cookies.get("setting_showStationIcon")!=0) {
				$("#home .main .station_image img").css("opacity",1.0);
			}
		}
	);
	$("#home .main .station_image img").on("error",function(evt) {
		loggr.error(" > Error loading image: "+evt.currentTarget.src,{dontupload:true});
		evt.currentTarget.src = "img/web_hi_res_512_002.jpg";
	});
	
	// UI: load .station_image
	if (site.home.lastStationId!=site.session.currentstation.station_id) {
		site.home.handleStationImage(site.session.currentstation.station_icon);
	}
	// UI: Set text and such
	site.home.lastStationId = site.session.currentstation.station_id;
	$("#home .main .station_name").html(site.session.currentstation.station_name);
	$("#home .main .station_nowplaying").html("Now playing: ...");
	$("#home .main").css("background","rgba(0,0,0,0)");
	
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
	
	// Save to mediastreamer
	station.station_port = ""+station.station_port;
	loggr.log(" > Store as default_station for MediaStreamer plugin");
	window.mediaStreamer.setting("string","default_station",JSON.stringify(station),function(res){loggr.log(" > Stored: "+ res);},function(error){loggr.error(error);});
	
	// Alarm dialog?
	loggr.log(" > site.session.alarmActive: "+ site.session.alarmActive,{dontupload:true});
	if (site.session.alarmActive) {
		loggr.log(" > Alarm detected, show dialog + alarmUpdateTime()");
		$("#home .alarm_dialog").fadeIn(500);
		// site.home.alarmUpdateTime();
	}
	site.home.alarmUpdateTime();
	
	// Alarm snoozed?
	if (site.mp.isPlaying && site.session.snoozeAlarm) {
		loggr.log(" > Cancel snoozed alarm(s)");
		//site.home.alarmSnoozeCancel(); // TODO: DEPRECATED
	}
	
}

// PAUSE RESUME
// - Important stuff: this is function that will be called whenever site.ui.gotosection is called

site.home.onpause = function() {
	loggr.debug("site.home.onpause()");
	site.home.stop_ui_updates();
}

site.home.onresume = function() {
	loggr.debug("site.home.onresume()");
	site.home.init_ui_updates();
	site.home.alarmUpdateTime();
}

// ---> Media: play, stop

site.home.mpPlayToggle = function() {
	
	loggr.debug("site.home.mpPlayToggle()");
	
	// Limit button presses to 1 per .. second?
	// If user start bashing let him through..
	if (site.vars.mpPlayToggleBusy) {
		site.vars.mpPlayToggleBusy = false;
		return false;
	}
	
	site.vars.mpPlayToggleBusy = true;
	setTimeout(function(){ site.vars.mpPlayToggleBusy = false; },1250);
	
	// Chromecast.. lot's of stuff and checking..
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
	// MediaPlayer :D
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
	
	loggr.debug("site.home.init_ui_updates()");
	
	if (site.loops.home_ui_timeout) { clearInterval(site.loops.home_ui_timeout); }
	site.loops.home_ui_timeout = setInterval(function(){site.home.run_ui_updates()},1000);
	site.home.run_ui_updates(); // run once because interval will only fire after xxx sec
	
	if (site.loops.home_station_timeout) { clearInterval(site.loops.home_station_timeout); }
	site.loops.home_station_timeout = setInterval(function(){site.home.run_station_updates()},(60*1000)*1.5); // ~every minute
	site.home.run_station_updates(); // run once because interval will only fire after xxx sec
	
}

site.home.stop_ui_updates = function() {
	
	loggr.debug("site.home.stop_ui_updates()");
	
	if (site.loops.home_ui_timeout) { clearInterval(site.loops.home_ui_timeout); }
	if (site.loops.home_station_timeout) { clearInterval(site.loops.home_station_timeout); }
	
}

site.home.run_ui_updates = function() {
	
	//loggr.log("site.home.run_ui_updates()");
	
	// Home >> Footer >> Play button
	if (!site.cast.session) {
		
		// -> MediaPlayer
		
		if (site.mp.mpstatus==Media.MEDIA_RUNNING && !$(".button.center").hasClass("active")) {
			//loggr.log(" > Media.MEDIA_RUNNING > .active");
			$(".button.center").removeClass("busy"); 
			$(".button.center").addClass("active"); 
			$(".button_play_bufferAnim").fadeOut(250);
			$(".button.center img").attr("src","img/icons-96/ic_stop_w.png");
		} else if (site.mp.mpstatus==Media.MEDIA_STARTING) {
			//loggr.log(" > Media.MEDIA_STARTING > .busy");
			$(".button.center").removeClass("active"); 
			$(".button.center").removeClass("busy");
			$(".button.center").addClass("busy");
			$(".button_play_bufferAnim").fadeIn(500);
			$(".button.center img").attr("src","img/icons-96/ic_stop_w.png");
		} else if (site.mp.mpstatus==Media.MEDIA_PAUSED && !$(".button.center").hasClass("busy")) {
			//loggr.log(" > Media.MEDIA_PAUSED > .busy");
			$(".button.center").removeClass("active"); 
			$(".button.center").addClass("busy");
			$(".button_play_bufferAnim").fadeOut(250);
			$(".button.center img").attr("src","img/icons-96/ic_stop_w.png");
		} else if (site.mp.mpstatus!=Media.MEDIA_RUNNING && $(".button.center").hasClass("active")) {
			//loggr.log(" > Media.MEDIA_RUNNING > .active");
			$(".button.center").removeClass("active"); 
			$(".button.center").removeClass("busy"); 
			$(".button_play_bufferAnim").fadeOut(250);
			$(".button.center img").attr("src","img/icons-96/ic_play_w.png");
		} else if (site.mp.mpstatus==Media.MEDIA_NONE) {
			//loggr.log(" > Media.MEDIA_NONE > ...");
			$(".button.center").removeClass("active"); 
			$(".button.center").removeClass("busy"); 
			$(".button_play_bufferAnim").fadeOut(250);
			$(".button.center img").attr("src","img/icons-96/ic_play_w.png");
		}
		
	} else {
		
		// -> ChromeCast
		
		if (!site.cast.media) {
			$(".button.center").removeClass("active"); 
			$(".button.center").removeClass("busy");
			$(".button.center").addClass("busy");
			$(".button_play_bufferAnim").fadeIn(500);
			$(".button.center img").attr("src","img/icons-96/ic_stop_w.png");
		} else {
			$(".button.center").removeClass("busy"); 
			$(".button.center").addClass("active"); 
			$(".button_play_bufferAnim").fadeOut(250);
			$(".button.center img").attr("src","img/icons-96/ic_stop_w.png");
		}
		
	}
	
	// When paused, stop updates...
	if (site.session.isPaused) {
		site.home.stop_ui_updates();
	}
	
}

site.home.run_station_updates = function() {
	
	loggr.debug("site.home.run_station_updates()");
	
	//loggr.warn(" > Current album art image: "+ $("#home .main .station_image").css("background-image"),{dontsave:true});
	
	site.ui.showLoadbar();
	
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
			} else if (data["data"]["nowplaying"].trim()=="-" || data["data"]["nowplaying"]==" - ") {
				site.session.currentstation.station_nowplaying = "Now playing: Unknown";
				site.home.handleStationImage(site.session.currentstation.station_icon);
			} else {
				// if (data["data"]["icy-name"]) { site.session.currentstation.station_name = site.helpers.capitalize(data["data"]["icy-name"]); }
				if (data["data"]["nowplaying"].indexOf("&")>0) { data["data"]["nowplaying"] = data["data"]["nowplaying"].split("&").join(" & "); }
				site.session.currentstation.station_nowplaying = data["data"]["nowplaying"];
				site.home.getAlbumArt();
			}
			$("#home .main .station_name").html(site.session.currentstation.station_name);
			$("#home .main .station_nowplaying").html(site.session.currentstation.station_nowplaying);
			
			// Cast
			if (site.cast.session && site.cast.media) {
				// TODO: DEPRECATED
				// urn:x-cast:com.google.cast.media.
				// site.cast.session.sendMessage("","urn:x-cast:com.google.cast.media.Image
				// site.cast.updateMetadata();
			}
		},
		function(error) {
			if (error.message) { site.ui.showtoast(error.message); loggr.warn(error.message); }
			else { loggr.log(error); }
			site.ui.hideLoadbar();
		}
	);
	
	// When paused, stop updates...
	if (site.session.isPaused) {
		site.home.stop_ui_updates();
		site.ui.hideLoadbar();
	}
	
	if (site.mp.serviceRunning) {
		site.mp.notif();
	}
	
}

// ---> Dirble nowplaying

site.home.useDirbleNowPlaying = function() {
	
	loggr.debug("site.home.useDirbleNowPlaying()");
	
	// TODO
	// DEPRECATED
	// DUPLICATE?
	
}

// ---> Get Album Art + Handle Art

site.home.getAlbumArt = function() {
	
	loggr.debug("site.home.getAlbumArt()");
	
	// Statio  icon?
	if (site.cookies.get("setting_showStationIcon")==0) {
		$("#home .main .station_image img").css("opacity",0.0);
	} else {
		// ..
	}
	
	// Album art?
	if (site.cookies.get("setting_showAlbumArt")!=1) {
		loggr.log(" > Disabled. Return.");
		if (site.cookies.get("setting_showStationIcon")!=0) {
			$("#home .main .station_image img").css("opacity",1.0);
		}
		site.home.loadAlbumArt('img/bg_home_default.jpg');
		site.home.handleStationImage(site.session.currentstation.station_icon);
		return;
	}
	
	// Get station
	var station = site.session.currentstation;
	
	// Check now playing
	if (station.station_nowplaying=="Now playing: Unknown") {
		site.home.handleStationImage(site.session.currentstation.station_icon);
		return;
	}
	
	// Check pre-programmed stuff..
	switch (station.station_nowplaying.toLowerCase().trim()) {
		
		case "npo 3fm - dit is domien - bnn":
			var imgurl = "http://www.3fm.nl/data/thumb/abc_media_image/127000/127177/w718.8f717_247a48f9097302b0af5964b6310fb44f.jpg";
			//imgurl = site.session.currentstation.station_icon;
			site.home.handleStationImage(imgurl);
			return;
			
		case "npo 3fm - giel - vara":
			var imgurl = "http://media.nu.nl/m/m1mx5raa5fnk_wd1280.jpg/giel-beelen-wil-altijd-morning-man-blijven.jpg";
			// imgurl = site.session.currentstation.station_icon;
			site.home.handleStationImage(imgurl);
			return;
			
		case "npo 3fm - metmichiel - ntr":
			var imgurl = "http://images.poms.omroep.nl/image/109268.png";
			// imgurl = site.session.currentstation.station_icon;
			site.home.handleStationImage(imgurl);
			return;
			
		case "npo 3fm - superrradio - bnn":
			var imgurl = "http://www.3fm.nl/data/thumb/abc_media_image/126000/126705/w718.8f717_0e7cae38010a3c69970536c7ed3aa6b8.jpg";
			// imgurl = site.session.currentstation.station_icon;
			site.home.handleStationImage(imgurl);
			return;
			
		case "npo 3fm - rabradio - kro-ncrv":
			var imgurl = "http://statischecontent.nl/img/etalage/01b89c2f-3b21-43a1-b392-d64bb6df49e8.jpg";
			// imgurl = site.session.currentstation.station_icon;
			site.home.handleStationImage(imgurl);
			return;
		
		case "":
			var imgurl = "";
			imgurl = site.session.currentstation.station_icon;
			site.home.handleStationImage();
			return;
		
	}
	
	// Prep data || TODO: need more info, 'radio 1' returns image for bbc radio 1
	var searchstring = ""
		+ ""+ station.station_nowplaying.toLowerCase()
	//	+ " album art";
	searchstring = searchstring.split("-").join("");
	
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
			site.home.handleStationImage(decodeURIComponent(result.url));
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
	
	site.ui.showLoadbar();
		
	var station = site.session.currentstation;
	
	// Icon or album art..
	if (src == site.session.currentstation.station_icon) {
		// icon
		
		loggr.log(" > It's an icon!");
		
		if (site.cookies.get("setting_showStationIcon")!=1) {
			loggr.log(" > !setting_showStationIcon: "+ site.cookies.get("setting_showStationIcon"));
			$("#home .main .station_image img").css("opacity",0.0);
			site.home.loadAlbumArt('img/bg_home_default.jpg');
			site.ui.hideLoadbar();
			return;
		}
		
		var station = site.session.currentstation;
		
		// check if _image is available
		var station_imagery_url = station.station_icon;
		if (station.station_image) {
			station_imagery_url = station.station_image;
		}
		
		if (site.helpers.shouldDownloadImage(station.station_image_local,station_imagery_url)) {
			var filename = site.helpers.imageUrlToFilename(station_imagery_url,"station_image_"+station.station_name.split(" ").join("-").toLowerCase(),false);
			site.helpers.downloadImage($("#home .main .station_image img")[0], filename, station_imagery_url,
				function(fileEntry,imgobj) {
					var stationIndex = site.helpers.session.getStationIndexById(station.station_id);
					loggr.log(" > DL "+ stationIndex +", "+ fileEntry.fullPath);
					site.data.stations[stationIndex].station_image_local = fileEntry.fullPath;
					site.data.stations[stationIndex].station_edited["station_image_local"] = new Date().getTime();
					site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json");
				},
				function(error) {
					loggr.error(" > Error downloading '"+ station_imagery_url +"'",{dontupload:true});
					console.error(error);
					$("#home .main .station_image img").attr("src","img/web_hi_res_512_002.jpg");
				}
			);
		} else {
			$("#home .main .station_image img").attr("src",station.station_image_local+"?c="+ new Date().getTime());
		}
		
		// $("#home .main .station_image img").attr("src",site.helpers.addCachebust(src));
		site.ui.hideLoadbar();
		return;
		
	} 
	// Album art
	else {
	
		// Check if image already loaded..
		if ($("#home .main .station_image").css("background-image").indexOf(src)>=0) {
			loggr.log(" > Image already loaded: "+ src);
			site.ui.hideLoadbar();
			return;
		}
		
		// Clear preloader
		if (site.home.stationImagePreloader) {
			site.home.stationImagePreloader.onload = function() {};
		}
		
		// (re) set timeout 1 second and do stuff
		if (site.timeouts.handleStationImage) { clearTimeout(site.timeouts.handleStationImage); }
		site.timeouts.handleStationImage = setTimeout(function(){
															   
			site.ui.showLoadbar();
			
			if (site.helpers.shouldDownloadImage(src)) {
				
				// Nowplaying
				var nowplaying = site.helpers.stripIllChars(station.station_nowplaying);
				
				// Filename..
				var filename = site.helpers.imageUrlToFilename(src,
					"station_art_"+
					nowplaying.split(" ").join("-")+"_"+
					station.station_name.split(" ").join("-").toLowerCase(),
					false,true);
				
				// Check if file already exists..
				site.storage.getFileEntry(site.cfg.paths.images, filename,
					function(fileEntry) { // exists
						site.home.loadAlbumArt(fileEntry.fullPath);
						site.ui.hideLoadbar();
					},
					function(err) { // dont exist
						site.helpers.downloadImage(null, filename, src,
							function(fileEntry,imgobj) {
								site.home.loadAlbumArt(fileEntry.fullPath);
								site.ui.hideLoadbar();
							},
							function(error) {
								loggr.error(" > Error downloading '"+ src +"'",{dontupload:true});
								console.error(error);
								site.home.loadAlbumArt('img/bg_home_default.jpg');
								site.ui.hideLoadbar();
							}
						);
					}
				);
				
			}
		
		},1000);
	
	}
	
}

site.home.loadAlbumArt = function(localpath) {
	
	// Note: should only load files that have been downloaded to local storage!
	
	if (!site.vars.currentAlbumArtPath) {
		site.vars.currentAlbumArtPath = "";
	}
	
	loggr.debug("site.home.loadAlbumArt()");
	loggr.log(" > "+ localpath);
	
	// Check
	if (!localpath) { 
		loggr.log(" > 'localpath' is undefined or false?!");
	}
	if (localpath.indexOf("http")==0) {
		loggr.error(" > 'localpath' is an url! -> "+ localpath);
	}
	
	// Check if already loaded..
	//loggr.log(" > "+ site.vars.currentAlbumArtPath); // TODO: Remove
	//loggr.log(" > "+ localpath); // TODO: Remove
	if (site.vars.currentAlbumArtPath == localpath) {
		loggr.log(" -> Image already loaded. Return.");
		return; // <- :)
	}
	site.vars.currentAlbumArtPath = localpath;
	
	// Load it :D
	var img = new Image();
	img.onerror = function(e){
		loggr.warn("site.home.loadAlbumArt().OnError: "+ this.src +", "+ e,{dontsave:true});
		$("#home .main .station_image").css("background-image","url('img/bg_home_default.jpg')");
		$("#home .main .station_image img").css("opacity",1.0);
		site.vars.currentAlbumArtPath = 'img/bg_home_default.jpg'; // onerror: re-set currentAlbumArtPath to reflect backup
	}
	img.onload = function(){
		loggr.log("site.home.loadAlbumArt().OnLoad: "+ this.src);
		$("#home .main .station_image").css("background-image","url('"+ this.src +"')");
		if (this.src.indexOf('img/bg_home_default.jpg')<0) {
			$("#home .main .station_image img").css("opacity",0.0);
			//$("#home .main .station_image").css("background-blend-mode","normal"); // TODO: DEPRECATED
			//$("#home .main .station_image").css("-webkit-background-blend-mode","normal");
		} else {
			$("#home .main .station_image img").css("opacity",1.0);
		}
		
	}
	img.src = localpath;
	
}

// ---> Overflow menu

site.home.toggleOverflowMenu = function() {
	
	loggr.debug("site.home.toggleOverflowMenu()");
	
	var visible = site.home.overflowMenuIsVisible;
	
	if (!visible) {
		site.home.overflowMenuIsVisible = true;
		$(".overflow_menu").css("display","block");
		//$(".overflow_menu").fadeIn(125);
		$(".overflow_menu").addClass("active");
	} else {
		site.home.overflowMenuIsVisible = false;
		$(".overflow_menu").css("display","none");
		//$(".overflow_menu").fadeOut(125);
		$(".overflow_menu").removeClass("active");
	}
	
}

site.home.dismissOverflowMenu = function() {
	site.home.overflowMenuIsVisible = false;
	$(".overflow_menu").css("display","none");
	//$(".overflow_menu").fadeOut(125);
	$(".overflow_menu").removeClass("active");
}

// ---> Send feedback

site.home.sendfeedback = function() {
	
	loggr.debug("site.home.sendfeedback()");
	
	// Gather some info
	var info = ""
		+ "Device Info:"
		+"\n\tIdentifier: "+ site.cookies.get("device_id")
		+"\n\tModel: "+ device.model
		+"\n\tPlatform: "+ device.platform +", "+ device.version
		+"\n\tCordova: "+ device.cordova;
	info += "\nApp version: "+ site.cfg.app_version;
	
	// Upload log..
	loggr.upload(false,true);
	
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
	
	loggr.debug("site.home.viewLog()");
	
	var loghtml = loggr.gethtml(128) +"<p>&nbsp;</p>";
	
	site.ui.gotosection("#viewlog");
	
	setTimeout(function(){
	
		$("#viewlog .main .block.content").html(loghtml);
		
	},500);
	
}

// ---> Alarm dialog

site.home.alarmUpdateTime = function(alsoCheckIsAlarm) {
	
	loggr.debug("site.home.alarmUpdateTime()");
	
	if (!site.session.alarmActiveRetries) { site.session.alarmActiveRetries = 0; }
	
	// 
	window.mediaStreamer.getSetting("bool","isAlarm",
		function(res) {
			
			// Changes?
			if (site.session.alarmActive != (res) ? true : false) {
				loggr.log(" -> window.mediaStreamer.getSetting(bool,isAlarm).Result_change: "+ res);
				site.session.alarmActive = (res) ? true : false;
				site.session.alarmActiveRetries = 0;
			}
			
			// Alarm active..
			if (site.session.alarmActive) {
				//  && site.mp.mpstatus!=Media.MEDIA_NONE
							
				var date = new Date();
				var hour = site.helpers.formatNum(date.getHours());
				var minute = site.helpers.formatNum(date.getMinutes());
				
				$("#home .alarm_dialog .time").html(hour +":"+ minute);
				
				if ($("#home .alarm_dialog").css("display")!="block") {
					$("#home .alarm_dialog").fadeIn(500);
				}
			
				
			// No alarm active..
			} else {
				
				loggr.log(" > !site.session.alarmActive");
				
				site.session.alarmActive = false;
				if ($("#home .alarm_dialog").css("display")=="block") {
					$("#home .alarm_dialog").fadeOut(500);
				}
				
			}
			
		},
		function(err) {
			loggr.error(" -> window.mediaStreamer.getSetting(bool,isAlarm).Failed: "+err);
			site.session.alarmActive = false;
		}
	);
	
	// Calc timeout
	var timeout_ms = 2.5*1000;
	if (!site.session.alarmActive) {
		if (site.session.alarmActiveRetries<4) {
			site.session.alarmActiveRetries++;
			// timeout_ms = timeout_ms;
		} else {
			timeout_ms = 10*1000;
		}
	} else {
	}
	
	// Re-set timeout
	loggr.log(" > alarmUpdateTime timeout: "+ timeout_ms +", "+ site.session.alarmActiveRetries);
	if (site.timeouts.alarmUpdateTimeTimeout) { clearTimeout(site.timeouts.alarmUpdateTimeTimeout); }
	site.timeouts.alarmUpdateTimeTimeout = setTimeout(function(){
		site.home.alarmUpdateTime(true);
	},timeout_ms);
	
}

site.home.alarmSnooze = function() {
	
	loggr.debug("site.home.alarmSnooze()");
	
	// Stop playback
	loggr.log(" > Stop playback..");
	site.mp.stop();
	
	// Alarm active ==> false
	site.session.alarmActive = false;
	
	// Set tmp alarm 10 minutes in future..
	var id = site.helpers.getUniqueID();
	var alarm_id = site.alarms.getUniqueAlarmID();
	var date = new Date();
		date.setMinutes(date.getMinutes()+10)
	var hour = date.getHours();
	var minute = date.getMinutes();
	var alarmCfg = {
		id: id,
		alarm_id: alarm_id,
		timeMillis: site.alarms.getAlarmDate(hour,minute).getTime(),
		hour: hour,
		minute: minute,
		volume: 7,
		repeat: false,
		repeatCfg: [0,0,0,0,0,0,0],
		station: site.session.currentstation
	};
	
	// Store
	site.session.snoozeAlarm = alarmCfg;
	site.helpers.storeSession();
	
	// Set
	site.alarms.setAlarm(alarm_id,alarmCfg);
	
	// Hide dialog
	$("#home .alarm_dialog").fadeOut(500);
	
	// Notif..
	var notif = {};
	notif.id = site.cfg.notifs.notifID_snoozed;
	notif.title = "Icerrr: "+ site.session.currentstation.station_name;
	notif.message = "Alarm snoozed until: "+ site.helpers.formatNum(hour) +":"+ site.helpers.formatNum(minute);
	notif.smallicon = "ic_stat_av_snooze";
	notif.priority = "MAX"; // HIGH
	notif.ongoing = false;
	notif.color = "#2D6073";
	notif.intent = {
		type:"activity",
		package:"com.rejh.icerrr.itson",
		classname:"com.rejh.icerrr.itson.Icerrr"
	};
	
	// Notif actions
	var action1 = {
		icon:"ic_stat_action_alarm_off",
		title:"DISMISS NOW",
		intent:{
			type:"activity",
			package:"com.rejh.icerrr.itson",
			classname:"com.rejh.icerrr.itson.Icerrr",
			extras:[
				{type:"string", name:"cmd", value:"cancel_snooze"}
			]
		}
	}
	notif.actions = [action1];
	
	// Notif: exec
	window.notifMgr.make(
		function(res){
			loggr.log(" -> Snooze notif OK: "+ res);
		},
		function(err){
			loggr.error("Snooze notif error: "+err);
		},
		notif
	);
	
	site.ui.showtoast("Alarm snoozed until: "+ site.helpers.formatNum(hour) +":"+ site.helpers.formatNum(minute) +" <span style='float:right; color:#D0D102; pointer-events:auto;' onclick='site.home.alarmSnoozeCancel();'>CANCEL</span>",5);
	
}

site.home.alarmSnoozeCancel = function(notByUser) {
	
	loggr.debug("site.home.alarmSnoozeCancel()");
	
	if (site.session.snoozeAlarm) {
		if (!site.alarms) { site.alarms = {}; }
		site.alarms.newAlarmCfg = site.session.snoozeAlarm;
		site.alarms.remove(true);
		// site.ui.showtoast("Snooze canceled");
		if (!notByUser) {
			site.ui.showtoast("Snooze canceled <span style='float:right; color:#D0D102; pointer-events:auto;' onclick='site.home.alarmSnooze();'>RE-SET</span>",5);
		}
	} else {
		loggr.error(" > No alarm snoozed? => !site.vars.snoozeAlarm");
	}
	
	window.notifMgr.cancel(
		function(res){},
		function(err){ alert("alarmSnoozeCancel.notifMgr.cancel Error: "+ e); },
		{id:site.cfg.notifs.notifID_snoozed}
	);
	
	site.session.snoozeAlarm = null;
	site.helpers.storeSession();
	
	site.session.alarmActiveRetries = 0;	
	
}

site.home.alarmStop = function() {
	
	loggr.debug("site.home.alarmStop()");
	
	// Stop playback
	loggr.log(" > Stop playback..");
	site.mp.stop();
	
	// Hide dialog
	$("#home .alarm_dialog").fadeOut(500);
	
}

















