
// ---------------------------------------------
// BZZ

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
	
	// Focus
	$("#searchstation .main input")[0].focus();
	
	// Reset results
	site.chsearch.results = [];
	site.chsearch.searchpage = 0;
	
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

site.chsearch.searchstation = function(nextpage) {
	
	loggr.log("site.chsearch.searchstation()");
	
	if (!site.chsearch.searchpage) {
		site.chsearch.searchpage = 0;
	}
	
	if (nextpage) {
		site.chsearch.searchpage++;
	} else {
		site.chsearch.results = [];
		site.chsearch.searchpage = 0;
	}
	
	// Get value
	var name = $("#searchstation input[name='station_search']")[0].value.trim();
	
	// Check
	if (!name) { site.ui.showtoast("Station name is mandatory"); return; }
	
	site.chsearch.searchstr = name;
	
	if (!site.vars.isLoading) { site.ui.showloading(); }
	
	// Webapi time!
	var apiqueryobj = {
		"get":"search_dirble",
		"search":name +"/count/"+ 10 +"/from/"+ site.chsearch.searchpage // site.cfg.chlist.maxItemsPerBatch
	}
	
	// > Go
	var apiaction = "get";
	var apiquerystr = JSON.stringify(apiqueryobj);
	
	site.chsearch.searchAjaxRequestId = site.webapi.exec(apiaction,apiquerystr,
		function(data) {
			if (data["error"]) {
				site.ui.showtoast(data["errormsg"]);
				site.ui.hideloading();
			} else {
				if (data["data"].length>0 && site.chsearch.results.length<20) {
					loggr.log(data["data"]);
					for (var i in data["data"]) {
						if (!data["data"][i]) { continue; }
						if (!data["data"][i].name) { continue; }
						site.chsearch.results.push(data["data"][i]);
					}
					site.chsearch.searchstation(true);
					//site.ui.showtoast("Success! Found "+ site.chsearch.results.length +" result(s)");
					//site.chsearch.resultsToStationData();
					//site.ui.hideloading();
				} else {
					site.ui.showtoast("Success! Found "+ site.chsearch.results.length +" result(s)");
					site.chsearch.resultsToStationData();
					site.ui.hideloading();
				}
			}
		},
		function(error) {
			// this could be just fired because there aro no more results..
			if (site.chsearch.results) {
				if (site.chsearch.results.length>0) {
					site.ui.showtoast("Success! Found "+ site.chsearch.results.length +" result(s)");
					site.chsearch.resultsToStationData();
					site.ui.hideloading();
					return;
				}
			}
			// jep it's an error
			if (error.message) { site.ui.showtoast(error.message); loggr.log(error.message); }
			else { loggr.log(error); }
			site.ui.hideloading();
		}
	);
	
	
	
}

// ---> Find more

site.chsearch.searchstation_more = function() {
	
	
	
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
		
		loggr.log(result.streamurl);
		
		if (result.status!=1) { continue; } // TODO: The status can not be 100% sure yet. Its mainly just working for shoutcast and some Icecast
		
		var hostPortAndPath = site.chsearch.getHostPortAndPathFromUrl(result.streamurl);
		
		var station = {
			station_id:site.helpers.genUniqueStationId(result.name).replace(" ","_"),
			dirble_id:result.id,
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
	
	$("#searchstation_results .title").html("Icerrr: \""+site.helpers.short(site.chsearch.searchstr,18)+"\"");
	
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
		resultitem.className = "resultitem activatablel";
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
		resultitem.onclick = site.chsearch.addThisStation;
		
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
	// $("#searchstation_results .main").masonry( 'appended', elems )
	
	// TODO: how to load more pages...?
	
	// update window
	site.lifecycle.onResize();
	
}

// ---> Add

site.chsearch.addThisStation = function(evt) {
	
	loggr.info("site.chsearch.addThisStation()");
			
	// TODO: quick hack :D

	loggr.log("site.chsearch.HACK.save()");
	
	// -> Get station
	
	var station_id = this.station_id;
	loggr.log(" > "+station_id)
	
	site.chsearch.station_id = station_id;
	
	var stationIndex = site.helpers.session.getStationIndexById(station_id,site.chsearch.stations);
	var station = site.chsearch.stations[stationIndex];
	
	if (!station) { loggr.error(" > !station"); }
	
	// -> Check if station exists
	
	for (var i in site.data.stations) {
		if (!site.data.stations[i].station_url) { continue; }
		if (station.station_url.toLowerCase()==site.data.stations[i].station_url.toLowerCase()) {
			alert("A station with this url already exists: '"+site.data.stations[i].station_name+"'");
			return;
		}
	}
	
	// Get dirble station results
	
	// Webapi time!
	var apiqueryobj = {
		"get":"nowplaying_dirble",
		"dirble_id": station.dirble_id
	}
	
	// > Go
	var apiaction = "get";
	var apiquerystr = JSON.stringify(apiqueryobj);
	
	site.chsearch.searchAjaxRequestId = site.webapi.exec(apiaction,apiquerystr,
		function(data) {
			if (data["error"]) {
				site.ui.showtoast(data["errormsg"]);
				site.ui.hideloading();
			} else {
				site.chsearch.testStation(station, stationIndex, data["data"]);
			}
		},
		function(error) {
			if (error.message) { site.ui.showtoast(error.message); loggr.log(error.message); }
			else { loggr.log(error); }
			site.ui.hideloading();
		}
	);
	
	
	
	
}

site.chsearch.testStation = function(station, stationIndex, stationData) {
	
	loggr.info("site.chsearch.testStation()");
	
	// -> Handle stationData:
	// http://api.dirble.com/v1/station/apikey/08a3da4597ba300ba13fc63ab2b0ab6aa560e11d/id/9954
	
	var stream_url = station.stream_url;
		
	try {
		var streams = stationData.streams;
		loggr.log(" > Found "+ streams.length +" stream(s)");
		for (var i=0; i<streams.length; i++) {
			var stream = streams[i];
			stream.type = stream.type.trim().split("\n").join("").split("\r").join("").toLowerCase();
			loggr.log(" >> "+ stream.type +", "+ stream.stream);
			if (stream.type == "audio/mpeg") {
				stream_url = stream.stream;
				break;
			}
		}
	} catch(e) { 
		console.warn(streams);
		console.error(e);
	}
	
	// Store
	station.stream_url = stream_url;
	
	// -> Check if station is actually a playlist...
	
	// TODO
	
	// -> Check if station actually works...
	
	site.ui.showloading("Testing...","Checking station validity");
	loggr.log(" > "+ station.station_url);
	
	var mediaPlayer = new Media(station.station_url,
		function() {
			// Do nothing..
		},
		function(error) {
			loggr.warn(" > Station is not working");
			loggr.log(" > Errorcode: "+error);
			mediaPlayer.stop();
			mediaPlayer.release();
			site.ui.hideloading();
			site.ui.showtoast("Station error, please choose another");
			if (site.chsearch.station_test_timeout) { clearTimeout(site.chsearch.station_test_timeout); }
		},
		function(status) {
			loggr.log(" > Status: "+ status);
			switch (status) {
				
				case Media.MEDIA_RUNNING:
				
					if (site.chsearch.station_test_timeout) { clearTimeout(site.chsearch.station_test_timeout); }
				
					mediaPlayer.stop();
					mediaPlayer.release();
	
					// -> Gogo
					
					if (!confirm("Add '"+ station.station_name +"'?")) { site.ui.hideloading(); return; }
					
					// Auto star
					site.chlist.setStarred(station.station_id);
					site.chedit.changesHaveBeenMadeGotoStarred = true;
			
					// TODO: we need a helper for 'edited' stations
					
					loggr.log(JSON.stringify(station));
					
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
							// site.chlist.init(true);
							site.chicon.init(site.chsearch.station_id); // TODO: Finish this
						},
						function(e){ 
							alert("Error writing to filesystem: "+site.storage.getErrorType(e)); 
							loggr.log(site.storage.getErrorType(e)); 
						}
					);
					
			}
		}
	);
	
	mediaPlayer.play();

	site.chsearch.station_test_timeout = setTimeout(function(){
		loggr.warn(" > Station is not working");
		loggr.log(" > Timed out");
		mediaPlayer.stop();
		mediaPlayer.release();
		site.ui.hideloading();
		site.ui.showtoast("Station error, please choose another");
	},7500);
	
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























