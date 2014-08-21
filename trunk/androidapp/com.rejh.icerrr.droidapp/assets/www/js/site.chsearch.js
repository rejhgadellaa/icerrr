
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL EDIT

site.chsearch = {};

// ---> Init

site.chsearch.init = function() {
	
	loggr.log("site.chsearch.init()");
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#searchstation");
	
	// Show UI
	site.ui.gotosection("#searchstation");
	
}

// PAUSE RESUME
// - Important stuff: this is function that will be called whenever site.ui.gotosection is called

site.chsearch.onpause = function() {
	loggr.log("site.chsearch.onpause()");
	// not needed now
}

site.chsearch.onresume = function() {
	loggr.log("site.chsearch.site.home.()");
	// not needed now
}

// ---> Search

site.chsearch.searchstation = function() {
	
	loggr.log("site.chsearch.searchstation()");
	
	// Get value
	var name = $("#searchstation input[name='station_search']")[0].value.trim();
	
	// Check
	if (!name) { site.ui.showtoast("Station name is mandatory"); return; }
	
	site.chsearch.searchstr = name;
	
	site.ui.showloading();
	
	// Webapi time!
	var apiqueryobj = {
		"get":"search_dirble",
		"search":name +"/count/"+ site.cfg.chlist.maxItemsPerBatch
	}
	
	var apiaction = "get";
	var apiquerystr = JSON.stringify(apiqueryobj);
	
	site.webapi.exec(apiaction,apiquerystr,
		function(data) {
			site.ui.hideloading();
			if (data["error"]) {
				site.ui.showtoast(data["errormsg"]);
			} else {
				console.log(data["data"]);
				site.ui.showtoast("Success! Found "+ data["data"].length +" result(s)");
				site.chsearch.results = data["data"];
				site.chsearch.resultsToStationData();
			}
		},
		function(error) {
			if (error.message) { site.ui.showtoast(error.message); loggr.log(error.message); }
			else { loggr.log(error); }
			site.ui.hideloading();
		}
	);
	
	
	
}

// ---> Convert Results To Station Data

site.chsearch.resultsToStationData = function(results) {
	
	loggr.log("site.chsearch.resultsToStationData()");
	
	if (!results) { results = site.chsearch.results; }
	if (!results) { loggr.error("!results && !site.chsearch.results"); }
	
	site.chsearch.stations = [];
	
	loggr.log(results.length);
	
	for (var i in results) {
		
		var result = results[i];
		
		//result = JSON.parse(result);
		
		console.log(result.streamurl);
		
		if (result.status!=1) { continue; } // TODO: The status can not be 100% sure yet. Its mainly just working for shoutcast and some Icecast
		
		var hostPortAndPath = site.chsearch.getHostPortAndPathFromUrl(result.streamurl);
		
		var station = {
			station_id:site.helpers.genUniqueStationId(result.name).replace(" ","_"),
			station_edited:{},
			station_name:result.name,
			station_url:result.streamurl,
			station_icon:"null",
			station_image:"null",
			station_host:hostPortAndPath[0],
			station_port:hostPortAndPath[1],
			station_path:hostPortAndPath[2],
			station_country:result.country,
			station_bitrate:result.bitrate
		}
		
		site.chsearch.stations.push(station);
		
	}
	
	site.chsearch.drawResults();
	
}

// ---> Draw Results

site.chsearch.drawResults = function(pagenum, forceRedraw) {
	
	loggr.log("site.chsearch.drawResults()");
	
	$("#searchstation_results .title").html("Icerrr: \""+site.helpers.short(site.chsearch.searchstr,24)+"\"");
	
	// TODO: This function is a bit different from site.chlist.js, mainly because
	//  (cont) it uses its own section
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#searchstation_results");
	
	// Goto
	site.ui.gotosection("#searchstation_results");
	
	// Determine sorting..
	var sorter = site.sorts.station_by_none; //function(stations) { return stations; };
	if (site.session.sorting=="id") {
		sorter = site.sorts.station_by_id;
	}
	if (site.session.sorting=="name") {
		sorter = site.sorts.station_by_name;
	}
	
	// Results: stations (all) or starred?
	var stations = [];
	stations = sorter(site.chsearch.stations);
	
	// Clean main
	$("#searchstation_results .main").html("");
	
	// Set header
	// $("#channellist .main").append('<div class="header">Choose a radio station:</div>');
	
	// Handle page(s)
	if (!pagenum && pagenum!==0) { pagenum = 0; }
	site.session.chsearch_pagenum = pagenum;
	
	// (!) Don't draw ALL results, do it in batches...
	// -> TODO: yea but how are we navigating this?
	var maxitems = site.cfg.chlist.maxItemsPerBatch;
	var ibgn = pagenum*site.cfg.chlist.maxItemsPerBatch;
	var imax = (pagenum+1)*site.cfg.chlist.maxItemsPerBatch;
	
	// Init masonry || TODO: handle opts for other formfactors
	site.helpers.masonryinit("#searchstation_results .main"); // TODO: move to helpers?
	site.helpers.masonryupdate();
	
	// Fragment
	var fragment = document.createDocumentFragment();
	var elems = [];
	
	// For loop!
	for (i=ibgn; i<imax; i++) {
		
		// check if i>stations.length
		if (i>=stations.length) {
			loggr.log(" > End of list");
			break;
		}
		
		// station..
		var station = stations[i];
		if (!station) { continue; }
		
		// begin creating elements
		var resultitem = document.createElement("div");
		resultitem.className = "resultitem activatabled";
		resultitem.id = "chlist_resultitem_"+ station.station_id;
		resultitem.station_id = station.station_id;
		
		var resulticon = document.createElement("img");
		resulticon.className = "resulticon";
		resulticon.src = "img/icons-48/ic_launcher.png";
		
		var resultname = document.createElement("div");
		resultname.className = "resultname";
		resultname.innerHTML = station.station_name;
		
		var resultsub = document.createElement("div");
		resultsub.className = "resultsub";
		resultsub.innerHTML = ""
			+ station.station_country +", "
			+ site.helpers.short(station.station_url,24) +", "
			+ station.station_bitrate
		
		// TODO: events.. anyone?
		resultitem.onclick = function(){
			site.ui.showtoast("TODO: Todo.. ");
			
			// TODO: quick hack :D
	
			loggr.log("site.chsearch.HACK.save()");
			
			var station_id = this.station_id;
			loggr.log(" > "+station_id)
			
			var stationIndex = site.helpers.session.getStationIndexById(station_id,site.chsearch.stations);
			var station = site.chsearch.stations[stationIndex];
			
			if (!station) { loggr.error(" > !station"); }
			
			if (!confirm("Add '"+ station.station_name +"'?")) { return; }
			
			// Auto star
			site.chlist.setStarred(station.station_id);
			site.chedit.changesHaveBeenMadeGotoStarred = true;
	
			// TODO: we need a helper for 'edited' stations
			
			console.log(JSON.stringify(station));
			
			// Use MergeStations :D || but in reverse :D
			var addstations = [station];
			var newstations = site.helpers.mergeStations(addstations, site.data.stations);
			
			// Store!
			site.data.stations = newstations;
			site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),
				function(evt) { 
					site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json"); // TODO: do something with flagged files..
					site.chedit.changesHaveBeenMade = true;
					site.ui.showtoast("Saved!");
					site.chlist.init(true);
				},
				function(e){ 
					alert("Error writing to filesystem: "+site.storage.getErrorType(e)); 
					loggr.log(site.storage.getErrorType(e)); 
				}
			);
			
			
			
			
			
		};
		
		// add elements..
		resultitem.appendChild(resulticon);
		resultitem.appendChild(resultname);
		resultitem.appendChild(resultsub);
		fragment.appendChild(resultitem);
		
		// Store elem
		elems.push(resultitem);
		
	}
	
	// add list
	$("#searchstation_results .main").append(fragment);
	
	// masonry!
	$("#searchstation_results .main").masonry( 'appended', elems )
	
	// TODO: how to load more pages...?
	
	
	
}

// ---> Helper: get host, port and path from url

site.chsearch.getHostPortAndPathFromUrl = function(station_url) {
	
	loggr.log("site.chsearch.getHostPortAndPathFromUrl()");
	loggr.log(" > "+station_url);
	
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
	if (station_host.indexOf("/")>0 && station_host.indexOf(":")) { 
		station_port_end = station_host.indexOf("/")-station_host.indexOf(":")-1; 
		station_path = station_host.substr(station_host.indexOf("/"));
	}
	else { 
		station_port_end = station_host.length-station_host.indexOf(":")-1; 
	}
	if (station_host.indexOf(":")>=0) {
		station_port = station_host.substr(station_host.indexOf(":")+1,station_port_end);
		station_host = station_host.substr(0,station_host.indexOf(":"));
	} else if (station_host.indexOf("/")>=0) {
		station_path = station_host.substr(station_host.indexOf("/"));
		station_host = station_host.substr(0,station_host.indexOf("/"));
	}
	loggr.log(" > Host: "+ station_host);
	loggr.log(" > Port: "+ station_port);
	loggr.log(" > Path: "+ station_path);
	
	return [station_host,station_port,station_path];

}























