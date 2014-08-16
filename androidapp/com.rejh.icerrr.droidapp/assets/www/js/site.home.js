
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// HOME

site.home = {};

// ---> Init

site.home.init = function() {
	
	console.log("site.home.init();");
	
	// Check if station has been selected
	if (!site.session.currentstation_id) {
		console.log(site.session.currentstation_id);
		site.ui.showtoast("Please choose a station");
		site.chlist.init();
		return; // <- important
	}
	
	// Get station
	var station = site.session.currentstation;
	
	// Clear lifecycle history || TODO: NOTE: IMPORTANT: always do 'clear_section_history()' before 'gotosection()'...
	site.lifecycle.clear_section_history();
	
	// --> Do something...

	// player
	if (!site.mp.mp) {
		site.mp.init();
	}
	
	// goto section
	site.ui.gotosection("#home");
	
	// ui updates
	site.home.init_ui_updates();
	
	// bla
	$("#home .main .station_image img").on("load",
		function(evt) {
			$("#home .main .station_image img").attr("src",site.session.currentstation.station_icon);
		}
	);
	$("#home .main .station_image img").on("error",
		function(evt) {
			$("#home .main .station_image img").attr("src",site.session.currentstation.station_icon);
		}
	);
	
	// extra ui
	$("#home .main .station_image img").attr("src","img/web_hi_res_512_001.png?c="+(new Date().getTime()));
	$("#home .main .station_name").html(site.session.currentstation.station_name);
	$("#home .main .station_nowplaying").html("Now playing: ...");
	
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
	site.session.ui_pause_callbacks.push(site.home.onpause);
	site.session.ui_resume_callbacks.push(site.home.onresume);
	
}

// PAUSE RESUME
// - Important stuff: this is function that will be called whenever site.ui.gotosection is called

site.home.onpause = function() {
	console.log("site.home.onpause()");
	site.home.stop_ui_updates();
}

site.home.onresume = function() {
	console.log("site.home.site.home.()");
	site.home.init_ui_updates();
}

// ---> UI stuff

// Ui updater

site.home.init_ui_updates = function() {
	
	console.log("site.home.init_ui_updates()");
	
	if (site.timeouts.home_ui_timeout) { clearTimeout(site.timeouts.home_ui_timeout); }
	site.timeouts.home_ui_timeout = setTimeout(function(){site.home.run_ui_updates()},1000);
	
	if (site.timeouts.home_station_timeout) { clearTimeout(site.timeouts.home_station_timeout); }
	site.timeouts.home_station_timeout = setTimeout(function(){site.home.run_station_updates()},1000);
	
}

site.home.stop_ui_updates = function() {
	
	console.log("site.home.stop_ui_updates()");
	
	if (site.timeouts.home_ui_timeout) { clearTimeout(site.timeouts.home_ui_timeout); }
	if (site.timeouts.home_station_timeout) { clearTimeout(site.timeouts.home_station_timeout); }
	
}

site.home.run_ui_updates = function() {
	
	console.log("site.home.run_ui_updates()");
	
	// Home >> Footer >> Play button
	if (site.mp.mpstatus==Media.MEDIA_RUNNING && !$(".button.center").hasClass("active")) {
		console.log(" > .button.center addclass active");
		$(".button.center").removeClass("busy"); 
		$(".button.center").addClass("active"); 
	} else if (site.mp.mpstatus==Media.MEDIA_STARTING && !$(".button.center").hasClass("busy")) {
		$(".button.center").removeClass("active"); 
		$(".button.center").addClass("busy"); 
	} else if (site.mp.mpstatus!=Media.MEDIA_RUNNING && $(".button.center").hasClass("active")) {
		console.log(" > .button.center removeclass active");
		$(".button.center").removeClass("active"); 
		$(".button.center").removeClass("busy"); 
	}
	
	if (site.timeouts.home_ui_timeout) { clearTimeout(site.timeouts.home_ui_timeout); }
	site.timeouts.home_ui_timeout = setTimeout(function(){site.home.run_ui_updates()},1000);
	
}

site.home.run_station_updates = function() {
	
	console.log("site.home.run_station_updates()");
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
			if (!data["data"]["nowplaying"]) { 
				// site.session.currentstation.station_name = site.helpers.capitalize(data["data"]["icy-name"]); // <- dont set it, keep the json value
				site.session.currentstation.station_nowplaying = "Now playing: Unknown";
			
			} else {
				site.session.currentstation.station_name = site.helpers.capitalize(data["data"]["icy-name"]);
				site.session.currentstation.station_nowplaying = data["data"]["nowplaying"];
			}
			$("#home .main .station_name").html(site.session.currentstation.station_name);
			$("#home .main .station_nowplaying").html(site.session.currentstation.station_nowplaying);
		},
		function(error) {
			if (error.message) { site.ui.showtoast(error.message); console.log(error.message); }
			else { console.log(error); }
		}
	);
	
	if (site.timeouts.home_station_timeout) { clearTimeout(site.timeouts.home_station_timeout); }
	site.timeouts.home_station_timeout = setTimeout(function(){site.home.run_station_updates()},1.5*60*1000); // every ~minute
	
}

	
	




















