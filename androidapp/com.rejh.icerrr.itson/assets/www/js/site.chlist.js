
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL LIST

site.chlist = {};

// ---> Init

site.chlist.init = function(forceRedraw) {

	loggr.debug("------------------------------------");
	loggr.debug("site.chlist.init()");

	site.ui.hideloading();

	// Bzzzt
	if (site.cookies.get("upgrade_starred_stations")==1) {
		loggr.error(" > Upgrade starred stations",{dontupload:true});
		site.chlist.upgradeStarred();
		site.cookies.put("upgrade_starred_stations",0);
	}

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
	site.vars.touch = {};
	site.chlist.currenttab = site.session.chlist_currenttab;
	if (!site.chlist.currenttab) { site.chlist.currenttab = "stations"; }
	site.chlist.main_scrollTop = site.session.chlist_main_scrollTop;
	if (!site.chlist.main_scrollTop) { site.chlist.main_scrollTop = 0; }

	// Tabs activator
	if (site.chlist.currenttab=="stations") {
		$("#channellist .tabbar .tab").removeClass("active");
		$("#channellist .tabbar .tab.stations").addClass("active");
		$("#channellist .tabbar .tabline").css({"transform":"translate3d(0px,0px,0px)","-webkit-transform":"translate3d(0px,0px,0px)"});
	} else {
		$("#channellist .tabbar .tab").removeClass("active");
		$("#channellist .tabbar .tab.starred").addClass("active");
		$("#channellist .tabbar .tabline").css({"transform":"translate3d("+ Math.round($(window).width()/2) +"px,0px,0px)","-webkit-transform":"translate3d("+ Math.round($(window).width()/2) +"px,0px,0px)"});
	}

	// Draw results
	site.chlist.drawResults(site.session.chlist_pagenum,forceRedraw);

	// hacks..
	site.ui.hackActiveCssRule();

	// Restore scroll
	if (site.chlist.main_scrollTop) {
		//$("#channellist .main").scrollTop(site.chlist.main_scrollTop);
	}

	// Scroll listener -> Hide fab :D
	site.ui.initFabScroll("#channellist");

	// Resume + Pause callback for #home
	// Best for last :)
	site.lifecycle.addOnPauseCb(site.chlist.onpause);
	site.lifecycle.addOnResumeCb(site.chlist.onresume);

	// Hide toasts if any..
	if ($("#overlay_toast").hasClass("top")) {
		site.ui.hidetoast();
	}

	// Hide loading..
	site.ui.hideloading();

	// Swipe ctrl!
	site.chlist.initSwipeCtrl();

}

// PAUSE RESUME
// - Important stuff: this is function that will be called whenever site.ui.gotosection is called

site.chlist.onpause = function() {
	loggr.debug("site.chedit.onpause()");
	site.session.chlist_currenttab = site.chlist.currenttab;
	site.session.chlist_main_scrollTop = site.chlist.main_scrollTop;
	site.chlist.stopSwipeCtrl();
}

site.chlist.onresume = function() {
	loggr.log("site.chedit.onresume()");
	site.chlist.initSwipeCtrl();
}

// ---> Tabs

site.chlist.ontabclick = function(tabObj) {

	loggr.debug("site.chlist.ontabclick(): "+ tabObj.className);

	// Detect
	var tab = "stations";
	if (tabObj.className.indexOf("stations")>=0) {
		tab = "stations";
		var posx = ($(window).width());
	}
	if (tabObj.className.indexOf("starred")>=0) {
		tab = "starred";
		var posx = -($(window).width())
	}

	if (tab!=site.chlist.currenttab) {
		site.vars.touch.tabObj = tabObj;
		site.chlist.movetotab(posx);
	}

}

site.chlist.movetotab = function(posx) {

	loggr.debug("site.chlist.movetotab(): "+ posx);

	if (!site.vars.touch) { site.vars.touch = {}; }
	if (!site.vars.touch.tabObj) {
		site.vars.touch.tabObj = $("#channellist .tabbar .tab.active")[0];
	}

	// Enable transition, wait 1 ms and go
	$("#channellist .main").css("transition","transform 125ms linear");
	site.vars.touch.busy = true;
	setTimeout(function() {

		// Move .main
		var translate = "translate3d("+ posx +"px,0px,0px)";
		$("#channellist .main").css({"transform":translate,"-webkit-transform":translate});

		// Move .tabline
		if (posx<0) { // go to starred
			$("#channellist .tabbar .tabline").css({"transform":"translate3d("+ Math.round($(window).width()/2) +"px,0px,0px)","-webkit-transform":"translate3d("+ Math.round($(window).width()/2) +"px,0px,0px)"});
		} else if (posx>0) { // go to stations
			$("#channellist .tabbar .tabline").css({"transform":"translate3d(0px,0px,0px)","-webkit-transform":"translate3d(0px,0px,0px)"});
		}

		// Wait for animation if posx != 0
		if (posx!=0) {
			setTimeout(function() {

				// disable anims, wait 1ms, then goto tab..
				$("#channellist .main").css("transition","none");
				setTimeout(function(){

					var posxin = 0;
					if (posx>0) { posxin = -($(window).width()) }
					else { posxin = ($(window).width()); }
					var translate = "translate3d("+ posxin +"px,0px,0px)";
					$("#channellist .main").css({"transform":translate,"-webkit-transform":translate});

					setTimeout(function(){

						$("#channellist .main").css("transition","transform 125ms ease-out");
						site.chlist.gototab(site.vars.touch.tabObj);

						setTimeout(function(){

							var translate = "translate3d(0px,0px,0px)";
							$("#channellist .main").css({"transform":translate,"-webkit-transform":translate});

							setTimeout(function(){
								$("#channellist .main").css("transition","none");
								site.vars.touch.busy = false;
							},150);

						},10);

					},10);

				},10);

			},150);
		} else {
			var translate = "translate3d(0px,0px,0px)";
			$("#channellist .main").css({"transform":translate,"-webkit-transform":translate});
			setTimeout(function(){
				$("#channellist .main").css("transition","none");
				site.vars.touch.busy = false;
			},110)
		}

	},10);
}

site.chlist.gototab = function(tabObj) {

	loggr.debug("site.chlist.gototab(): "+ (tabObj) ? tabObj.className : "NULL");

	if (!tabObj) { return; }

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

// ---> Swipes

site.chlist.initSwipeCtrl = function() {

	loggr.debug("site.chlist.initSwipeCtrl()");

	$("#channellist .main").off("touchstart");
	$("#channellist .main").off("touchmove");
	$("#channellist .main").off("touchend");

	$("#channellist .main").on("touchstart",function(ev) {

		if (!site.vars.touch) { site.vars.touch = {}; }

		site.vars.isScrollingV = false;
		site.vars.isScrollingH = false;

		site.vars.touch.bgnt = new Date().getTime();
		site.vars.touch.bgnx = ev.originalEvent.changedTouches[0].clientX
		site.vars.touch.bgny = ev.originalEvent.changedTouches[0].clientY // TODO: not needed?

	});

	$("#channellist .main").on("touchmove",function(ev) {

		if (!site.vars.touch) { site.vars.touch = {}; }

		if (site.vars.touch.busy) {
			return;
		}

		var posx = ( (ev.originalEvent.changedTouches[0].clientX - site.vars.touch.bgnx) );
		var posy = ( (ev.originalEvent.changedTouches[0].clientY - site.vars.touch.bgny) );

		// Prio: vertical scroll
		if (!site.vars.isScrollingH) {
			if (posy<-24 || posy>24 || site.vars.isScrollingV) {
				posx = 0;
				site.vars.isScrollingV = true;
			}
		}
		// Prevent janky stuff
		if (posx>0 && posx<24 || posx<0 && posx>-24) {
			posx = 0;
		} else if (!site.vars.isScrollingV) {
			site.vars.isScrollingH = true;
		}

		var translate = "translate3d("+ posx +"px,0px,0px)";
		$("#channellist .main").css({"transform":translate,"-webkit-transform":translate});

		if (site.vars.isScrollingH) {
			ev.originalEvent.preventDefault();
		}

	});

	$("#channellist .main").on("touchend",function(ev) {

		if (!site.vars.touch) { site.vars.touch = {}; }

		if (!site.vars.isScrollingH) {
			return;
		}

		// Calc posx..
		var posx = ( (ev.originalEvent.changedTouches[0].clientX - site.vars.touch.bgnx) );
		var posy = ( (ev.originalEvent.changedTouches[0].clientY - site.vars.touch.bgny) );

		loggr.log(" > touchend(): "+ posx);

		// Move or tap?
		var t = new Date().getTime();
		if (t-50 < site.vars.touch.bgnt) {
			posx = 0;
		}

		// Move left or right?
		var mindistancex = $(window).width()/4;
		if (posx < -(mindistancex)) {
			if (site.chlist.currenttab=="starred") {
				// can't move in that direction..
				posx = 0;
			} else { // we're in stations, go to starred..
				posx = -($(window).width());
				site.vars.touch.tabObj = $("#channellist .tabbar .tab.starred")[0];
				ev.originalEvent.preventDefault();
			}
		} else if (posx > mindistancex) {
			if (site.chlist.currenttab=="stations") {
				// can't move in that direction..
				posx = 0;
			} else { // we're in starred, go to stations..
				posx = $(window).width();
				site.vars.touch.tabObj = $("#channellist .tabbar .tab.stations")[0];
				ev.originalEvent.preventDefault();
			}
		} else {
			posx = 0;
			//var translate = "translate3d(0px,0px,0px)";
			//$("#channellist .main").css({"transform":translate,"-webkit-transform":translate});
		}

		site.chlist.movetotab(posx);

	});

}

site.chlist.stopSwipeCtrl = function() {

	loggr.debug("site.chlist.stopSwipeCtrl()");

	$("#channellist .main").off("touchstart");
	$("#channellist .main").off("touchmove");
	$("#channellist .main").off("touchend");

}

// ---> Draw results..

site.chlist.drawResults = function(pagenum,forcerun) {

	loggr.debug("site.chlist.drawResults()");

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
		resulticon.className = "resulticon shadow_z1";
		resulticon.station_id = station.station_id;
		resulticon.addEventListener("error",function(ev){

			var sid = ev.target.station_id;
			var station = site.helpers.session.getStationById(sid)

			if (station && site.helpers.shouldDownloadImage(station.station_icon_local,station.station_icon)) {
				var stationIndex = site.helpers.session.getStationIndexById(station.station_id);
				var filename = site.helpers.imageUrlToFilename(station.station_icon,"station_icon_"+station.station_name.split(" ").join("-").toLowerCase(),false);
				site.data.stations[stationIndex].station_icon_orig = station.station_icon // store original
				site.helpers.downloadImage(ev.target, filename, site.cfg.urls.webapp +"rgt/rgt.php?w=80&h=80&src="+ station.station_icon,
					function(fileEntry,imgobj) {
						var stationIndex = site.helpers.session.getStationIndexById(imgobj.parentNode.station_id);
						if (stationIndex<0) { return; }
						loggr.log(" > DL "+ stationIndex +", "+ fileEntry.fullPath);
						site.data.stations[stationIndex].station_icon_local = fileEntry.fullPath;
						site.data.stations[stationIndex].station_edited["station_icon_local"] = new Date().getTime();
						site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json");
						site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),function(){},function(){});
					},
					function(error,imgobj) {
						loggr.error(" > Error downloading '"+ station.station_icon +"'",{dontupload:true});
						console.error(error);
						imgobj.src = "img/icons-80/ic_station_default.png";
					}
				);
			} else if (station && ev.target.src != station.station_icon_local) {
				ev.target.src = station.station_icon_local;
			} else {
				ev.target.src = "img/icons-80/ic_station_default.png";
			}

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
				function(error,imgobj) {
					loggr.error(" > Error downloading '"+ station.station_icon +"'",{dontupload:true});
					console.error(error);
					imgobj.src = "img/icons-80/ic_station_default.png";
				}
			);
		} else if (station.station_icon_local) {
			resulticon.src = station.station_icon_local;
		} else {
			resulticon.src = "img/icons-80/ic_station_default.png";
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
				this.src = "img/icons-48/ic_starred_orange.png";
			} else {
				this.src = "img/icons-48/ic_star.png";
			}
			return false;
		}
		if (site.chlist.isStarred(station.station_id)) {
			resultstar.src = "img/icons-48/ic_starred_orange.png";
		} else {
			resultstar.src = "img/icons-48/ic_star.png";
		}

		// TODO: events.. anyone?
		resultitem.onclick = function(){
			// site.chlist.selectstation(this); // well, here's one..
			site.detailstation.init(this);
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

	// Build item spacer for fab
	var resultitem = document.createElement("div");
	resultitem.className = "resultitem resultitem_spacer";
	$("#channellist .main").append(resultitem);

	// update window
	site.lifecycle.onResize();

}

// ---> Select station

site.chlist.selectstation = function(resultitem,dontgohome,dontStopPlaying) {

	loggr.debug("site.chlist.selectstation()");

	loggr.log(" > "+ resultitem.station_id);

	// Save
	site.session.currentstation_id = resultitem.station_id;
	site.session.currentstation = site.data.stations[site.helpers.session.getStationIndexById(resultitem.station_id)];

	// Send to MediaStreamer
	loggr.log(" > Send to MediaStreamer");
	window.mediaStreamer.storeStarredStations(site.session.starred,site.session.currentstation,
		function(res) {

			loggr.log(" > Starred stations sent to MediaStreamer: "+res);

			// Save session
			site.helpers.storeSession();

			// Start selected station if already playing
			if (site.mp.isPlaying && !dontStopPlaying) {
				site.mp.stop(function(){
					//$(".button_play_bufferAnim").fadeIn(500);
					$(".button_play_bufferAnim").css("display","block");
					//site.ui.fadeIn(".button_play_bufferAnim",500);
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

		},
		function(err) {
			loggr.error(" > Error sending starred stations to MediaStreamer",{dontupload:true});
			loggr.error(err);
		}
	);

}

// ---> Find images

site.chlist.imagesearch = function(station_data,fullSizeImage) {

	loggr.debug("site.chlist.imagesearch()");

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
			$("#chlist_resultitem_"+ station_data.station_id +" .resulticon").attr("src","img/icons-80/ic_station_default.png");

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
	loggr.debug("site.chlist.readstations()");
	if (!customCB) { customCB = site.chlist.readstations_cb; }
	site.storage.readfile(site.cfg.paths.json,"stations.json",customCB,site.chlist.readstations_errcb)
}

site.chlist.readstations_cb = function(resultstr) {
	loggr.debug("site.chlist.loadstations_cb()");
	loggr.log(" > "+resultstr.substr(0,64)+"...");
	resultjson = JSON.parse(resultstr);
	if (!resultjson) { alert("site.chlist.readstations_cb().Error: !resultjson"); }
	site.data.stations = resultjson;
	site.chlist.init();
}

site.chlist.readstations_errcb = function(error) {
	loggr.debug("site.chlist.loadstations_errcb()");
	alert("site.chlist.readstations_errcb().Error: "+site.storage.getErrorType(error));
	site.installer.init();
	// TODO: YES.. What now..
}

// ---> Stars

// Is starred

site.chlist.isStarred = function(station_id) {

	//loggr.debug("site.chlist.isStarred(): "+station_id);

	if (!site.session.starred) { return false; }

	for (var i=0; i<site.session.starred.length; i++) {
		//loggr.log(" > "+ site.session.starred[i].station_id);
		if (site.session.starred[i].station_id==station_id) {
			return true;
		}
	}

	return false;


}

// Toggle Starred
// -> convenience :)

site.chlist.toggleStarred = function(station_id) {

	loggr.debug("site.chlist.toggleStarred(): "+station_id);

	if (site.chlist.isStarred(station_id)) {
		site.chlist.unsetStarred(station_id);
		return false; // now unstarred
	} else {
		site.chlist.setStarred(station_id);
		return true; // now starred
	}

}

// Store starred

site.chlist.setStarredByStationObj = function(station) {

	loggr.debug("site.chlist.setStarredByStationObj(): "+station.station_id);

	site.session.starred.unshift(station);
	site.session.starred = site.sorts.station_by_name(site.session.starred); // sort :D

	// Send to MediaStreamer
	window.mediaStreamer.storeStarredStations(site.session.starred,site.session.currentstation,
		function(res) {
			loggr.log(" > Starred stations sent to MediaStreamer");
		},
		function(err) {
			loggr.error(" > Error sending starred stations to MediaStreamer",{dontupload:true});
			loggr.error(err);
		}
	);

	// Store
	site.helpers.storeSession();

}

site.chlist.setStarred = function(station_id) {

	loggr.debug("site.chlist.setStarred(): "+station_id);

	// Create list if it doesn't exist
	if (!site.session.starred) { site.session.starred = []; }

	// Add on TOP of stack :D
	// -> Disadventage of site.data.stations: it's only available when in chlist.. should maybe load this anyway?
	var index = site.helpers.session.getStationIndexById(station_id,site.data.stations);
	var station = site.data.stations[index];

	if (!station || index<0) {
		loggr.error(" > !station ("+ station +") || index<0 ("+ index +")",{dontupload:true});
		loggr.error(" > Could not star station, sorry :(");
		return;
	}

	site.chlist.setStarredByStationObj(station);

}

// Remove starred

site.chlist.unsetStarred = function(station_id) {

	loggr.debug("site.chlist.unsetStarred(): "+station_id);

	var newlist = [];

	if (!site.session.starred) {
		return;
	}

	// Create new list..
	for (var i=0; i<site.session.starred.length; i++) {
		loggr.log(" > "+ site.session.starred[i].station_id);
		if (site.session.starred[i].station_id==station_id) {
			continue; // dont add
		} else {
			newlist.push(site.session.starred[i]);
		}
	}
	if (newlist.length>0) {
		site.session.starred = site.sorts.station_by_name(newlist);
	} else {
		site.session.starred = [];
	}

	// Send to MediaStreamer
	window.mediaStreamer.storeStarredStations(site.session.starred,site.session.currentstation,
		function(res) {
			loggr.log(" > Starred stations sent to MediaStreamer");
		},
		function(err) {
			loggr.error(" > Error sending starred stations to MediaStreamer",{dontupload:true});
			loggr.error(err);
		}
	);

	// Store
	site.helpers.storeSession();

}

// Get favourites
// - Retrieves a list of stations[] that are favourited

site.chlist.getStarred = function() {

	loggr.debug("site.chlist.getStarred()");

	// Empty?
	if (!site.session.starred) {
		loggr.log(" > Nothing starred, return");
		return [];
	}

	// New list
	var newlist = [];

	// Walk
	for (var i=0; i<site.session.starred.length; i++) {

		//loggr.error(" > "+ site.session.starred[i].station_name, {dontupload:true});

		var pushed = false;

		var starred = site.session.starred[i];

		for (var j=0; j<site.data.stations.length; j++) {

			var station = site.data.stations[j];

			if (starred.station_id==station.station_id) {
				//loggr.error(" -> FOUND "+ site.session.starred[i].station_name, {dontupload:true});
				pushed = true;
				newlist.push(station);
			}

		}

		if (!pushed) {
			//loggr.error(" -> NOT FOUND NOT FOUND "+ site.session.starred[i].station_name, {dontupload:true});
		}

	}

	// Return
	loggr.log(" > Results: "+ newlist.length);
	return newlist;

}

site.chlist.upgradeStarred = function() {

	loggr.debug("site.chlist.upgradeStarred()");

	loggr.log(" > Find starred stations that need upgrading...");

	// Empty?
	if (!site.session.starred) {
		loggr.log(" > Nothing starred, return");
	}

	// Walk
	for (var i=0; i<site.session.starred.length; i++) {

		var starred = site.session.starred[i];

		for (var j=0; j<site.data.stations.length; j++) {

			var station = site.data.stations[j];

			if (starred.station_id==station.station_id) {
				loggr.log(" >> Upgrade "+ station.station_id);
				site.session.starred[i] = station;
			}

		}

	}

	loggr.log(" > Send to MediaStreamer");
	window.mediaStreamer.storeStarredStations(site.session.starred,site.session.currentstation,
		function(res) {
			loggr.log(" > Starred stations sent to MediaStreamer");
		},
		function(err) {
			loggr.error(" > Error sending starred stations to MediaStreamer",{dontupload:true});
			loggr.error(err);
		}
	);

	site.helpers.storeSession();

}
