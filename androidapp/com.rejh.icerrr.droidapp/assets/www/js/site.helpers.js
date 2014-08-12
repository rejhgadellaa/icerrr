
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

// ---> Images

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
		console.log("site.helpers.imageToBase64.Error: Unexpected base64 string for "+imgobj.src);
		console.log(base64);
		try {
			var imgData = ctx.getImageData(0,0,canvas.width,canvas.height)
			pngFile = generatePng(canvas.width, canvas.height, imgData.data);
			base64 = 'data:image/png;base64,' + btoa(pngFile);
		} catch(e) { 
			// I've really tried everyting, didn't I?
			console.log(e);
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

// ---> Various

// Flag dirty

site.helpers.flagdirtyfile = function(filepathandname) {
	var dirtyfiles = site.session.dirtyfiles;
	if (!dirtyfiles) { dirtyfiles = []; }
	dirtyfiles.push(filepathandname);
	site.helpers.session.put("dirtyfiles",dirtyfiles);
	console.log(site.helpers.arrToString(site.session,0,"\n"));
}

// Session stuff

site.helpers.session = {};
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
		if (data[elemkey] instanceof Object || data[elemkey] instanceof Array) {
			newsessionelem[elemkey] = site.helpers.session.putRecursive(sessionelem[elemkey],data[elemkey]); // recursive magic
		} else {
			newsessionelem[elemkey] = data[elemkey];
		}
	}
	return newsessionelem;
}

// Get station index by id

site.helpers.getStationIndexById = function(station_id) {
	if (!site.data.stations) { console.log("site.helpers.getStationIndexById().Error: !site.data.stations"); }
	for (var index in site.data.stations) {
		if (site.data.stations[index].station_id == station_id) { return index; }
	}
	return -1;
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