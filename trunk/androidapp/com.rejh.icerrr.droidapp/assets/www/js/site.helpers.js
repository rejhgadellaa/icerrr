
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