
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
	
	// Set station_id hidden field
	if (station_id_to_edit) {
		var station_info = site.data.stations[site.helpers.session.getStationIndexById(station_id_to_edit)]; // station_id_to_edit
		$("#editstation input[name='station_id']")[0].value = station_id_to_edit;
		$("#editstation input[name='station_name']")[0].value = station_info.station_name
		$("#editstation input[name='station_url']")[0].value = station_info.station_url
		$("#editstation input[name='station_icon']")[0].value = station_info.station_icon
	} else if (station_id_to_edit===false) { // clean
		$("#editstation input[name='station_id']")[0].value = "";
		$("#editstation input[name='station_name']")[0].value = ""
		$("#editstation input[name='station_url']")[0].value = ""
		$("#editstation input[name='station_icon']")[0].value = ""
	} else { // continue
		$("#editstation input[name='station_id']")[0].value = "";
	}
	
	site.chedit.changesHaveBeenMade = false;
	site.chedit.changesHaveBeenMadeButResetScroll = false;
	
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

// ---> Save

site.chedit.save = function() {
	
	console.log("site.chedit.save()");
	
	// Overwrite data.stations :| || TODO: is this safe?
	if ($("#editstation input[name='station_id']")[0].value) {
		site.chedit.newentry.station_id = $("#editstation input[name='station_id']")[0].value.trim();
		site.chedit.changesHaveBeenMadeButResetScroll = true;
	}
	
	// New station: auto star it
	else {
		site.chlist.setStarred(site.chedit.newentry.station_id);
	}
	
	console.log(site.helpers.arrToString(site.chedit.newentry,0,"\n"));
	
	// Use MergeStations :D || but in reverse :D
	var addstations = [site.chedit.newentry];
	var newstations = site.helpers.mergeStations(addstations, site.data.stations);
	
	// Store!
	site.data.stations = newstations;
	site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),
		function(evt) { 
			site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json"); // TODO: do something with flagged files..
			site.chedit.changesHaveBeenMade = true;
			site.ui.showtoast("Saved!");
		},
		function(e){ 
			alert("Error writing to filesystem: "+site.storage.getErrorType(e)); 
			console.log(site.storage.getErrorType(e)); 
		}
	);
	
}

// ---> Check

// Check
// - Checks fields

site.chedit.check = function(findStationName) {

	console.log("site.chedit.check()");
	
	// Start getting values
	var station_id = $("#editstation input[name='station_id']")[0].value.trim();
	var station_name = $("#editstation input[name='station_name']")[0].value.trim();
	var station_url = $("#editstation input[name='station_url']")[0].value.trim();
	var station_icon = $("#editstation input[name='station_icon']")[0].value.trim();
	
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
	
	// Check if exsits: name
	if (site.data.stations && !station_id) {
		for (var i in site.data.stations) {
			if (!site.data.stations[i].station_name) { continue; }
			if (station_name.toLowerCase()==site.data.stations[i].station_name.toLowerCase()) {
				alert("A station with name '"+ station_name +"' already exists. Please change it.");
				return;
			}
		}
	} else {
		console.warn(" > Huh? !site.data.stations...?");
	}
	
	// Check if exsits: url
	if (site.data.stations && !station_id) {
		for (var i in site.data.stations) {
			if (!site.data.stations[i].station_url) { continue; }
			if (station_url.toLowerCase()==site.data.stations[i].station_url.toLowerCase()) {
				alert("A station with this url already exists: '"+site.data.stations[i].station_name+"'");
				return;
			}
		}
	} else {
		console.warn(" > Huh? !site.data.stations...?");
	}
	
	// Create new entry
	site.chedit.newentry = {
		station_id: "CUSTOM."+station_name.replace(" ","_"),
		station_name: station_name,
		station_icon: station_icon,
		station_image: station_icon
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
			console.log(JSON.stringify(data["data"]));
			if (!data["data"]["content-type"]) { 
				// Not good!
				if (!silent) { site.ui.showtoast("Err: Icerrr cannot verify station url"); }
			} else {
				// Good!
				
				// Check content-type
				if (data["data"]["content-type"].indexOf("audio/mpeg")<0 
				 && data["data"]["content-type"].indexOf("audio/aacp")<0
				 && data["data"]["content-type"].indexOf("audio/x-mpegurl")<0
				 && data["data"]["content-type"].indexOf("audio/")<0 // TODO: To easy on the type?
				) {
					if (!silent) { site.ui.showtoast("Err: Icerrr cannot verify station url"); }
					return;
				}
				
				if (!silent) {
					site.ui.showtoast("Station url verified!");
				}
				
				// Apply station_name from results?
				if (data["data"]["icy-name"]) {
					if (confirm("We found the following Station name: '"+ site.helpers.capitalize(data["data"]["icy-name"]) +"'.\n\nWould you like to apply it?")) {
						site.chedit.newentry.station_name = site.helpers.capitalize(data["data"]["icy-name"]);
						$("#editstation input[name='station_name']")[0].value = site.helpers.capitalize(data["data"]["icy-name"]);
					}
				}
				
				// Save host, port, path (i knew this data was going to be useful :D
				site.chedit.newentry.station_url = $("#editstation input[name='station_url']")[0].value.trim();
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
	var station_name = $("#editstation input[name='station_name']")[0].value.trim();
	var station_url = $("#editstation input[name='station_url']")[0].value.trim();
	var station_icon = $("#editstation input[name='station_icon']")[0].value.trim();
	
	var img = document.createElement("img");
	img.onload = function() {
		// All good :D
		// TODO: Works
		console.log(" > All good :D");
		if (confirm("Everything seems to check out! Save now?")) {
			site.chedit.save();
		}
	}
	img.onerror = function(evt) {
		// Search the google :D
		// TODO: Work
		console.log(" > Search the google :D");
		if (confirm("Station icon could not be loaded. Search Google for an icon?")) {
			site.chedit.searchicon();
		} else {
			// nothin
		}
	}
	img.src = station_icon;
	
	
}

// ---> Search

site.chedit.searchicon = function() {
	
	console.log("site.chedit.searchicon()");
	
	if (!site.chedit.newentry) {
		site.ui.showtoast("Cannot search without info");
	}
	if (!site.chedit.newentry.station_name) {
		site.ui.showtoast("Cannot search without station name");
	}
	if (!site.chedit.newentry.station_url) {
		site.ui.showtoast("Cannot search without station url");
	}
	
	// Prep data || TODO: need more info, 'radio 1' returns image for bbc radio 1
	var searchstring = ""
		+ site.chedit.newentry.station_name +" "
		+ site.chedit.newentry.station_url +" "
		+ "logo icon";
	
	var opts = {
		restrictions:[
			[google.search.ImageSearch.RESTRICT_FILETYPE, google.search.ImageSearch.FILETYPE_PNG]
		]
	}
	
	// Search
	site.helpers.googleImageSearch(searchstring,
		function(results) {
			
			console.log(" > "+ results.length +" result(s)");
			
			// TODO: let user pick image? Nah, we're going with the first one for now
			// --> Find square image(s)
			var theresult = false;
			for (var i=0; i<results.length; i++) {
				var result = results[i];
				var aspect = site.helpers.calcImageAspect(result["width"],result["height"]);
				if (aspect<1.1) { 
					console.log(" > Found square(ish) result: "+ aspect);
					theresult = result; break; 
				}
				
			}
			// Okat just use some image if we can't find a suitable one.. || TODO: fix this
			if (!theresult) { theresult = results[0]; }
			
			console.log(" > Result info:");
			console.log(" >> tbw/tbh: "+ result.tbWidth +" x "+ result.tbHeight);
			console.log(" >> w/h: "+ result.width +" x "+ result.height);
			
			// Set src
			console.log(" > Pick: "+theresult.url);
			$("#editstation input[name='station_icon']")[0].value = theresult.url;
			
			// Auto check..
			site.chedit.check();
			
		},
		function() {
			console.log(" > No image found...");
		},
		opts
	);
	
}























