
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CHANNEL EDIT

site.chicon = {};

// ---> Init

site.chicon.init = function(station_id) {

	loggr.debug("------------------------------------");
	loggr.debug("site.chicon.init()");

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
				if (!result) { continue; }

				var resultitem = document.createElement("div");
				resultitem.className = "resultitem_chicon shadow_z1 activatablel";
				resultitem.innerHTML = '<div class="center_table"><div class="center_td">'
					+ '<img class="resulticon_chicon" src="'+ result +'" '
						+'onerror="$(this.parentNode.parentNode.parentNode).remove();"'
						+'/>'
					+ '</div></div>'
					;


				// Append
				wrap.appendChild(resultitem);

			}

			var resultitem;
			var resultspace;

			// Default icon..
			resultitem = document.createElement("div");
			resultitem.className = "resultitem_chicon shadow_z1 activatablel";
			resultitem.innerHTML = '<div class="center_table"><div class="center_td">'
				+ '<img class="resulticon_chicon" src="img/icons-80/ic_station_default.png" />'
				+ '</div></div>'
				;

			// Append
			wrap.appendChild(resultitem);

			// Spacer icon..
			resultspace = document.createElement("div");
			resultspace.style.position = "relative";
			resultspace.style.clear = "both";
			resultspace.style.width = "48px";
			resultspace.style.height = "48px";

			// Append
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
			var snip = "<div class='gsc-branding shadow_z1u'>Powered by <b>Google Image Search</b></div>";
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
			targ.src = "http://rejh.nl/icerrr/img/web_hi_res_512_002.jpg";

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
	station_data.station_image = target.src; // also finds image.. should do this for all?
	station_data.station_image_local = null;
	station_data.station_icon_local = null;
	site.chicon.updateLockscreenArtworkData(station_data);
	var station_index = site.helpers.session.getStationIndexById(station_data.station_id);
	site.data.stations[station_index] = jQuery.extend(true, {}, station_data);

	// Update currentstation if needed
	if (site.session.currentstation_id == station_data.station_id) {
		site.session.currentstation = station_data;
	}

	// Find changes for alarms?
	try {
		var alarmsChanged = false;
		for (var i=0; i<site.session.alarms.length; i++) {
			var alarm = site.session.alarms[i];
			if (alarm.station.station_id == station_data.station_id) {
				loggr.warn(" -> Update alarm.station: "+ alarm.station.station_id +" for alarm: "+ i,{dontsave:true});
				site.session.alarms[i].station = station_data;
				alarmsChanged = true;
			} else {
				continue;
			}
		}
		if (alarmsChanged) {
			site.helpers.storeSession();
		}
	} catch(e) {
		loggr.warn(" > Could not check alarms: "+e);
	}

	// Loading
	site.ui.showloading(null,"Just. One. More. Second...");

	// Write file
	// TODO: problem with site.storage.isBusy: what do we do when it's busy? retry?
	site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),
		function(evt) {

			site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json"); // TODO: do something with flagged files..

			// Get imagery
			site.chicon.downloadImagery(station_data,
				function(station) {

					// Goto ...
					var thissection = site.lifecycle.get_section_history_item(); // remove self from list
					var lastsection = site.lifecycle.get_section_history_item();
					//site.chedit.changesHaveBeenMadeGotoStarred = true;
					site.chedit.changesHaveBeenMade = true;
					if (lastsection=="#editstation") {
						site.chedit.init(site.chicon.station.station_id);
					} else if (thissection=="#editstation") {
						//site.detailstation.init({station_id:site.chicon.station.station_id},true);
						site.chedit.init(site.chicon.station.station_id, site.chedit.askedAboutStationName, site.chedit.askedAboutNowplaying, site.chedit.checkedPlayability, site.chedit.isPlayable);
					} else {
						site.chedit.changesHaveBeenMadeGotoStarred = true;
						site.chlist.init(); // pretty much every other scenario..
					}

				},
				null
			);


		},
		function(e){
			alert("Error writing to filesystem: "+site.storage.getErrorType(e));
			loggr.log(site.storage.getErrorType(e));
			site.ui.hideloading();
		}
	);




}

// Lockscreen artwork

site.chicon.updateLockscreenArtworkData = function(station_data) {

	loggr.debug("site.chicon.updateLockscreenArtworkData()");

	// Get data from service..
	window.mediaStreamer.getSetting("string","temp_station_image_data",
		function(res) {

			var newData = {};

			loggr.log(res);
			var tmpStationImageData = JSON.parse(res);
			for (var station_id in tmpStationImageData) {

				if (station_id == station_data.station_id) {
					loggr.log(" -> FOUND: "+ station_id);
				} else {
					newData[station_id] = tmpStationImageData[station_id];
				}

			}

			newDataStr = JSON.stringify(newData);
			loggr.log(newDataStr);

			// -> Write to service
			window.mediaStreamer.setting("string","temp_station_image_data",newDataStr,
				function(res) {
					loggr.log(" -> Saved temp_station_image_data");
				},
				function(err) {
					loggr.error(err);
				}
			);

		},
		function(err) {
			loggr.error(err);
		}
	);

}

// Download imagery

site.chicon.downloadImagery = function(station, cb, cberr) {

	loggr.log("site.chicon.downloadImagery(): "+ station.station_id);

	// Check if local (default)
	if (!station.station_icon || station.station_icon=="img/icons-80/ic_station_default.png" || station.station_icon.indexOf("file://")>=0) {

		loggr.log(" > Local icon ("+ station.station_icon +"), what now..?");

		var tmpimage = new Image();
		tmpimage.onload = function() {
			console.error(this.src);
		}
		tmpimage.src = "img/icons-80/ic_station_default.png";

		var stationIndex = site.helpers.session.getStationIndexById(station.station_id);
		if (stationIndex<0) { return; }
		site.data.stations[stationIndex].station_icon = "file:///android_asset/www/img/icons-80/ic_station_default.png";
		site.data.stations[stationIndex].station_image = "file:///android_asset/www/img/web_hi_res_512_002.jpg";
		site.data.stations[stationIndex].station_icon_local = "file:///android_asset/www/img/icons-80/ic_station_default.png";
		site.data.stations[stationIndex].station_image_local = "file:///android_asset/www/img/web_hi_res_512_002.jpg"
		site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),function(){},function(){});

		site.chicon.downloadedIcon = true; // TODO: not true
		site.chicon.downloadedImage = true; // TODO: not true
		site.chicon.downloadedImagery(site.data.stations[stationIndex],cb,cberr);

		return;

	}

	// Reset..
	station.station_icon_local = null;
	station.station_image_local = null;

	// Bla
	site.chicon.downloadedIcon = false;
	site.chicon.downloadedImage = false;

	// Icon..
	if (station.station_icon && site.helpers.shouldDownloadImage(station.station_icon_local,station.station_icon)) {
		var stationIndex = site.helpers.session.getStationIndexById(station.station_id);
		var filename = site.helpers.imageUrlToFilename(station.station_icon,"station_icon_"+station.station_name.split(" ").join("-").toLowerCase(),false);
		site.data.stations[stationIndex].station_icon_orig = station.station_icon // store original
		site.helpers.downloadImage(null, filename, site.cfg.urls.webapp +"rgt/rgt.php?w=80&h=80&src="+ station.station_icon,
			function(fileEntry,imgobj) {
				var stationIndex = site.helpers.session.getStationIndexById(station.station_id);
				if (stationIndex<0) { return; }
				loggr.log(" > DL "+ stationIndex +", "+ fileEntry.fullPath);
				site.data.stations[stationIndex].station_icon_local = fileEntry.fullPath;
				site.data.stations[stationIndex].station_edited["station_icon_local"] = new Date().getTime();
				site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json");
				site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),function(){},function(){});
				site.chicon.downloadedIcon = true;
				site.chicon.downloadedImagery(site.data.stations[stationIndex],cb,cberr);
			},
			function(error,imgobj) {
				loggr.error(" > Error downloading '"+ station.station_icon +"'",{dontupload:true});
				console.error(error);
				if (imgobj) { imgobj.src = "img/icons-80/ic_station_default.png"; }
				site.chicon.downloadedIcon = true; // TODO: not true
				site.chicon.downloadedImagery(station,cb,cberr);
			}
		);
	} else {
		site.chicon.downloadedIcon = true; // TODO: not true
		site.chicon.downloadedImagery(station,cb,cberr);
	}

	// Image..
	if (!station.station_image && station.station_icon) {
		loggr.warn(" > Copy station_icon to station_image..");
		station.station_image = station.station_icon
	}
	if (station.station_image && site.helpers.shouldDownloadImage(station.station_image_local,station.station_image)) {
		if (!station.station_image) { station.station_image = station.station_icon; }
		var stationIndex = site.helpers.session.getStationIndexById(station.station_id);
		var filename = site.helpers.imageUrlToFilename(station.station_image,"station_image_"+station.station_name.split(" ").join("-").toLowerCase(),false);
		site.data.stations[stationIndex].station_image_orig = station.station_image // store original
		site.helpers.downloadImage(null, filename, station.station_image,
			function(fileEntry,imgobj) {
				var stationIndex = site.helpers.session.getStationIndexById(station.station_id);
				if (stationIndex<0) { return; }
				loggr.log(" > DL "+ stationIndex +", "+ fileEntry.fullPath);
				site.data.stations[stationIndex].station_image_local = fileEntry.fullPath;
				site.data.stations[stationIndex].station_edited["station_image_local"] = new Date().getTime();
				site.helpers.flagdirtyfile(site.cfg.paths.json+"/stations.json");
				site.storage.writefile(site.cfg.paths.json,"stations.json",JSON.stringify(site.data.stations),function(){},function(){});
				site.chicon.downloadedImage = true;
				site.chicon.downloadedImagery(site.data.stations[stationIndex],cb,cberr);
			},
			function(error,imgobj) {
				loggr.error(" > Error downloading '"+ station.station_image +"'",{dontupload:true});
				console.error(error);
				if (imgobj) { imgobj.src = "img/icons-80/ic_station_default.png"; }
				site.chicon.downloadedImage = true; // TODO: not true
				site.chicon.downloadedImagery(station,cb,cberr);
			}
		);
	} else {
		site.chicon.downloadedImage = true; // TODO: not true
		site.chicon.downloadedImagery(station,cb,cberr);
	}

}

site.chicon.downloadedImagery = function(station,cb,cberr) {

	if (site.chicon.downloadedIcon && site.chicon.downloadedImage) {
		setTimeout(function(){

			loggr.debug("site.chicon.downloadedImagery()");

			if (station.station_icon_local && station.station_image_local) {
				if (cb) { cb(station); }
			} else {
				if (cberr) { cberr(station); }
			}

		},500);
	}

}

// ---> Import

site.chicon.importQuick = function(station_id) {
	if (!site.chicon.station) { site.chicon.station = {}; }
	site.chicon.station.station_id = station_id;
	site.chicon.import();
}

site.chicon.import = function(evt) {

	loggr.log("site.chicon > import icon...");

	if (site.cookies.get("warnedImportIconGooglePhotosAndDrive")!=1) {
		site.cookies.put("warnedImportIconGooglePhotosAndDrive",1);
		if (!confirm("A fair warning: This feature is experimantal.\n\nContinue?")) {
			return;
		}
	}

	var imageOptions = {
		quality : 75,
		correctOrientation: true, // < FIXME does this work?? // NOPE it doesn't work IF the images are too big, it runs out of memory..
		destinationType : Camera.DestinationType.FILE_URI,
		sourceType : Camera.PictureSourceType.PHOTOLIBRARY ,
		encodingType: Camera.EncodingType.PNG
	};

	navigator.camera.getPicture(
		function(imagePath) { // okidokie

			site.ui.showloading(null,"Processing image...");
			setTimeout(function(){
				site.chicon.uploadImagery(imagePath);
			},500);

		},
		function(message) { // error

			// Catch messages
			switch(message) {
				// Camera cancelled
				case "Selection cancelled.":
				case "Camera cancelled.":
				case "no image selected":
					site.ui.showtoast("Import cancelled");
					site.ui.hideloading();
					break;
				// An actual error accured..?
				default:
					loggr.error("Error importing icon: "+message);
					alert("An error occured: "+ message);
					site.ui.hideloading();
			}

		}, imageOptions
	);

}

site.chicon.uploadImagery = function(imagePath) {

	loggr.debug("site.chicon.uploadImagery()");

	loggr.log(" > "+ imagePath);

	// Check imageData (uri)
	var isHttp = imagePath.indexOf("http")>=0;
	var isHttps = imagePath.indexOf("https")>=0;
	var isLocal = imagePath.indexOf("file://")>=0 || imagePath.indexOf("content://media")>=0;

	if (imagePath.indexOf("file://")<0 && imagePath.indexOf("content://")<0) { imagePath = "content://media"+imagePath; }

	if (imagePath.indexOf("content://")>=0) {

		var destname = site.helpers.replaceAll("%","","tmp_"+ site.storage.getfilename(imagePath));
		window.mediaStreamer.copyMediaBitmap(
			imagePath, site.cfg.paths.other, destname,
			function(filename){

				loggr.warn(" -> "+ filename,{dontsave:true});

				site.storage.getFileEntry(site.cfg.paths.other,filename,
					function(fileEntry) {
						loggr.log(" -> "+ fileEntry.fullPath);
						site.chicon.uploadImagery(fileEntry.fullPath);
					},
					function(error) {
						alert("An error occured: "+ error.code);
					}
				);

			},
			function(err) {
				alert(err);
			}
		);
		return;

	}

	// Get path + name
	var path = site.storage.getpath(imagePath);
	var name = site.storage.getfilename(imagePath);
	loggr.log(" -> "+ path +", "+ name);

	// Unique name..
	var uniqname = site.helpers.imageUrlToFilename(name,"station_icon_"+ site.helpers.getUniqueID());
	loggr.log(" -> "+ uniqname);

	// Filetype?
	var mimetype = "image/jpeg";
	var ext = site.helpers.imageUrlToFilename(name,null,true,true);
	if (ext && ext.toLowerCase()==".png") { mimetype = "image/png"; }

	// Upload...

	site.ui.showloading(null,"Almost done...");

	// -> Key
	var key = site.helpers.getUniqueID();

	// -> Upload url
	var apiquery = {
		"post":"station_icon",
		"device":site.cookies.get("device_id"),
		"key":key
	}
	loggr.log(" -> Query: "+ JSON.stringify(apiquery));
	var apiquerys = encodeURIComponent(JSON.stringify(apiquery));
	var apiurl = site.cfg.urls.api +"a=post&q="+ apiquerys +"&apikey=REJH_ICERRR_APIKEY-"+ site.helpers.getUniqueID() +"&cache="+(new Date().getTime());

	// Params
	var params = {
		"key":key
	}

	// -> Options
	var options = new FileUploadOptions();
	options.fileKey = "file";
	options.fileName = uniqname;
	options.mimeType = mimetype;
	options.params = params;

	// -> FileTransfer
	var ft = new FileTransfer();
	ft.upload(imagePath,apiurl,
		function(res) {

			loggr.log(JSON.stringify(res));

			jsonresponse = JSON.parse(res.response);
			if (jsonresponse["error"]) {
				loggr.error(" > Could not upload: "+ jsonresponse["errormsg"]);
				alert("An error occured: "+ jsonresponse["errormsg"]);
				site.ui.hideloading();
				return;
			}

			loggr.log(" > Uploaded, responsecode: "+ res.responseCode);
			var iconurl = site.cfg.urls.webapp +"/static/uploaded/" + jsonresponse["data"]["filename"]; // site.cfg.urls.webapp +"/img/uploaded/" + uniqname;

			loggr.log(" > "+ iconurl);

			// Remove file if tmp..
			if (imagePath.indexOf(site.cfg.paths.other)>=0) {
				var delpath = site.storage.getpath(imagePath,1);
				var delname = site.storage.getfilename(imagePath);
				site.storage.deletefile(delpath,delname,function(){},function(){});
			}

			// Fake onclick target and save
			var target = {src:iconurl};
			site.chicon.save(target);


		},
		function(error) {
			loggr.error(" > Could not upload: "+ site.storage.getFileTransferErrorType(error));
			alert("An error occured: "+ site.storage.getFileTransferErrorType(error));
			site.ui.hideloading();
		},
		options
	);

}
