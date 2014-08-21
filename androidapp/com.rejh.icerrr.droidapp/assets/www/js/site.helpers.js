
// ---------------------------------------------
// BZZ

// ---> Compat

if (!console) { var console = {}; }
if (!console.log) { console.log = function(str) { }; }

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
	
	loggr.log("site.helpers.mergeStations()");
	
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

// Store image
// - create canvas, draw image on canvas, get base64, write to disk

site.helpers.storeImageLocally = function(imgobj,path,name,opts) {
	// TODO: Do we need this?
}

// imageToBase64
// - Returns FALSE if something has gone wrong...

site.helpers.imageToBase64 = function(imgobj,cb,opts) {
	
	// Handle opts
	if (!opts) { opts = {}; }
	if (!opts.maxwidth) { opts.maxwidth = imgobj.width; } // Note: dev is responsible for handling aspect!
	if (!opts.maxheight) { opts.maxheight = imgobj.height; }
	if (!opts.zoomcrop) { opts.zoomcrop = false; } // TODO: implement
	
	// Create canvas
	var canvas = document.createElement("canvas");
	ctx = canvas.getContext("2d");
	
	// Set width/height to match imageObj
	canvas.width = imgobj.width;
	canvas.height = imgobj.height;
	
	// Draw image
	ctx.drawImage(imgobj, 0, 0, imgobj.width, imgobj.height, 0, 0, opts.maxwidth, opts.maxheight);
	
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
	cb(base64);
	
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
	var bytes = str.length*8;
	return bytes;
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

// TODO: I want this function for other places too, not just session data

site.helpers.session.put = function(key,data) {
	sessionelem = site.session[key];
	var newsessionelem = site.helpers.session.putRecursive(sessionelem,data);
	site.session[key] = newsessionelem;
	site.cookies.put("site.session",JSON.stringify(site.session)); // TODO: restore at startup..
}

site.helpers.session.putRecursive = function(sessionelem,data) {
	var newsessionelem = jQuery.extend(true, {}, sessionelem);
	if (!newsessionelem) { newsessionelem = {}; }
	// Walk..
	for (var elemkey in data) {
		// build newsessionelem
		if (typeof(data[elemkey])=="object" || typeof(data[elemkey])=="array") {
			newsessionelem[elemkey] = site.helpers.session.putRecursive(sessionelem[elemkey],data[elemkey]); // recursive magic
		} else {
			newsessionelem[elemkey] = data[elemkey];
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
	if (typeof(dirtyfiles)=="object" && site.helpers.countObj(dirtyfiles)>0) { // TODO: dirtyfiles is not an object.. is it?
		loggr.log(" > site.helpers.flagdirtyfile.Huh? 'dirtyfiles'==object?");
		if (site.helpers.countObj(dirtyfiles)>0) {
			var newdirtyfiles = [];
			for (var intstr in dirtyfiles) {
				newdirtyfiles.push(dirtyfiles[i]);
			}
			dirtyfiles = newdirtyfiles;
			loggr.log(" >> Solved it: "+ dirtyfiles.length +" result(s) in 'dirtyfiles'");
		} else {
			loggr.log(" >> Just create a new list");
			dirtyfiles = false;
		}
	}
	if (!dirtyfiles) { dirtyfiles = []; }
	dirtyfiles.push(filepathandname);
	site.helpers.session.put("dirtyfiles",dirtyfiles);
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

site.helpers.capitalize = function(str) {
	if(!str) { 
		loggr.error("site.helpers.capitalize().err: !str");
		return "<span style='color:#f00;'>Null</span>"; 
	}
	str = str.substr(0,1).toUpperCase() + str.substr(1);
	return str;
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
	loggr.log("site.helpers.getUniqueID(): "+ res);
	return res;
}

site.helpers.genUniqueStationId = function(station_name) {
	for (var i in site.cfg.illegalchars) {
		var illchar = site.cfg.illegalchars[i];
		station_name = station_name.replace(illchar,"");
	}
	return station_name;
}

// ---> Google Image Search

site.helpers.googleImageSearch = function(searchstring,cb,errcb,opts) {
	
	loggr.log("site.helpers.googleImageSearch()");
	loggr.log(" > "+searchstring);
	
	// HELP: https://developers.google.com/image-search/v1/devguide
	
	// New imagesearch, get unique id
	var searchid = site.helpers.getUniqueID();
	if (!site.chlist.thesearch) { site.chlist.thesearch = {}; }
	if (!site.chlist.thesearchbusy) { site.chlist.thesearchbusy = {}; }
	site.chlist.thesearch[searchid] = new google.search.ImageSearch();
	site.chlist.thesearchbusy[searchid] = true;
	
	// Set some properties
	// -> Restrictions
	if (opts.restrictions) {
		for (var i=0; i<opts.restrictions.length; i++) {
			if (!opts.restrictions[i][0] || !opts.restrictions[i][1]) { continue; }
			site.chlist.thesearch[searchid].setRestriction(
				opts.restrictions[i][0],
				opts.restrictions[i][1]
			);
		}
	}
	
	// Callback
	site.chlist.thesearch[searchid].setSearchCompleteCallback(this, 
		function() {
			// Results? || TODO: check if we can extend (deep copy) the results because we want to clean them up..
			if (site.chlist.thesearch[searchid].results && site.chlist.thesearch[searchid].results.length > 0) {
				var results = site.chlist.thesearch[searchid].results;
				loggr.log(" > "+ results.length +" result(s)");
				cb(results);
				site.chlist.thesearchbusy[searchid] = false;
				site.helpers.googleImageSearchCleanup();
			} 
			// Nope
			else {
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
		site.chlist.thesearchbusy = {};
	}
	
}

// ---> Masonry

site.helpers.masonryinit = function(selector,opts) {
	loggr.log("site.helpers.masonryinit()");
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
}

site.helpers.masonryupdate = function(selector) {
	loggr.log("site.helpers.masonryupdate()");
	$(selector).masonry();
}

// ---> Stuff

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