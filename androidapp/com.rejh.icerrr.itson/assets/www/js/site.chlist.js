
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL LIST

site.chlist = {};

// ---> Init

site.chlist.init = function(forceRedraw) {
	
	loggr.info("------------------------------------");
	loggr.info("site.chlist.init()");
	
	site.ui.hideloading();
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#channellist");
	
	// Show UI
	site.ui.gotosection("#channellist");
	
	// Load data (only when needed..)
	if (!site.data.stations) {
		site.chlist.readstations();
		return; // <- important
	}
	
	// Prep some stuff
	site.chlist.currenttab = site.session.chlist_currenttab;
	if (!site.chlist.currenttab) { site.chlist.currenttab = "stations"; }
	site.chlist.main_scrollTop = site.session.chlist_main_scrollTop;
	if (!site.chlist.main_scrollTop) { site.chlist.main_scrollTop = 0; }
	
	// Tabs activator
	if (site.chlist.currenttab=="stations") {
		$("#channellist .tabbar .tab").removeClass("active");
		$("#channellist .tabbar .tab.stations").addClass("active");
	} else {
		$("#channellist .tabbar .tab").removeClass("active");
		$("#channellist .tabbar .tab.starred").addClass("active");
	}
	
	// Draw results
	site.chlist.drawResults(site.session.chlist_pagenum,forceRedraw);
	
	// hacks..
	site.ui.hackActiveCssRule();
	
	// Restore scroll
	if (site.chlist.main_scrollTop) {
		$("#channellist .main").scrollTop(site.chlist.main_scrollTop);
	}
	
	// Scroll listener
	$("#channellist .main").off( 'scroll');
	$("#channellist .main").on( 'scroll', function(evt) {
		site.chlist.main_scrollTop = $("#channellist .main").scrollTop();
	});
	
	// Resume + Pause callback for #home
	// Best for last :)
	site.lifecycle.addOnPauseCb(site.chlist.onpause);
	site.lifecycle.addOnResumeCb(site.chlist.onresume);
	
	site.ui.hideloading();
	
}

// PAUSE RESUME
// - Important stuff: this is function that will be called whenever site.ui.gotosection is called

site.chlist.onpause = function() {
	loggr.info("site.chedit.onpause()");
	site.session.chlist_currenttab = site.chlist.currenttab;
	site.session.chlist_main_scrollTop = site.chlist.main_scrollTop;
}

site.chlist.onresume = function() {
	loggr.log("site.chedit.site.home.()");
	loggr.log(" > Nothing..");
}

// ---> Tabs

site.chlist.ontabclick = function(tabObj) {
	
	loggr.info("site.chlist.ontabclick(): "+ tabObj.className);
	
	// Detect
	var tab = "stations";
	if (tabObj.className.indexOf("stations")>=0) {
		tab = "stations";
	}
	if (tabObj.className.indexOf("starred")>=0) {
		tab = "starred";
	}
	
	$("#channellist .tabbar .tab").removeClass("active");
	$(tabObj).addClass("active");
	
	site.chlist.currenttab = tab;
	site.session.chlist_currenttab = tab;
	site.chlist.drawResults(null,true);
	
	site.lifecycle.onResize();
	
}

// ---> Draw results..

site.chlist.drawResults = function(pagenum,forcerun) {
	
	loggr.info("site.chlist.drawResults()");
	
	// Check if needs to run..
	if (!forcerun && !site.chedit.changesHaveBeenMade) {
		if (site.session.chlist_pagenum || $("#channellist .main div").length > 0) {
			site.ui.hackActiveCssRule();
			return;
		}
	}
	
	// TODO: Check if this code is needed..
	if (site.chedit.changesHaveBeenMadeGotoStarred) {
		site.chedit.changesHaveBeenMadeGotoStarred = false; // need to do this here because we return..
		pagenum = 0;
		site.chlist.ontabclick($(".tab.activatablel.starred")[0]);
		return;
	}
	/**/
	
	forceRedraw = site.chedit.changesHaveBeenMade || site.chedit.changesHaveBeenMadeGotoStarred
	
	site.chedit.changesHaveBeenMade = false;
	
	// Determine sorting..
	var sorter = site.sorts.station_by_name; //function(stations) { return stations; };
	if (site.session.sorting=="id") {
		sorter = site.sorts.station_by_id;
	}
	if (site.session.sorting=="name") {
		sorter = site.sorts.station_by_name;
	}
	
	// Results: stations (all) or starred?
	var stations = [];
	if (site.chlist.currenttab=="stations") {
		loggr.log(" > Draw stations");
		stations = sorter(site.data.stations);
	}
	if (site.chlist.currenttab=="starred") {
		loggr.log(" > Draw starred");
		stations = sorter(site.chlist.getStarred());
		if (!stations.length) { 
			loggr.log(" > Nothin' starred..");
			$("#channellist .main").html('<div class="center_table"><div class="center_td"><div style="width:280px; margin:auto; color:rgba(0,0,0,0.54);">There are no starred stations for you to be searching for.</div></div></div>');
			return;
		}
	}
	
	// Clean main
	$("#channellist .main").html("");
	
	// Set header
	// $("#channellist .main").append('<div class="header">Choose a radio station:</div>');
	
	// Handle page(s)
	if (!pagenum && pagenum!==0) { pagenum = 0; }
	site.session.chlist_pagenum = pagenum;
	
	// (!) Don't draw ALL results, do it in batches...
	// -> TODO: yea but how are we navigating this?
	var maxitems = site.cfg.chlist.maxItemsPerBatch;
	var ibgn = pagenum*site.cfg.chlist.maxItemsPerBatch;
	var imax = (pagenum+1)*site.cfg.chlist.maxItemsPerBatch;
	
	// Init masonry || TODO: handle opts for other formfactors
	site.helpers.masonryinit("#channellist .main");
	
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
		resulticon.addEventListener("error",function(ev){ 
			ev.target.src = "img/icons-48/ic_launcher.png";
		});
		if (site.helpers.shouldDownloadImage(station.station_icon_local,station.station_icon)) {
			var stationIndex = site.helpers.session.getStationIndexById(station.station_id);
			var filename = site.helpers.imageUrlToFilename(station.station_icon,"station_icon_"+station.station_name.split(" ").join("-").toLowerCase(),false);
			site.data.stations[stationIndex].station_icon_orig = station.station_icon // store original
			site.helpers.downloadImage(resulticon, filename, site.cfg.urls.webapp +"rgt/rgt.php?w=80&h=80&src="+ station.station_icon,
				function(fileEntry,imgobj) {
					var stationIndex = site.helpers.session.getStationIndexById(imgobj.parentNode.station_id);
					if (stationIndex<0) { return; }
					loggr.log(" > DL "+ stationIndex +", "+ fileEntry.fullPath);
					site.data.stations[stationIndex].station_icon_local = fileEntry.fullPath;
					site.data.stations[stationIndex].station_edited["station_icon_local"] = new Date().getTime();
					site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json");
					site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),function(){},function(){});
				},
				function(error) {
					loggr.error(" > Error downloading '"+ station.station_icon +"'",{dontupload:true});
					console.error(error);
					resulticon.src = "img/icons-48/ic_launcher.png";
				}
			);
		} else {
			resulticon.src = station.station_icon_local;
		}
		
		var resultname = document.createElement("div");
		resultname.className = "resultname";
		resultname.innerHTML = station.station_name;
		
		var resultstar = document.createElement("img");
		resultstar.className = "resultstar activatablel";
		resultstar.onclick = function(event) {
			event.preventDefault(); 
			event.stopPropagation();
			if (site.chlist.toggleStarred(this.parentNode.station_id)) {
				this.src = "img/icons-48/ic_starred_green.png";
			} else {
				this.src = "img/icons-48/ic_star.png";
			}
			return false;
		}
		if (site.chlist.isStarred(station.station_id)) {
			resultstar.src = "img/icons-48/ic_starred_green.png";
		} else {
			resultstar.src = "img/icons-48/ic_star.png";
		}
		
		// TODO: events.. anyone?
		resultitem.onclick = function(){
			site.chlist.selectstation(this); // well, here's one..
		};
		$(resultitem).longClick(function(obj){
			if (!obj.station_id) { obj = obj.parentNode; }
			navigator.notification.vibrate(100);
			site.chedit.init(obj.station_id);
		},200);
		
		// add elements..
		resultitem.appendChild(resulticon);
		resultitem.appendChild(resultname);
		resultitem.appendChild(resultstar);
		fragment.appendChild(resultitem);
		
		// Store elem
		elems.push(resultitem);
		
	}
	
	// add list
	$("#channellist .main").append(fragment);
	
	// masonry! TODO || TMP: disabled
	// $("#channellist .main").masonry( 'appended', elems )
	
	// TODO: how to load more pages...?
	
	// update window
	site.lifecycle.onResize();
	
}

// ---> Select station

site.chlist.selectstation = function(resultitem,dontgohome) {
	
	loggr.info("site.chlist.selectstation()");
	
	loggr.log(" > "+ resultitem.station_id);
	
	// Save
	site.session.currentstation_id = resultitem.station_id;
	site.session.currentstation = site.data.stations[site.helpers.session.getStationIndexById(resultitem.station_id)];
	
	// Start selected station if already playing
	if (site.mp.isPlaying) {
		site.mp.stop(function(){
			$(".button_play_bufferAnim").fadeIn(500);
			site.mp.play();
		});
	}
	
	// And now?
	if (site.cast.session) {
		site.cast.loadMedia();
	}
	if (!dontgohome) {
		site.home.init();
	}
	
}

// ---> Find images

site.chlist.imagesearch = function(station_data,fullSizeImage) {
	
	loggr.info("site.chlist.imagesearch()");
	
	if (!station_data.station_name) { 
		loggr.log(" > !station_data.station_data:");
		loggr.log(" > "+ JSON.stringify(station_data));
		return;
		}
	
	// HELP: https://developers.google.com/image-search/v1/devguide
	
	// Prep data || TODO: need more info, 'radio 1' returns image for bbc radio 1
	var searchstring = ""
		+ station_data.station_name +" "
		+ station_data.station_country +" "
		+ "logo icon";
	
	var opts = {
		restrictions:[
			[google.search.ImageSearch.RESTRICT_FILETYPE, google.search.ImageSearch.FILETYPE_PNG]
		]
	}
	
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
			$("#chlist_resultitem_"+ station_data.station_id +" .resulticon").attr("src",theresult.url);
			loggr.log(" >> "+ $("#chlist_resultitem_"+ station_data.station_id +" .resulticon").attr("src"));
			
			// And save to stations stuff
			station_data.station_icon = theresult.tbUrl;
			if (!station_data.station_image) { station_data.station_image = theresult.url; } // also finds image.. should do this for all?
			var station_index = site.helpers.session.getStationIndexById(station_data.station_id);
			if (station_index<0) { loggr.warn(" > !station_index"); }
			site.data.stations[station_index] = jQuery.extend(true, {}, station_data);
			
			// Write file
			// TODO: problem with site.storage.isBusy: what do we do when it's busy? retry?
			site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),
				function(evt) { 
					site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json"); // TODO: do something with flagged files..
				},
				function(e){ 
					alert("Error writing to filesystem: "+site.storage.getErrorType(e)); 
					loggr.log(site.storage.getErrorType(e)); 
				}
			);
			
		},
		function() {
			
			// err
			loggr.log(" > No image found...");
			$("#chlist_resultitem_"+ station_data.station_id +" .resulticon").attr("src","img/icons-48/ic_launcher.png");
			
		},
		opts
	);
	
	return;
	
}

site.chlist.imagesearch_cb = function() {
	
	alert("SHOULD NOT FIRE!");
	
}

// ---> Load data

site.chlist.readstations = function(customCB) {
	loggr.info("site.chlist.readstations()");
	if (!customCB) { customCB = site.chlist.readstations_cb; }
	site.storage.readfile(site.cfg.paths.json,"stations.json",customCB,site.chlist.readstations_errcb)
}

site.chlist.readstations_cb = function(resultstr) {
	loggr.info("site.chlist.loadstations_cb()");
	loggr.log(" > "+resultstr.substr(0,64)+"...");
	resultjson = JSON.parse(resultstr);
	if (!resultjson) { alert("site.chlist.readstations_cb().Error: !resultjson"); }
	site.data.stations = resultjson;
	site.chlist.init();
}

site.chlist.readstations_errcb = function(error) {
	loggr.info("site.chlist.loadstations_errcb()");
	alert("site.chlist.readstations_errcb().Error: "+site.storage.getErrorType(error));
	site.installer.init();
	// TODO: YES.. What now..
}

// ---> Stars

// Is starred

site.chlist.isStarred = function(station_id) {
	
	loggr.info("site.chlist.isStarred(): "+station_id);
	
	if (!site.session.starred) { return false; }
	
	for (var i=0; i<site.session.starred.length; i++) {
		if (site.session.starred[i].station_id==station_id) {
			return true;
		}
	}
	
	return false;
	
	
}

// Toggle Starred
// -> convenience :)

site.chlist.toggleStarred = function(station_id) {
	
	loggr.info("site.chlist.toggleStarred(): "+station_id);
	
	if (site.chlist.isStarred(station_id)) {
		site.chlist.unsetStarred(station_id);
		return false // now unstarred
	} else {
		site.chlist.setStarred(station_id);
		return true; // now starred
	}
	
}

// Store starred

site.chlist.setStarred = function(station_id) {
	
	loggr.info("site.chlist.setStarred(): "+station_id);
	
	// Create list if it doesn't exist
	if (!site.session.starred) { site.session.starred = []; }
	
	// Add on TOP of stack :D
	// -> Disadventage of site.data.stations: it's only available when in chlist.. should maybe load this anyway?
	site.session.starred.unshift({
		station_id:station_id
	});
	
}

// Remove starred

site.chlist.unsetStarred = function(station_id) {
	
	loggr.info("site.chlist.unsetStarred(): "+station_id);
	
	var newlist = [];
	
	if (!site.session.starred) {
		return;
	}
	
	for (var i=0; i<site.session.starred.length; i++) {
		if (site.session.starred[i].station_id==station_id) {
			continue; // dont add
		} else {
			newlist.push(site.session.starred[i]);
		}
	}
	
	site.session.starred = newlist;
	
}

// Get favourites
// - Retrieves a list of stations[] that are favourited

site.chlist.getStarred = function() {
	
	loggr.info("site.chlist.getStarred()");
	
	// Empty?
	if (!site.session.starred) { 
		loggr.log(" > Nothing starred, return");
		return []; 
		}
	
	// New list
	var newlist = [];
	
	// Walk
	for (var i=0; i<site.session.starred.length; i++) {
		
		var starred = site.session.starred[i];
		
		for (var j=0; j<site.data.stations.length; j++) {
			
			var station = site.data.stations[j];
			
			if (starred.station_id==station.station_id) {
				newlist.push(station);
			}
			
		}
		
	}
	
	// Return
	loggr.log(" > Results: "+ newlist.length);
	return newlist;
	
}





























