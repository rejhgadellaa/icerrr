
// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// HELPERS

site.helpers = {};

// ---> Stations

// Merge Stations
// - Stations1: local copy, station2: remote copy (new)
// - Adds results of stations2 to stations1 without overwriting stations1 || UPDATE: respects 'station_edited' flag

site.helpers.mergeStations = function(stations1,stations2) {
	
	loggr.debug("site.helpers.mergeStations()");
	
	if (!stations1 && !stations2) { return []; }
	else if (!stations1) { return stations2; }
	else if (!stations2) { return stations1; }
	
	// Walk station2
	for (var i=0; i<stations2.length; i++) {
		
		var station1 = null; // will look up later..
		var station2 = stations2[i];
		
		// Find in stations2
		var station1index = site.helpers.session.getStationIndexById(station2.station_id,stations1);
		if (station1index<0 || !station1index) {
			// doesn't exist, just insert
			loggr.log(" > New: "+ station2.station_id);
			stations1.push(station2);
			continue; // <- important
		}
		
		station1 = stations1[station1index];
		
		// Compare values..
		loggr.log(" > Upd: "+ station2.station_id);
		for (var key in station2) {
			
			if (!station1.station_edited) { station1.station_edited = {}; }
			if (!station2.station_edited) { station2.station_edited = {}; }
			
			var edit1 = station1.station_edited[key]
			var edit2 = station2.station_edited[key]
			
			if (!edit1) { edit1 = 0; }
			if (!edit2) { edit2 = 1; }
			
			// Doesn't exist
			if (!station1[key] || !edit1) {
				loggr.log(" >> New key: "+ station2.station_id +": "+ key +", "+ station1[key] +", "+ edit1);
				loggr.log(" >>> Value: "+ station2[key]);
				station1[key] = station2[key];
			}
			// Keep local data when conflicted
			else if (station1[key]!=station2[key] && edit1>edit2) {
				loggr.log(" >> Conflict: "+ station2.station_id +": "+ key +", keep value1");
				loggr.log(" >>> Value1: "+ station1[key]);
				loggr.log(" >>> Value2: "+ station2[key]);
				continue;
			}
			// Overwrite if edit2 is newer
			else if (station1[key]!=station2[key] && edit1<edit2) {
				loggr.log(" >> Conflict: "+ station2.station_id +": "+ key +", overwrite value1");
				loggr.log(" >>> Value1: "+ station1[key]);
				loggr.log(" >>> Value2: "+ station2[key]);
				station1[key] = station2[key];
				continue;
			}
			// Same values..
			else {
				/* TODO: Cleanup
				loggr.log(" >> Else: "+ station2.station_id +": "+ key +", overwrite");
				loggr.log(" >>> Value1: "+ station1[key]);
				loggr.log(" >>> Value2: "+ station2[key]);
				station1[key] = station2[key];
				/**/
			}
			
			
		}
		
		// Store
		stations1[station1index] = station1;
		
	}
	
	return stations1;
	
}

// ---> Images

// Calc average color from image

site.helpers.getImgAvgColor = function(image,x1,y1,x2,y2) {

	// Draw img on canvas..
	var canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	var ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0);
	
	// Get upper pixel data
	var pixelDataUpper = ctx.getImageData(x1, y1, x2, y2).data;
	var pixelDataUpperAveraged = site.helpers.calcAverageColor(pixelDataUpper);
	
	return pixelDataUpperAveraged;
		
}

// Calc Average Color from array

site.helpers.calcAverageColor = function(pixelArray) {
	var r,g,b,a;
	var rt = gt = bt = 0; at=0;
	for (var i=0; i<pixelArray.length; i+=4) {
		rt += pixelArray[i];
		gt += pixelArray[i+1];
		bt += pixelArray[i+2];
		at += pixelArray[i+3];
	}
	var len = pixelArray.length/4;
	r = parseInt(rt/len)
	b = parseInt(bt/len);
	g = parseInt(gt/len);
	a = at/len;
	var ret = new Array(r,g,b,a);
	return ret;
	
}

// Image convert url to filename

site.helpers.imageUrlToFilename = function(url,prefix,isBase64) {
	
	loggr.debug("site.helpers.imageUrlToFilename()");
	
	var filename = "__noname__"+ new Date().getTime();
	
	if (url.indexOf("/")>=0) {
		filename = url.substr(url.lastIndexOf("/")+1);
	} else {
		filename = url;
	}
	
	if (filename.indexOf("?")>=0) {
		filename = filename.substr(0,filename.lastIndexOf("?"));
	}
	
	if (isBase64) {
		filename += ".base64";
	}
	
	filename = prefix +"_"+ new Date().getTime() +"_"+ filename;
	
	return filename;
	
}

// Store image
// - create canvas, draw image on canvas, get base64, write to disk

site.helpers.storeImageLocally = function(imgobj,filename,cb,opts) {
	
	loggr.debug("site.helpers.storeImageLocally()");
	
	// Get base64
	//loggr.log(" > Encode base64...");
	var timebgn = new Date().getTime();
	var base64 = site.helpers.imageToBase64(imgobj);
	var time_encoded = new Date().getTime() - timebgn;
	
	//loggr.log(" >> Base64: "+ base64);
	//loggr.log(" >> "+ time_encoded +" ms");
	
	if (!base64) { return false; }
	
	// Write
	//loggr.log(" > Write: "+filename);
	site.storage.writefile(site.cfg.paths.images,filename,base64,
		function(evt) { cb(evt); },
		function(err) {
			loggr.warn(" > Error writing file "+ filename);
		}
	);
	//
	
	
}

// Get image

site.helpers.getImageLocally = function(imgobj,filepath,filename,fallback,cb,cberr) {
	
	loggr.debug("site.helpers.getImageLocally()");
	
	setTimeout(function() {
	
		// Get filename
		if (filename.indexOf("/")>=0) {
			filename = filename.substr(filename.lastIndexOf("/")+1);
		}
		
		loggr.log(" > "+ filename);
		
		// Read file
		site.storage.readfile(filepath,filename,
			function(data) {
				imgobj.src = data;
				if (cb) { cb(); }
			},
			function(error) {
				loggr.warn(" > site.helpers.getImageLocally.Error: "+ filename);
				loggr.warn(error);
				imgobj.src = fallback;
				if (cberr) { cberr(); }
			},
			null
		);
		
		imgobj.addEventListener("error",
			function(ev){ 
				loggr.warn(" > site.helpers.getImageLocally.Error");
				loggr.warn(" > Could not load "+ ev.target.src);
				$(ev.target).attr("src",fallback);
			}
		);
		
	},1);
	
}

// imageToBase64
// - Returns FALSE if something has gone wrong...

site.helpers.imageToBase64 = function(imgobj,cb,opts) {
	
	// Handle opts
	if (!opts) { opts = {}; }
	if (!opts.maxwidth) { opts.maxwidth = imgobj.naturalWidth; } // Note: dev is responsible for handling aspect!
	if (!opts.maxheight) { opts.maxheight = imgobj.naturalWidth; }
	if (!opts.zoomcrop) { opts.zoomcrop = false; } // TODO: implement
	
	// Create canvas
	var canvas = document.createElement("canvas");
	ctx = canvas.getContext("2d");
	
	// Set width/height to match imageObj
	canvas.width = imgobj.naturalWidth;
	canvas.height = imgobj.naturalWidth;
	
	// Check
	if (!imgobj.naturalWidth || !imgobj.naturalHeight || !opts.maxwidth || !opts.maxheight) {
		return false;
	}
	
	// Draw image
	ctx.drawImage(imgobj, 0, 0, imgobj.naturalWidth, imgobj.naturalWidth, 0, 0, opts.maxwidth, opts.maxheight);
	
	// Now get the base64...
	var base64 = canvas.toDataURL("image/png");
	
	if (base64.indexOf("image/png") == -1) {
		loggr.log("site.helpers.imageToBase64.Error: Unexpected base64 string for "+imgobj.src);
		loggr.log(base64);
		try {
			var imgData = ctx.getImageData(0,0,canvas.width,canvas.height)
			pngFile = generatePng(canvas.width, canvas.height, imgData.data);
			base64 = 'data:image/png;base64,' + btoa(pngFile);
		} catch(e) { 
			// I've really tried everyting, didn't I?
			loggr.log(e);
			base64 = false;
		}
		
	}
	
	// Callback!
	if (cb) { cb(base64); }
	else { return base64; }
	
}

// Create thumb/icon

// TODO: todo

// AspectCalc

site.helpers.calcImageAspect = function(imageObjOrWidth,height) {
	var width;
	if (imageObjOrWidth instanceof Object) {
		width = imageObjOrWidth.width;
		height = imageObjOrWidth.height;
	} else {
		width = imageObjOrWidth;
	}
	// Always return float >= 1.0
	if (width==height) { return 1.0; } // square
	else if (width>height) { return width/height; }
	else { return height/width; }
}

// ---> Calculators

// String to bytes and such

site.helpers.calcStringToKbytes = function(str) {
	return Math.ceil(site.helpers.calcStringToBytes(str)/1024);
}

site.helpers.calcStringToBytes = function(str) {
	if(!str) { str = ""; }
	// Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
	var m = encodeURIComponent(str).match(/%[89ABab]/g);
	return str.length + (m ? m.length : 0);
}

// ---> Sort stuff

site.sorts = {};

// Stations..

// None
site.sorts.station_by_none = function(stations) {
	return stations;
}

// Id
site.sorts.station_by_id = function(stations) {
	var newlist = [];
	var station_ids = [];
	var station_sort_indexes = {};
	for (var i=0; i<stations.length; i++) {
		if (!stations[i]) { continue; }
		station_ids.push(stations[i].station_id);
		station_sort_indexes[stations[i].station_id] = i;
	}
	station_ids.sort();
	for (var i=0; i<station_ids.length; i++) {
		newlist.push(
			stations[ station_sort_indexes[station_ids[i]] ]
		);
	}
	return newlist;
}

// Name
site.sorts.station_by_name = function(stations) {
	if (!stations) { loggr.error("site.sorts.station_by_name().Error: stations='"+station+"'"); }
	var newlist = [];
	var station_ids = [];
	var station_sort_indexes = {};
	for (var i=0; i<stations.length; i++) {
		if (!stations[i]) { continue; }
		station_ids.push(stations[i].station_name);
		station_sort_indexes[stations[i].station_name] = i;
	}
	station_ids.sort();
	for (var i=0; i<station_ids.length; i++) {
		newlist.push(
			stations[ station_sort_indexes[station_ids[i]] ]
		);
	}
	return newlist;
}


// --- > Session stuff

site.helpers.session = {};

site.helpers.storeSession = function() {
	loggr.debug("site.helpers.storeSession()");
	if (!site.session_ready) { // get session before writing
		site.helpers.readSession();
	}
	if (site.session_ready) {
		site.cookies.put("site.session",JSON.stringify(site.session)); // set cookie
		site.storage.writefile(site.cfg.paths.json,"local.site_session.json",site.cookies.get("site.session"), // write
			function() {
				loggr.log("site.helpers.storeSession > write local site.session OK");
			},
			function(err) {
				loggr.log("site.helpers.storeSession > write local site.session Error");
			}
		);
	}
}

site.helpers.readSession = function() {
	loggr.debug("site.helpers.readSession()");
	loggr.log(" > Restore site.session: "+ site.cookies.get("site.session"));
	site.session = JSON.parse(site.cookies.get("site.session"));
	if (!site.session) { 
		loggr.warn(" > Error getting session from cookie, trying storage...");
		site.session = {}; // just a placeholder so the app can continue working.. // TODO: dangerous, user might do stuff that is not remembered..
		site.storage.readfile(site.cfg.paths.json,"local.site_session.json",
			function(data) {
				loggr.log(" > Session read from storage, also writing now");
				site.session = JSON.parse(data);
				if (!site.session) { site.session = {}; }
				site.session_ready = true;
				site.helpers.storeSession();
				site.alarms.setAlarms(); // not a nice place but I need it somewhere...
			},
			function(err) {
				loggr.warn(" > Could not read session from storage");
				site.session = {}; 
				site.session_ready = true;
			}
		);
	} else {
		site.session_ready = true;
	}
}

// TODO: I want this function for other places too, not just session data

site.helpers.session.put = function(key,data,isarray) {
	sessionelem = site.session[key];
	var newsessionelem = site.helpers.session.putRecursive(sessionelem,data,isarray);
	site.session[key] = newsessionelem;
	site.cookies.put("site.session",JSON.stringify(site.session)); // TODO: restore at startup..
}

site.helpers.session.putRecursive = function(sessionelem,data,isarray) {
	var newsessionelem = jQuery.extend(true, {}, sessionelem);
	if (!newsessionelem && !isarray) { newsessionelem = {}; }
	else if (!newsessionelem) { newsessionelem = []; }
	// Walk..
	for (var elemkey in data) {
		// build newsessionelem
		if (typeof data[elemkey] == "array") { 
			newsessionelem[elemkey] = site.helpers.session.putRecursive(sessionelem[elemkey],data[elemkey],true);
		} else if (typeof data[elemkey] == "object") {
			newsessionelem[elemkey] = site.helpers.session.putRecursive(sessionelem[elemkey],data[elemkey]); // recursive magic
		} else {
			if (typeof newsessionelem == "array") { newsessionelem.push(data[elemkey]); } // array, push
			else { newsessionelem[elemkey] = data[elemkey]; } // obj mode
		}
	}
	return newsessionelem;
}

// Get station index by id

site.helpers.session.getStationIndexById = function(station_id, stations) {
	if (!site.data.stations && !stations) { loggr.log("site.helpers.getStationIndexById().Error: !site.data.stations"); return -1; }
	if (!stations) { stations = site.data.stations; }
	for (var index in stations) {
		if (!stations[index]) { continue; }
		if (stations[index].station_id == station_id) { return index; }
	}
	return -1;
}

// ---> Various

// Flag dirty

site.helpers.flagdirtyfile = function(filepathandname) {
	filepathandname = filepathandname.replace("//","/");
	var dirtyfiles = site.session.dirtyfiles;
	if (typeof dirtyfiles == "object" && site.helpers.countObj(dirtyfiles)>0) { // TODO: dirtyfiles is not an object.. is it?
		loggr.log(" > site.helpers.flagdirtyfile.Huh? 'dirtyfiles'==object?");
		if (site.helpers.countObj(dirtyfiles)>0) {
			var newdirtyfiles = [];
			for (var intstr in dirtyfiles) {
				if (newdirtyfiles.indexOf(dirtyfiles[intstr])<0) {
					newdirtyfiles.push(dirtyfiles[intstr]);
				}
			}
			dirtyfiles = newdirtyfiles;
			loggr.log(" >> Solved it: "+ dirtyfiles.length +" result(s) in 'dirtyfiles'");
		} else {
			loggr.log(" >> Just create a new list");
			dirtyfiles = false;
		}
	}
	if (!dirtyfiles) { dirtyfiles = []; }
	if (dirtyfiles.indexOf(filepathandname)<0) { 
		dirtyfiles.push(filepathandname);
	}
	site.helpers.session.put("dirtyfiles",dirtyfiles,true);
}

// Count stuff

site.helpers.countObj = function(obj) {
	if (obj instanceof Array) { return obj.length; }
	if (typeof(obj)!="object") { return -1; }
	var n = 0;
	for (var key in obj) { n++; }
	return n;
}

// Get random stuff

site.helpers.getRandomListEntry = function(list) {
	var randomIndex = Math.ceil(Math.random()*list.length)-1;
	return list[randomIndex];
}

// ---> Formatting

// Capitalize

site.helpers.capitalize = function(str,everyword) {
	if(!str) { 
		loggr.warn("site.helpers.capitalize().err: !str");
		return "<span style='color:#f00;'>Null</span>"; 
	}
	if (everyword) { 
		return site.helpers.capAll(str);
	}
	str = str.substr(0,1).toUpperCase() + str.substr(1);
	return str;
}

site.helpers.capAll = function(str) {
	var strs = str.split(" ");
	for (var i in strs) {
		if (strs[i].length<2 && strs[i].toLowerCase()!="i") { continue; }
		if (typeof strs[i] != "string") { continue; }
		strs[i] = site.helpers.capitalize(strs[i]);
	}
	return strs.join(" ");
}

// Short

site.helpers.short = function(str, len) {
	if (!len) { len = 64; }
	if (!str) { str = ""; }
	if (str.length>len) { str = str.substr(0,len)+"..."; }
	return str;
}

// ---> Unique ID 

site.helpers.getUniqueID = function(prefix,suffix) {
	var res = device.uuid;
	res += "_"+ (new Date().getTime()).toString(16);
	res += "_"+ Math.round((Math.random()*1024*1024)).toString(16);
	loggr.debug("site.helpers.getUniqueID(): "+ res);
	return res;
}

site.helpers.genUniqueStationId = function(station_name) {
	for (var i in site.cfg.illegalchars) {
		var illchar = site.cfg.illegalchars[i];
		station_name = station_name.replace(illchar,"");
	}
	station_name += "_"+ site.helpers.getUniqueID();
	return station_name;
}

// ---> Google Image Search

site.helpers.getGoogleImageSearchBranding = function() {
	loggr.debug("site.helpers.getGoogleImageSearchBranding()");
	return google.search.Search.getBranding();
}

site.helpers.googleImageSearch = function(searchstring,cb,errcb,opts,googleWasNull) {
	
	loggr.debug("site.helpers.googleImageSearch()");
	loggr.log(" > "+searchstring);
	
	// HELP: https://developers.google.com/image-search/v1/devguide
	
	// Check if search is loaded...
	if (googleWasNull) {
		loggr.error(" > GoogleWasNull == true, google won't load :(");
		errcb();
		return;
	}
	if (!google) {
		google.load("search", "1", {"callback" : function(){ site.helpers.googleImageSearch(searchstring,cb,errcb,opts,true); } });
		return;
	} else if (!google.search) {
		google.load("search", "1", {"callback" : function(){ site.helpers.googleImageSearch(searchstring,cb,errcb,opts,true); } });
		return;
	}
	
	// New imagesearch, get unique id
	var searchid = site.helpers.getUniqueID();
	if (!site.chlist.thesearch) { site.chlist.thesearch = {}; }
	if (!site.chlist.thesearchresults) { site.chlist.thesearchresults = []; }
	if (!site.chlist.thesearchbusy) { site.chlist.thesearchbusy = {}; }
	site.chlist.thesearch[searchid] = new google.search.ImageSearch();
	site.chlist.thesearchresults[searchid] = [];
	site.chlist.thesearchbusy[searchid] = true;
	
	
	// Set some properties
	// -> Restrictions
	// ->> opts.restrictions = [ [google.search.ImageSearch.RESTRICT_IMAGESIZE, google.search.ImageSearch.IMAGESIZE_MEDIUM] ]
	if (opts.restrictions) {
		for (var i=0; i<opts.restrictions.length; i++) {
			if (!opts.restrictions[i][0] || !opts.restrictions[i][1]) { continue; }
			site.chlist.thesearch[searchid].setRestriction(
				opts.restrictions[i][0],
				opts.restrictions[i][1]
			);
		}
	}
	
	// more opts
	if (!opts) { opts = {}; }
	if (!opts.maxresults) { opts.maxresults = 64; }
	
	// Callback
	site.chlist.thesearch[searchid].setSearchCompleteCallback(this, 
		function() {
			
			var thesearch = site.chlist.thesearch[searchid];
			var cursor = {};
			var results = []
			
			// Store results (if any)
			if (site.chlist.thesearch[searchid].results && site.chlist.thesearch[searchid].results.length > 0) {
				results = site.chlist.thesearch[searchid].results;
				for (var i in results) {
					site.chlist.thesearchresults[searchid].push(results[i]);
				}
			}
			
			// Check for more results :D
			if (thesearch.cursor) {
				cursor = thesearch.cursor;
				var currPage = cursor.currentPageIndex;
				var pages = cursor.pages;
				loggr.log(" > "+ currPage +", out of "+ pages.length);
				if (currPage < pages.length-1 && site.chlist.thesearchresults[searchid].length < opts.maxresults) {
					// get more...
					loggr.log(" > Getting more results... ("+pages.length+" page(s) total)");
					thesearch.gotoPage(currPage+1);
					return;
				} else {
					// return results..
					loggr.log(" > Results: "+ site.chlist.thesearchresults[searchid].length);
					cb(site.chlist.thesearchresults[searchid]);
					site.chlist.thesearchbusy[searchid] = false;
					site.helpers.googleImageSearchCleanup();
					return;
				}
			}
			
			// Errcb
			if (!site.chlist.thesearchresults[searchid]) { site.chlist.thesearchresults[searchid] = []; }
			if (site.chlist.thesearchresults[searchid].length<1) {
				loggr.log(" > Search failed, no results");
				errcb();
				site.chlist.thesearchbusy[searchid] = false;
				site.helpers.googleImageSearchCleanup();
			}
			
		},
		null
	);
	
	// Execute
	site.chlist.thesearch[searchid].execute(searchstring);
	
}

site.helpers.googleImageSearchCleanup = function() {
	
	// Check if searches are busy..
	var anybusy = false;
	for (var searchid in site.chlist.thesearchbusy) {
		if (site.chlist.thesearchbusy[searchid]) { anybusy = true; break; }
	}
	
	// All done? destroy thesearch[]
	if (!anybusy) {
		loggr.log("site.helpers.googleImageSearchCleanup(): Cleanup...");
		site.chlist.thesearch = {};
		site.chlist.thesearchresults = [];
		site.chlist.thesearchbusy = {};
	}
	
}

// ---> Masonry

site.helpers.masonryinit = function(selector,opts) {
	/*
	loggr.info("site.helpers.masonryinit(): "+selector);
	if (!site.vars.masonries) { site.vars.masonries = []; }
	if (site.vars.masonries.indexOf(selector)<0 && typeof selector =="string") { site.vars.masonries.push(selector); }
	if (!opts) { 
		opts = {
			itemSelector : '.resultitem',
			columnWidth : 1,
			isAnimated : true,
			isResizable : true
		};
	}
	$(function(){
	  $(selector).masonry();
	});
	/**/
}

site.helpers.masonryupdate = function(selector) {
	loggr.debug("site.helpers.masonryupdate(): "+selector);
	//$(selector).masonry('layout');
}

site.helpers.masonryOnResize = function() {
	loggr.debug("site.vars.masonryOnResize()");
	if (!site.vars.masonries) { return; }
	for (var i=0; i<site.vars.masonries.length; i++) {
		var selector = site.vars.masonries[i];
		if (!$(selector).is(":visible") || $(selector).length<1) { continue; }
		try { site.helpers.masonryupdate(selector); } 
		catch(e) {
			loggr.warn(" > Error: "+ e);
		}
	}
}

// ---> Stuff

site.helpers.formatNum = function(num,len) {
	if (!len) { len = 2; }
	num = ""+num;
	while(num.length<len) { num = "0"+num; }
	return num;
}

site.helpers.urlAddCachebust = function(url) {
	if (url.indexOf("?")>=0) { url += "&c="; }
	else { url += "?c="; }
	url += (new Date().getTime());
	return url;
}

// ---> Debugging

site.helpers.arrToString = function(arr,depth,newline) {
	var char = "&nbsp;";
	if (!depth) { depth = 0; }
	if (!newline) { newline = "<br>"; }
	if (newline=="\n") { char = " "; }
	var res = "";
	depth++;
	if (typeof(arr)=="string") {
		return arr;
	} else {
		for (var i in arr) {
			if (typeof(arr[i])=="object" || typeof(arr[i])=="array") {
				res += site.helpers.getIndents(depth,char) + i + newline;
				res += site.helpers.arrToString(arr[i],depth,newline) + newline;
			} else {
				res += site.helpers.getIndents(depth,char) + i +" = "+ arr[i] + newline;
			}
		}
	}
	return res;
}

site.helpers.getIndents = function(depth,char) {
	var res = "";
	if (!char) { char = "&nbsp;"; }
	for (var i=0; i<depth; i++) { res += char+char+char+char; }
	return res;
}