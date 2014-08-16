
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL EDIT

site.chedit = {};

// ---> Init

site.chedit.init = function(station_id_to_edit) {
	
	console.log("site.chedit.init()");
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#editstation");
	
	// Show UI
	site.ui.gotosection("#editstation");
	
	// Magic || TODO: move to function
	$("#editstation input[name='station_url']")[0].onchange = function(evt) {
		if (!$("#editstation input[name='station_name']")[0].value) {
			site.chedit.check(true,true);
		}
	}
	
}

// PAUSE RESUME
// - Important stuff: this is function that will be called whenever site.ui.gotosection is called

site.chedit.onpause = function() {
	console.log("site.chedit.onpause()");
	// not needed now
}

site.chedit.onresume = function() {
	console.log("site.chedit.site.home.()");
	// not needed now
}

// ---> Check

// Check
// - Checks fields

site.chedit.check = function(findStationName) {

	console.log("site.chedit.check()");
	
	// Start getting values
	var station_name = $("#editstation input[name='station_name']")[0].value;
	var station_url = $("#editstation input[name='station_url']")[0].value;
	var station_icon = $("#editstation input[name='station_icon']")[0].value;
	var station_image = $("#editstation input[name='station_image']")[0].value;
	
	// findStationName :)
	if (findStationName) {
		station_name = site.helpers.getUniqueID();
	}
	
	// Check mandatory values
	if (!station_name) {
		site.ui.showtoast("Station name is mandatory");
		return;
	}
	if (!station_url) {
		site.ui.showtoast("Station url is mandatory");
		return;
	}
	
	// Check if exsits
	
	// Create new entry
	site.chedit.newentry = {
		station_id: "CUSTOM_"+station_name.replace(" ","_"),
		station_name: station_name,
		station_icon: station_icon,
		station_image: station_image
	}
	
	// Start checking the actual urls..
	site.chedit.check_station_url(station_name, station_url, false);
	
}

// Check station_url

site.chedit.check_station_url = function(station_name, station_url, silent) {
	
	console.log("site.chedit.check_station_url()");
	
	// --> Auto-gen host, port and other stuff
	
	// Host || TODO: this should be doable in a nicer, cleaner way?
	var station_host = station_url;
	var station_port = 80; // logic, since it should have http:// in front of it?
	var station_path = "";
	if (station_host.indexOf("http://")>=0) {
		station_host = station_host.substr("http://".length);
	} else if (station_host.indexOf("https://")>=0) {
		station_host = station_host.substr("https://".length);
	}
	if (station_host.indexOf("/")>0) { 
		station_port_end = station_host.indexOf("/")-station_host.indexOf(":")-1; 
		station_path = station_host.substr(station_host.indexOf("/"));
	}
	else { 
		station_port_end = null; 
	}
	if (station_host.indexOf(":")>=0) {
		station_port = station_host.substr(station_host.indexOf(":")+1,station_port_end);
		station_host = station_host.substr(0,station_host.indexOf(":"));
	} else if (station_host.indexOf("/")>=0) {
		station_path = station_host.substr(station_host.indexOf("/"));
		station_host = station_host.substr(0,station_host.indexOf("/"));
	}
	console.log(" > Host: "+ station_host);
	console.log(" > Port: "+ station_port);
	console.log(" > Path: "+ station_path);
	
	// Do api call
	var apiqueryobj = {
		"get":"station_info",
		"station_id":"TMP."+station_name.replace(" ","_"),
		"station_host":station_host,
		"station_port":station_port,
		"station_path":station_path
	}
	
	var apiaction = "get";
	var apiquerystr = JSON.stringify(apiqueryobj);
	
	site.webapi.exec(apiaction,apiquerystr,
		function(data,silent) {
			if (!data["data"]["icy-name"]) { 
				// Not good!
				site.ui.showtoast("Err: Icerrr cannot verify station url");
			} else {
				// Good!
				
				if (!silent) {
					site.ui.showtoast("Station url verified!");
				}
				//console.log(site.helpers.arrToString(data["data"],0,"\n"));
				
				// Some magic
				if (site.helpers.capitalize(data["data"]["icy-name"])!=site.chedit.newentry.station_name) {
					
					// Apply station_name from results?
					if (confirm("We found the following Station name: '"+ site.helpers.capitalize(data["data"]["icy-name"]) +"'.\n\nWould you like to apply it?")) {
						site.chedit.newentry.station_name = site.helpers.capitalize(data["data"]["icy-name"]);
						$("#editstation input[name='station_name']")[0].value = site.helpers.capitalize(data["data"]["icy-name"]);
					}
				}
				
				// Save host, port, path (i knew this data was going to be useful :D
				site.chedit.newentry.station_host = data["data"]["queryj"]["station_host"];
				site.chedit.newentry.station_port = data["data"]["queryj"]["station_port"];
				site.chedit.newentry.station_path = data["data"]["queryj"]["station_path"];
				
				// TODO: Fixme: remove this data before saving it, it's useless because outdated..
				site.chedit.newentry.tmp = {};
				site.chedit.newentry.tmp.station_info = data["data"];
				
				site.chedit.check_station_icon(silent);
				
			}
		},
		function(error) {
			if (error.message) { site.ui.showtoast(error.message); console.log(error.message); }
			else { console.log(error); }
		}
	);
	
}

// Check station_icon

site.chedit.check_station_icon = function(silent) {
	
	console.log("site.chedit.check_station_icon()");
	
	var newentry = site.chedit.newentry;
	// site.chedit.newentry.tmp.station_info
	
	// Start getting values
	var station_name = $("#editstation input[name='station_name']")[0].value;
	var station_url = $("#editstation input[name='station_url']")[0].value;
	var station_icon = $("#editstation input[name='station_icon']")[0].value;
	var station_image = $("#editstation input[name='station_image']")[0].value;
	
	var img = document.createElement("img");
	img.onload = function() {
		// All good :D
		// TODO: Works
		console.log(" > All good :D");
		site.chedit.check_station_image(silent);
	}
	img.onerror = function() {
		// Search the google :D
		// TODO: Work
		console.log(" > Search the google :D");
	}
	img.src = station_icon;
	
	
}

// Check station_image

site.chedit.check_station_image = function(silent) {
	
	console.log("site.chedit.check_station_image()");
	
	var newentry = site.chedit.newentry;
	// site.chedit.newentry.tmp.station_info
	
	// Start getting values
	var station_name = $("#editstation input[name='station_name']")[0].value;
	var station_url = $("#editstation input[name='station_url']")[0].value;
	var station_icon = $("#editstation input[name='station_icon']")[0].value;
	var station_image = $("#editstation input[name='station_image']")[0].value;
	
	var img = document.createElement("img");
	img.onload = function() {
		// All good :D
		// TODO: Works
		console.log(" > All good :D");
		site.chedit.check_station_image(silent);
	}
	img.onerror = function() {
		// Search the google :D
		// TODO: Work
		console.log(" > Search the google :D");
	}
	img.src = station_image;
	
	
}

























