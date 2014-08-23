
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL EDIT

site.chicon = {};

// ---> Init

site.chicon.init = function(station_id) {
	
	loggr.log("site.chicon.init()");
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#searchicon");
	
	// Show UI
	site.ui.gotosection("#searchicon");
			
	// Clear
	$("#searchicon .main").html("");
	
	// Get data
	var stationIndex = site.helpers.session.getStationIndexById(station_id);
	if (stationIndex<0) { site.ui.showtoast("Error"); return; }
	var station_data = site.data.stations[stationIndex];
	
	if (!station_data) { 
		loggr.log(" > !station_data:");
		loggr.log(" > "+ JSON.stringify(station_data));
		return;
	}
	
	site.chicon.station = station_data;
	
	// HELP: https://developers.google.com/image-search/v1/devguide
	
	// Prep data || TODO: need more info, 'radio 1' returns image for bbc radio 1
	var searchstring = ""
		+ "\""+ station_data.station_name +"\" "
		+ station_data.station_country +" "
		+ "logo icon";
	
	var opts = {
		restrictions:[
			[google.search.ImageSearch.RESTRICT_FILETYPE, google.search.ImageSearch.FILETYPE_PNG],
			[google.search.ImageSearch.RESTRICT_IMAGESIZE, google.search.ImageSearch.IMAGESIZE_MEDIUM]
		]
	}
	
	site.ui.showloading();
	
	site.helpers.googleImageSearch(searchstring,
		function(results) {
			
			loggr.log(" > "+ results.length +" result(s)");
	
			site.ui.hideloading();
			
			// Create html..
			var wrap = document.createElement("div");
			wrap.className = "resultwrap_chicon";
			
			for (var i in results) {
				
				var result = results[i];
				
				var resultitem = document.createElement("div");
				resultitem.className = "resultitem_chicon shadow_z2";
				resultitem.innerHTML = '<div class="center_table"><div class="center_td">'
					+ '<img class="resulticon_chicon" src="'+result.url+'" '
						+'onerror="$(this.parentNode.parentNode.parentNode).remove();"'
						+'/>'
					+ '</div></div>'
					;
				
				
				// Append
				wrap.appendChild(resultitem);
				
			}
			
			// Default icon..				
			var resultitem = document.createElement("div");
			resultitem.className = "resultitem_chicon shadow_z1 activatabled";
			resultitem.innerHTML = '<div class="center_table"><div class="center_td">'
				+ '<img class="resulticon_chicon" src="img/icons-48/ic_launcher.png" />'
				+ '</div></div>'
				;
			
			
			// Append
			wrap.appendChild(resultitem);
			
			// Append
			$("#searchicon .main").append("<div class='resultheader'>Choose an icon for '"+ site.chicon.station.station_name +"'</div>");
			$("#searchicon .main").append(wrap);
			
			// Append branding..
			// results.getBranding(opt_element?, opt_orientation?)
			var snip = site.helpers.getGoogleImageSearchBranding();
			snip = "<div class='gsc-branding shadow_z1u'>Powered by <b>Google Image Search</b></div>";
			$("#searchicon .main").append(snip);
			
			// Onclick
			$("#searchicon .resulticon_chicon").on("click",function(evt) {
				var target = evt.originalEvent.target;
				site.chicon.save(target);
			});
			
		},
		function() {
			
			// err
			loggr.log(" > No image found...");
			site.chlist.init();
			
		},
		opts
	);
	
	return;
	
	
	
}

// ---> Finishup

site.chicon.save = function(target) {
	
	loggr.log("site.chicon.save()");
	
	loggr.log(" > "+ target.src);
	
	var station_id = site.chicon.station.station_id;
	
	// Get data
	var stationIndex = site.helpers.session.getStationIndexById(station_id);
	if (stationIndex<0) { site.ui.showtoast("Error"); return; }
	var station_data = site.data.stations[stationIndex];
	
	if (!station_data) { 
		loggr.log(" > !station_data:");
		loggr.log(" > "+ JSON.stringify(station_data));
		return;
	}
			
	// And save to stations stuff
	station_data.station_icon = target.src;
	if (!station_data.station_image) { station_data.station_image = target.src; } // also finds image.. should do this for all?
	var station_index = site.helpers.session.getStationIndexById(station_data.station_id);
	site.data.stations[station_index] = jQuery.extend(true, {}, station_data);
	
	// Write file
	// TODO: problem with site.storage.isBusy: what do we do when it's busy? retry?
	site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),
		function(evt) { 
			site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json"); // TODO: do something with flagged files..
			site.chedit.changesHaveBeenMadeGotoStarred = true;
			site.chedit.changesHaveBeenMade = true;
			site.chlist.init();
		},
		function(e){ 
			alert("Error writing to filesystem: "+site.storage.getErrorType(e)); 
			loggr.log(site.storage.getErrorType(e)); 
		}
	);
	
	
	
	
}










