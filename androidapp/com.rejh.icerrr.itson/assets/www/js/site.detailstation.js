
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL LIST

site.detailstation = {};

// ---> Init

site.detailstation.init = function(resultitem, forceRedraw, restoreLast) {
	
	loggr.debug("------------------------------------");
	loggr.debug("site.detailstation.init()");
	
	site.ui.hideloading();
	
	if (restoreLast && !resultitem && site.detailstation.station_id) {
		resultitem = {station_id:site.detailstation.station_id};
	}
	
	// Checks..
	if (!resultitem) { loggr.warn(" > !resultitem",{dontsave:true}); return; }
	if (!resultitem.station_id) { loggr.warn(" > !resultitem.station_id",{dontsave:true}); return; }
	
	// Station id..
	site.detailstation.station_id = resultitem.station_id;
	
	// Station..
	site.detailstation.station = site.helpers.session.getStationById(resultitem.station_id);
	
	// Add lifecycle history
	site.lifecycle.add_section_history("#detailstation");
	
	// Show UI
	site.ui.gotosection("#detailstation");
	
	// Resume + Pause callback for #home
	// Best for last :)
	site.lifecycle.addOnPauseCb(site.detailstation.onpause);
	site.lifecycle.addOnResumeCb(site.detailstation.onresume);
	
	// Reset some stuff..
	site.detailstation.hideRecentlyPlayed();
	
	// Update data..
	site.detailstation.updatedata();
	
}

// PAUSE RESUME
// - Important stuff: this is function that will be called whenever site.ui.gotosection is called

site.detailstation.onpause = function() {
	loggr.debug("site.detailstation.onpause()");
}

site.detailstation.onresume = function() {
	loggr.log("site.detailstation.onresume()");
	if (site.detailstation.loadedStationData && site.detailstation.loadedNowPlaying) {
		site.detailstation.updatedata();
	}
}

// ---> Update Data

site.detailstation.updatedata = function() {
	
	loggr.debug("site.detailstation.updatedata()");
	
	// Reset variables..
	site.detailstation.stationDirble = null;
	site.detailstation.stationPlaylist = null
	
	// Loaded variables..
	site.detailstation.loadedNowPlaying = false;
	site.detailstation.loadedStationData = false;
	
	// Show loading content
	$("#detailstation .content").css("display","none");
	$("#detailstation .content_loading").css("display","block");
	
	// Show loadbar..
	site.ui.showLoadbar("#detailstation");
	
	// Update data that can be done right now..
	// -> Icon, don't cache it that should be done in chlist
	if (site.detailstation.station.station_icon_local) {
		loggr.log(" > Local icon :D");
		$("#detailstation .station_icon img").attr("src",site.detailstation.station.station_icon_local);
	} else {
		loggr.warn(" > No local icon :(",{dontsave:true});
		$("#detailstation .station_icon img").attr("src","img/ic_station_default.png");
	}
	// -> Image
	if (site.detailstation.station.station_image_local) {
		$("#detailstation .station_image img").attr("src",site.detailstation.station.station_image_local);
	} else if (site.detailstation.station.station_icon_local) {
		$("#detailstation .station_image img").attr("src",site.detailstation.station.station_icon_local);
	} else {
		$("#detailstation .station_image img").attr("src","img/web_hi_res_512_002.jpg");
	}
	// Background image
	if (site.detailstation.station.station_image_local) {
		$("#detailstation .main .header").css("background-image","url('"+ site.detailstation.station.station_image_local +"')");
	} else {
		$("#detailstation .main .header").css("background-image","url('img/bg_home_default.jpg')");
	}
	// -> Station name
	$("#detailstation .station_name").html(site.detailstation.station.station_name);
	// -> Station nowplaying
	$("#detailstation .station_nowplaying").html("Now playing: ...");
	// -> Starred
	if (site.chlist.isStarred(site.detailstation.station_id)) { $("#detailstation .station_starred img").attr("src","img/icons-48/ic_starred_orange.png"); } 
	else { $("#detailstation .station_starred img").attr("src","img/icons-48/ic_star.png"); }
	
	// Events
	// -> Starred
	$("#detailstation .station_starred img").off("click");
	$("#detailstation .station_starred img").on("click",function(evt){
		site.chlist.toggleStarred(site.detailstation.station_id);
		if (site.chlist.isStarred(site.detailstation.station_id)) { 
			$("#detailstation .station_starred img").attr("src","img/icons-48/ic_starred_orange.png"); 
			site.chedit.changesHaveBeenMadeGotoStarred = true;
		} else { 
			$("#detailstation .station_starred img").attr("src","img/icons-48/ic_star.png"); 
		}
		site.chedit.changesHaveBeenMade = true;
	});
	
	// Update station data..
	site.detailstation.updateDataStationData();
	
	// Update now playing..
	site.detailstation.updateDataNowPlaying();
	
	// For now just do play button -> selectstation
	// TODO: yea, do stuff..
	$("#detailstation .fab_header").off("click");
	$("#detailstation .fab_header").on("click",function(evt) {
		var tmpobj = {station_id:site.detailstation.station_id};
		site.chlist.selectstation(tmpobj);
	});
	
	$("#detailstation .recentlyplayed").off("click");
	$("#detailstation .recentlyplayed").on("click",function(evt) {
		// alert("Not available at this moment :(");
		if (evt.originalEvent.target.parentNode && evt.originalEvent.target.parentNode.className.indexOf("recentlyplayed")>=0
			|| evt.originalEvent.target.parentNode.parentNode && evt.originalEvent.target.parentNode.parentNode.className.indexOf("recentlyplayed")>=0
			) {
			site.detailstation.drawRecentlyPlayed();
		}
	});
	
	$("#detailstation .editdetails").off("click");
	$("#detailstation .editdetails").on("click",function(evt) {
		site.chedit.init(site.detailstation.station_id);
	});
}

// Update Station Data

site.detailstation.updateDataStationData = function() {
	
	loggr.log("site.detailstation.updateDataStationData()");
	
	// Check if dirble_id
	if (!site.detailstation.station.dirble_id) {
		site.ui.showtoast("Dirble info not available :(");
		site.detailstation.updatedDataStationData();
		return; // <- :d
	}
	
	// Get dirble station data..
	var apiqueryobj = {
		"get":"station_info_dirble_v2",
		"dirble_id":site.detailstation.station.dirble_id
	}
	
	var apiaction = "get";
	var apiquerystr = JSON.stringify(apiqueryobj);
	
	site.webapi.exec(apiaction,apiquerystr,
		function(data) {
					
			data = data["data"];
			
			// Save..
			site.detailstation.stationDirble = data;
			
			// Get playlist..
			var apiqueryobj = {
				"get":"playlist_dirble_v2",
				"dirble_id":site.detailstation.station.dirble_id
			}
			var apiaction = "get";
			var apiquerystr = JSON.stringify(apiqueryobj);
			
			site.webapi.exec(apiaction,apiquerystr,
				function(data) {
					
					data = data["data"];
					
					// Save..
					site.detailstation.stationPlaylist = data;
					
					// Update recently played subtitle
					var subtitle = "";
					for (var i=0; i<3; i++) {
						if (!data[i]) { break; }
						subtitle += data[i].title +", ";
					}
					subtitle += "...";
					$("#detailstation .recentlyplayed .subtitle").html(subtitle);
					
					// Done..
					site.detailstation.updatedDataStationData();
					
				},
				function(error) {
					if (error.message) { site.ui.showtoast(error.message); loggr.warn(error.message); }
					else { loggr.log(error); }
					site.ui.showtoast("Recently played not available :(");
					site.detailstation.updatedDataStationData();
				}
			);
			
		},
		function(error) {
			if (error.message) { site.ui.showtoast(error.message); loggr.warn(error.message); }
			else { loggr.log(error); }
			site.ui.showtoast("Recently played not available :(");
			site.detailstation.updatedDataStationData();
		}
	);
	
}

site.detailstation.updatedDataStationData = function() {
	site.detailstation.loadedStationData = true;
	site.detailstation.updatedData();
}

// Update Now Playing

site.detailstation.updateDataNowPlaying = function() {
	
	loggr.log("site.detailstation.updateDataNowPlaying()");
	
	site.ui.showLoadbar();
	
	var apiqueryobj = {
		"get":"station_info",
		"station_id":site.detailstation.station.station_id,
		"station_host":site.detailstation.station.station_host,
		"station_port":site.detailstation.station.station_port,
		"station_path":site.detailstation.station.station_path
	}
	
	var apiaction = "get";
	var apiquerystr = JSON.stringify(apiqueryobj);
	
	site.webapi.exec(apiaction,apiquerystr,
		function(data) {
			
			$("#detailstation .station_nowplaying").html(site.home.formatNowPlaying(data["data"]["nowplaying"]));
			site.detailstation.updatedDataNowPlaying();
			
		},
		function(error) {
			if (error.message) { site.ui.showtoast(error.message); loggr.warn(error.message); }
			else { loggr.log(error); }
			$("#detailstation .station_nowplaying").html("Now playing: Unknown");
			site.detailstation.updatedDataNowPlaying();
		}
	);
	
}

site.detailstation.updatedDataNowPlaying = function() {
	site.detailstation.loadedNowPlaying = true;
	site.detailstation.updatedData();
}

// Updated data

site.detailstation.updatedData = function() {
	
	// When done..
	if (site.detailstation.loadedStationData && site.detailstation.loadedNowPlaying) {
		
		loggr.debug("site.detailstation.updatedData() > Done!");
		
		site.ui.hideLoadbar("#detailstation");
		
		$("#detailstation .content").css("display","block");
		$("#detailstation .content_loading").css("display","none");
		
		if (!site.detailstation.stationPlaylist) {
			$("#detailstation .recentlyplayed").css("display","none");
		} else {
			$("#detailstation .recentlyplayed").css("display","block");
		}
	}
	
}

// ---> Draw recently played

site.detailstation.drawRecentlyPlayed = function(closeit) {
	
	loggr.debug("site.detailstation.drawRecentlyPlayed()");
	
	if (site.detailstation.stationPlaylist.length<=0) {
		alert("Recently played not available");
		return; // <- :D
	}
	
	// Remove if already drawn..
	if ($("#detailstation .recentlyplayed .inline_list").length>0 || closeit) {
		site.detailstation.hideRecentlyPlayed();
		return;
	}
	
	// swap icon
	$("#detailstation .recentlyplayed .icon img").attr("src","img/icons-48/ic_collapse_black.png");
	
	// inline list
	var inline_list = document.createElement("div");
	inline_list.className = "inline_list";
	
	// Current nowplaying..
	var npparts = $("#detailstation .station_nowplaying").html().split(" - ");
	var npartist = npparts[0];
	var nptitle = (npparts[1]) ? npparts[1] : "Not available";
	var nowItemData = {name:npartist,title:nptitle};
	site.detailstation.buildRecentlyPlayedItem(inline_list,nowItemData);
	
	// Build..
	for (var i=0; i<site.detailstation.stationPlaylist.length; i++) {
		var playlistItemData = site.detailstation.stationPlaylist[i];
		site.detailstation.buildRecentlyPlayedItem(inline_list,playlistItemData);
	}
	
	var divider = document.createElement("div");
	divider.className = "divider";
	inline_list.appendChild(divider);
	// inline_list.innerHTML += "<div class='divider'></div>";
	
	$("#detailstation .recentlyplayed").append(inline_list);
	
	$("#detailstation .recentlyplayed").css("height", 73 + ((site.detailstation.stationPlaylist.length+1)*72) );
	$(inline_list).css("height", (site.detailstation.stationPlaylist.length+1)*72);
	
}

site.detailstation.buildRecentlyPlayedItem = function(inline_list,playlistItemData) {
	
	if (!playlistItemData) {
		loggr.warn("site.detailstation.buildRecentlyPlayedItem() > !playlistItemData",{dontsave:true});
		return;
	}
	
	var plitem = document.createElement("div");
	plitem.className = "playlist_item";
	
	var plname = document.createElement("div");
	plname.className = "playlist_item_name";
	plname.innerHTML = site.helpers.capAll(playlistItemData["name"]);
	
	var pltitle = document.createElement("div");
	pltitle.className = "playlist_item_title";
	pltitle.innerHTML = site.helpers.capAll(playlistItemData["title"]);
	
	var plspotify = new Image();
	plspotify.className = "playlist_item_spotify activatablel";
	plspotify.src = "img/icons-48/ic_spotify_black.png";
	plspotify.title = "Search track on Spotify";
	plspotify.sartist = encodeURI(playlistItemData["name"]);
	plspotify.stitle = encodeURI(playlistItemData["title"]);
	plspotify.onclick = function() {
		//console.error("CLICK!");
		window.open("https://play.google.com/store/search?c=music&q="+ this.sartist +" "+ this.stitle,"_system");
	};
	
	var plsgpmusic = new Image();
	plsgpmusic.className = "playlist_item_gpmusic activatablel";
	plsgpmusic.src = "img/icons-48/ic_googleplaymusic_black.png";
	plsgpmusic.title = "Search track on Google Play Music";
	plsgpmusic.sartist = encodeURI(playlistItemData["name"]);
	plsgpmusic.stitle = encodeURI(playlistItemData["title"]);
	plsgpmusic.onclick = function() {
		//console.error("CLICK!");
		window.open("https://play.google.com/store/search?c=music&q="+ this.sartist +" "+ this.stitle,"_system");
	};
	
	plitem.appendChild(plname);
	plitem.appendChild(pltitle);
	plitem.appendChild(plspotify);
	plitem.appendChild(plsgpmusic);
	
	inline_list.appendChild(plitem);
	
}

// Hide recently played

site.detailstation.hideRecentlyPlayed = function() {
	$("#detailstation .recentlyplayed .icon img").attr("src","img/icons-48/ic_recentlyplayed_black.png");
	$("#detailstation .recentlyplayed").css("height",72);
	setTimeout(function(){
		$("#detailstation .recentlyplayed .inline_list").remove();
	},500);
}

// ---> Colorize :D

site.detailstation.handleColorize = function(imgobj) {
	
	var vibrant = new Vibrant(imgobj,32,10);
	var swatches = vibrant.swatches();
	if (swatches["Vibrant"]) {
		$("#detailstation .main .header").css("background-color",swatches["Vibrant"].getHex());
	} else {
		$("#detailstation .main .header").css("background-color","#455A64");
	}
	
}













