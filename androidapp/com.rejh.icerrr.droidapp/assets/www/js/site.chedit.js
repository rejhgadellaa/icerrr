
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL EDIT

site.chedit = {};

// ---> Init

site.chedit.init = function(station_id_to_edit) {
	
	loggr.info("------------------------------------");
	loggr.info("site.chedit.init()");
	
	site.ui.hideloading();
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#editstation");
	
	// Show UI
	site.ui.gotosection("#editstation");
	
	// Magic || TODO: move to function
	$("#editstation input[name='station_url']")[0].onchange = function(evt) {
		if (!$("#editstation input[name='station_name']")[0].value) {
			site.ui.showtoast("Checking stream...");
			site.chedit.check(true,true);
		}
	}
	$("#editstation img.station_icon")[0].onchange = function(evt) {
		if (!$("#editstation input[name='station_icon']")[0].value) {
			$("#editstation img.station_icon").attr("src",$("#editstation input[name='station_icon']")[0].value.trim());
		}
	}
	
	// Set station_id hidden field
	if (station_id_to_edit) {
		var station_info = site.data.stations[site.helpers.session.getStationIndexById(station_id_to_edit)]; // station_id_to_edit
		$("#editstation .action.trash").css("display","block");
		$("#editstation input[name='station_id']")[0].value = station_id_to_edit;
		$("#editstation input[name='station_name']")[0].value = station_info.station_name
		$("#editstation input[name='station_url']")[0].value = station_info.station_url
		$("#editstation input[name='station_icon']")[0].value = station_info.station_icon
		site.chedit.newentry = {
			station_id: station_id_to_edit,
			station_edited: station_info.station_edited,
			station_name: station_info.station_name,
			station_url: station_info.station_url,
			station_icon: station_info.station_icon,
			station_image: station_info.station_icon,
			station_host: station_info.station_host,
			station_port: station_info.station_port,
			station_path: station_info.station_path,
			station_country: station_info.station_country,
			station_bitrate: station_info.station_bitrate
		}
		$("#editstation img.station_icon").attr("src",$("#editstation input[name='station_icon']")[0].value.trim());
		$("#editstation img.station_icon").on("click", function(evt) {
			site.chicon.init($("#editstation input[name='station_id']")[0].value.trim());
		});
		
	} else if (station_id_to_edit===false) { // clean
		$("#editstation .action.trash").css("display","none");
		$("#editstation input[name='station_id']")[0].value = "";
		$("#editstation input[name='station_name']")[0].value = ""
		$("#editstation input[name='station_url']")[0].value = ""
		$("#editstation input[name='station_icon']")[0].value = ""
		$("#editstation img.station_icon").attr("src","img/icons-48/ic_launcher.png");
	} else { // continue but make sure the station_id is cleared
		$("#editstation .action.trash").css("display","none");
		$("#editstation input[name='station_id']")[0].value = "";
		$("#editstation img.station_icon").attr("src","img/icons-48/ic_launcher.png");
	}
	
	// TODO: check if this is not required
	//site.chedit.changesHaveBeenMade = false;
	//site.chedit.changesHaveBeenMadeButResetScroll = false;
	
}

// PAUSE RESUME
// - Important stuff: this is function that will be called whenever site.ui.gotosection is called

site.chedit.onpause = function() {
	loggr.log("site.chedit.onpause()");
	// not needed now
}

site.chedit.onresume = function() {
	loggr.log("site.chedit.site.home.()");
	// not needed now
}

// ---> Save

site.chedit.save = function() {
	
	loggr.log("site.chedit.save()");
	
	// Overwrite data.stations :| || TODO: is this safe?
	if ($("#editstation input[name='station_id']")[0].value) {
		site.chedit.newentry.station_id = $("#editstation input[name='station_id']")[0].value.trim();
	}
	// New station: auto star it
	else {
		site.chlist.setStarred(site.chedit.newentry.station_id);
		site.chedit.changesHaveBeenMadeGotoStarred = true;
	}
	
	// loggr.log(site.helpers.arrToString(site.chedit.newentry,0,"\n")); || TODO: cleanup
	
	// Remove tmp data
	site.chedit.newentry.tmp = 0;
	
	// print
	//loggr.log(site.helpers.arrToString(site.chedit.newentry,1,"\n"));
	
	// TODO: we need a helper for 'edited' stations
	
	// Safety
	if (!site.chedit.newentry.station_edited) {
		loggr.log(" > site.chedit.newentry.station_edited = {};");
		site.chedit.newentry.station_edited = {};
	}
	
	// Find changes
	var originalStationIfAny = site.data.stations[site.helpers.session.getStationIndexById(site.chedit.newentry.station_id)];
	if (originalStationIfAny) {
		for (var key in site.chedit.newentry) {
			if (site.chedit.newentry[key] != originalStationIfAny[key]) {
				site.chedit.newentry.station_edited[key] = new Date().getTime();
			}
		}
	} else {
		loggr.warn(" > !originalStationIfAny, are we sure?");
	}
	
	loggr.log(" > Changes:");
	loggr.log(site.helpers.arrToString(site.chedit.newentry.station_edited,1,"\n"));
	
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
			if (!$("#editstation input[name='station_id']")[0].value.trim()) {
				// Goto list on first save (long story.. but there is a difference how this script handles new and existing entries
				site.chlist.init(true);
			}
		},
		function(e){ 
			alert("Error writing to filesystem: "+site.storage.getErrorType(e)); 
			loggr.log(site.storage.getErrorType(e)); 
		}
	);
	
}

// ---> Remove

site.chedit.remove = function() {
	
	loggr.log("site.chedit.remove()");
	
	if (!confirm("Are you sure you want to remove this station?\n\nThis can't be undone easily.")) { return; }
	
	// Gather data..
	var station_id = $("#editstation input[name='station_id']")[0].value.trim();
	
	// Clear currentstation if needed
	if (site.session.currentstation_id == station_id) {
		site.session.currentstation_id = null;
		site.session.currentstation = null;
	}
	
	// Find station in data
	var stationIndex = site.helpers.session.getStationIndexById(station_id);
	if (stationIndex<0) { site.ui.showtoast("Huh? Could not find station..?"); return; }
	
	// Check if starred (and unstar if so)
	if (site.chlist.isStarred(station_id)) {
		site.chlist.unsetStarred(station_id);
	}
	
	// Build newstations
	loggr.log(" > Build new stations list...");
	var newstations = [];
	for (var i in site.data.stations) {
		if (!site.data.stations[i]) { continue; } // TODO: This shouldn't be neccasary..?
		if (!site.data.stations[i].station_name) { continue; } // TODO: This shouldn't be neccasary..?
		if (site.data.stations[i].station_id != station_id) {
			newstations.push(site.data.stations[i]);
		}
	}
	
	// Store!
	site.data.stations = newstations;
	site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),
		function(evt) { 
			site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json"); // TODO: do something with flagged files..
			site.chedit.changesHaveBeenMade = true;
			site.ui.showtoast("Removed!");
			site.chedit.changesHaveBeenMade = true;
			site.chlist.init(true);
			
			/*
			site.chlist.init(true);
			
			// TMP Testcode
			site.storage.readfile(site.cfg.paths.json,"stations.json",
				function(res) {
					var json = JSON.parse(res);
					loggr.log("\n"+ site.helpers.arrToString(json,0,"\n") +"\n");
				},
				function(error) {
					// TODO: unless we intend to do this job in Reno, we're in Barney
					// ...
				}
			);
			/**/
			
		},
		function(e){ 
			alert("Error writing to filesystem: "+site.storage.getErrorType(e)); 
			loggr.log(site.storage.getErrorType(e)); 
		}
	);
	
	
}

// ---> Check

// Check
// - Checks fields

site.chedit.check = function(findStationName,silent) {

	loggr.log("site.chedit.check()");
	
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
		//loggr.warn(" > Huh? !site.data.stations...?"); // TODO: CLEANNUP
		//loggr.log(" >> "+ station_id);
		//loggr.log(" >> "+ site.data.stations);
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
		// loggr.warn(" > Huh? !site.data.stations...?"); // TODO: CLEANNUP
	}
	
	// Create new entry
	if (!site.chedit.newentry) { site.chedit.newentry = {}; }
	site.chedit.newentry.station_id = "CUSTOM."+site.helpers.genUniqueStationId(station_name).replace(" ","_");
	site.chedit.newentry.station_name = station_name;
	site.chedit.newentry.station_icon = station_icon;
	site.chedit.newentry.station_image = station_icon;
	site.chedit.newentry.station_country = ""
	site.chedit.newentry.station_bitrate = "-1 kbps"
	
	// Start checking the actual urls..
	site.chedit.check_station_url(station_name, station_url, silent);
	
}

// Check station_url

site.chedit.check_station_url = function(station_name, station_url, silent) {
	
	loggr.log("site.chedit.check_station_url()");
	
	site.ui.showloading("Wait");
	
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
	
	if (station_host.indexOf("/")>0 && station_host.indexOf(":")>0) { 
		station_port_end = station_host.indexOf("/")-station_host.indexOf(":")-1; 
		station_path = station_host.substr(station_host.indexOf("/"));
	} else if (station_host.indexOf("/")<0 && station_host.indexOf(":")>0) {
		station_port_end = station_host.length-station_host.indexOf(":")-1; 
		station_path = "/";
 	} else { 
		station_port_end = station_host.length-station_host.indexOf(":")-1; 
	}
	
	if (station_host.indexOf(":")>=0) {
		station_port = station_host.substr(station_host.indexOf(":")+1,station_port_end);
		station_host = station_host.substr(0,station_host.indexOf(":"));
	} else if (station_host.indexOf("/")>=0) {
		station_path = station_host.substr(station_host.indexOf("/"));
		station_host = station_host.substr(0,station_host.indexOf("/"));
	}
	
	// Catch pls and m3u
	if (station_path.indexOf(".pls")>=0 || station_path.indexOf(".m3u")>=0) {
		
		var apiqueryobj = {
			"get":"parse_playlist",
			"url":station_url
		}
		
		var apiaction = "get";
		var apiquerystr = JSON.stringify(apiqueryobj);
		
		site.webapi.exec(apiaction,apiquerystr,
			function(data) {
				var url = data["data"];
				site.chedit.check_station_url(station_name,url,silent);
			},
			function(error) {
				site.ui.hideloading();
				if (error.message) { site.ui.showtoast(error.message); loggr.log(error.message); }
				else { loggr.log(error); }
			}
		
		return;
		
	}
	
	loggr.log(" > Host: "+ station_host);
	loggr.log(" > Port: "+ station_port);
	loggr.log(" > Path: "+ station_path);
	
	// Do api call
	var apiqueryobj = {
		"get":"station_info",
		"station_id":"TMP."+site.helpers.genUniqueStationId(station_name).replace(" ","_"),
		"station_host":station_host,
		"station_port":station_port,
		"station_path":station_path
	}
	
	var apiaction = "get";
	var apiquerystr = JSON.stringify(apiqueryobj);
	
	site.webapi.exec(apiaction,apiquerystr,
		function(data) {
			site.ui.hideloading();
			loggr.log(JSON.stringify(data["data"]));
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
					if (site.helpers.capitalize(data["data"]["icy-name"])!=site.chedit.newentry.station_name) {
						if (confirm("We found the following Station name: '"+ site.helpers.capitalize(data["data"]["icy-name"]) +"'.\n\nWould you like to apply it?")) {
							site.chedit.newentry.station_name = site.helpers.capitalize(data["data"]["icy-name"]);
							$("#editstation input[name='station_name']")[0].value = site.helpers.capitalize(data["data"]["icy-name"]);
						}
					}
				}
				
				// Save host, port, path (i knew this data was going to be useful :D
				site.chedit.newentry.station_url = $("#editstation input[name='station_url']")[0].value.trim();
				site.chedit.newentry.station_host = data["data"]["queryj"]["host"];
				site.chedit.newentry.station_port = data["data"]["queryj"]["port"];
				site.chedit.newentry.station_path = data["data"]["queryj"]["path"];
				
				// TODO: Fixme: remove this data before saving it, it's useless because outdated..
				site.chedit.newentry.tmp = {};
				site.chedit.newentry.tmp.station_info = data["data"];
				
				site.chedit.check_station_icon(silent);
				
			}
		},
		function(error) {
			site.ui.hideloading();
			if (error.message) { site.ui.showtoast(error.message); loggr.log(error.message); }
			else { loggr.log(error); }
		}
	);
	
}

// Check station_icon

site.chedit.check_station_icon = function(silent) {
	
	loggr.log("site.chedit.check_station_icon()");
	
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
		$("#editstation img.station_icon").attr("src",$("#editstation input[name='station_icon']")[0].value.trim());
		newentry.station_icon_local = false;
		loggr.log(" > All good :D");
		if (confirm("Everything seems to check out! Save now?")) {
			site.chedit.save();
		}
	}
	img.onerror = function(evt) {
		// Search the google :D
		// TODO: Work
		loggr.warn(evt);
		loggr.log(" > Search the google :D");
		if (confirm("Station icon could not be loaded. Search Google for an icon?")) {
			site.chedit.searchicon();
		} else {
			// nothin
		}
	}
	img.src = site.helpers.urlAddCachebust(station_icon)
	
	
}

// ---> Search

site.chedit.searchicon = function() {
	
	loggr.log("site.chedit.searchicon()");
	
	if (!site.chedit.newentry) {
		site.ui.showtoast("Cannot search without info");
		return;
	}/*
	if (!site.chedit.newentry.station_name) {
		site.ui.showtoast("Cannot search without station name");
		return;
	}*/
	if (!site.chedit.newentry.station_url) {
		site.ui.showtoast("Cannot search without station url");
		return;
	}
	
	// Prep data || TODO: need more info, 'radio 1' returns image for bbc radio 1
	var searchstring = ""
		+ '"'+ $("#editstation input[name='station_name']")[0].value.trim() +'"' +" "
		+ site.chedit.newentry.station_country +" "
	//	+ site.chedit.newentry.station_url +" "
		+ "logo icon";
	
	var opts = {
		restrictions:[
			[google.search.ImageSearch.RESTRICT_FILETYPE, google.search.ImageSearch.FILETYPE_PNG]
		]
	}
	
	// Search
	site.helpers.googleImageSearch(searchstring,
		function(results) {
			
			loggr.log(" > "+ results.length +" result(s)");
			
			// TODO: let user pick image? Nah, we're going with the first one for now
			// --> Find square image(s)
			var theresult = false;
			for (var i=0; i<results.length; i++) {
				var result = results[i];
				var aspect = site.helpers.calcImageAspect(result["width"],result["height"]);
				if (aspect<1.1) { 
					loggr.log(" > Found square(ish) result: "+ aspect);
					theresult = result; break; 
				}
				
			}
			// Okat just use some image if we can't find a suitable one.. || TODO: fix this
			if (!theresult) { theresult = results[0]; }
			
			loggr.log(" > Result info:");
			loggr.log(" >> tbw/tbh: "+ result.tbWidth +" x "+ result.tbHeight);
			loggr.log(" >> w/h: "+ result.width +" x "+ result.height);
			
			// Set src
			loggr.log(" > Pick: "+theresult.url);
			$("#editstation input[name='station_icon']")[0].value = theresult.url;
			
			// Auto check..
			site.chedit.check();
			
		},
		function() {
			loggr.log(" > No image found...");
			site.ui.showtoast("Could not find an icon on Google...");
		},
		opts
	);
	
}




















