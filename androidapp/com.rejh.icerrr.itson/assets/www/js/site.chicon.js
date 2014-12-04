
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL EDIT

site.chicon = {};

// ---> Init

site.chicon.init = function(station_id) {
	
	loggr.info("------------------------------------");
	loggr.info("site.chicon.init()");
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#searchicon");
	
	// Show UI
	site.ui.gotosection("#searchicon");
			
	// Clear
	$("#searchicon .main").empty();
	loggr.log(" > "+ $("#searchicon .main").length);
	
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
		],
		maxresults:32
	}
	
	site.ui.showloading("Hold on...","Searching Google for icons");
	
	site.helpers.googleImageSearch(searchstring,
		function(results) {
			
			loggr.log(" > "+ results.length +" result(s)");
	
			site.ui.hideloading();
			
			// Create html..
			var wrap = document.createElement("div");
			wrap.className = "resultwrap_chicon";
			
			for (var i in results) {
				
				var result = results[i];
				
				// How can result.url be undefined? Is google trolling me?
				if (!result.url) { continue; }
				
				var resultitem = document.createElement("div");
				resultitem.className = "resultitem_chicon shadow_z1 activatablel";
				resultitem.innerHTML = '<div class="center_table"><div class="center_td">'
					+ '<img class="resulticon_chicon" src="'+ result.url +'" '
						+'onerror="$(this.parentNode.parentNode.parentNode).remove();"'
						+'/>'
					+ '</div></div>'
					;
				
				
				// Append
				wrap.appendChild(resultitem);
				
			}
			
			// Default icon..				
			var resultitem = document.createElement("div");
			resultitem.className = "resultitem_chicon shadow_z1 activatablel";
			resultitem.innerHTML = '<div class="center_table"><div class="center_td">'
				+ '<img class="resulticon_chicon" src="img/icons-48/ic_launcher.png" />'
				+ '</div></div>'
				;
			
			// Spacer icon..				
			var resultspace = document.createElement("div");
			resultspace.style.position = "relative";
			resultspace.style.clear = "both";
			resultspace.style.width = "48px";
			resultspace.style.height = "48px";
			
			// Append
			wrap.appendChild(resultitem);
			wrap.appendChild(resultspace);
			
			// Append
			$("#searchicon .main").html("<div class='resultheader'>Choose an icon for '"+ site.chicon.station.station_name +"'</div>");
			$("#searchicon .main").append(wrap);
			
			// Onclick
			$("#searchicon .resulticon_chicon").on("click",function(evt) {
				var target = evt.originalEvent.target;
				site.chicon.save(target);
			});
			
			// Append branding..
			// results.getBranding(opt_element?, opt_orientation?)
			var snip = site.helpers.getGoogleImageSearchBranding();
			snip = "<div class='gsc-branding shadow_z1u'>Powered by <b>Google Image Search</b></div>";
			$("#searchicon .main").append(snip);
			
			// Center
			var wid = $("#searchicon .resultwrap_chicon").width();
			var space = wid%100;
			$("#searchicon .resultwrap_chicon").css("margin-left",Math.round(space/2));
	
			// update window
			site.lifecycle.onResize();
			
		},
		function() {
			
			// err
			loggr.warn(" > No image found...");
			site.ui.showtoast("No icon(s) found");
			site.ui.hideloading();
			
			// dummy obj
			var targ = new Image();
			targ.onload = function(evt) {
				site.chicon.save(this);
			}
			targ.src = "http://rejh.nl/icerrr/img/web_hi_res_512_001.png";
			
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
	station_data.station_image_local = null;
	station_data.station_icon_local = null;
	if (!station_data.station_image) { station_data.station_image = target.src; } // also finds image.. should do this for all?
	var station_index = site.helpers.session.getStationIndexById(station_data.station_id);
	site.data.stations[station_index] = jQuery.extend(true, {}, station_data);
	
	// Update currentstation if needed
	if (site.session.currentstation_id == station_data.station_id) {
		site.session.currentstation = station_data;
	}
	
	// Write file
	// TODO: problem with site.storage.isBusy: what do we do when it's busy? retry?
	site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),
		function(evt) { 
			site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json"); // TODO: do something with flagged files..
			// Goto ...
			site.lifecycle.get_section_history_item(); // remove self from list
			var lastsection = site.lifecycle.get_section_history_item();
			site.chedit.changesHaveBeenMadeGotoStarred = true;
			site.chedit.changesHaveBeenMade = true;
			if (lastsection=="#editstation") {
				site.chedit.init(site.chicon.station.station_id);
			} else {
				site.chlist.init(); // pretty much every other scenario..
			}
		},
		function(e){ 
			alert("Error writing to filesystem: "+site.storage.getErrorType(e)); 
			loggr.log(site.storage.getErrorType(e)); 
		}
	);
	
	
	
	
}










