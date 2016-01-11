
// NOTE; WORK IN PROGRESS, Not yet implemented.

// ---------------------------------------------
// BZZ

// ---> Site

if (!site) { var site = {}; }

// ---------------------------------------------
// CACHE

site.cache = {};

site.cache.db = [];

// ---> init

site.cache.init = function() {
	
	loggr.debug("site.cache.init()");
	loggr.log(" > Nothing to init yet..?"); // TODO
	
}

// ---> get

site.cache.get = function(url, cb, optionalCbErr, optionalType, optionalFilename) {
	
	loggr.debug("site.cache.get()");
	
	// Is file cached?
	if (site.cache.isCachedFile(url)) {
		return site.cache.getCachedFile(url);
	}
	
	// --> Create new cached file..
	
	// Type..?
	// Subfolder to save/load file
	if (!optionalType) {
		optionalType = "other";
	}
	
	// Filename..?
	if (!optionalFilename) {
		optionalFilename = site.cache.getFilenameFromUrl(url);
	}
	
	// Prep..
	var filename = optionalFilename;
	var filepath = site.cfg.paths.root + optionalType;
	
	// Create new cached file..
	site.webapi.download = function(
		url,
		filepath,
		filename,
		cb,
		optionalCbErr,
		progressCb
	);
	
	// db obj
	var dbObj = {};
	dbObj.url = url;
	dbObj.type = optionalType;
	dbObj.filename = optionalFilename;
	dbObj.localurl = ""; // TODO
	
	// store db obj // TODO: check if already exists..
	site.cache.db.push(dbObj);
	
}

// ---> helpers

// isFileCached

site.cache.isCachedFile = function(url) {
	
	loggr.log("site.cache.isFileCached()");
	
	// Find it..
	if (site.cache.getCachedFileIndex(url)>=0) {
		return true;
	} else {
		return false;
	}
	
}

// getFileCached

site.cache.getCachedFile = function(url, alreadyChecked) {
	
	loggr.log("site.cache.getFileCached()");
	
	// Check cache..?
	if (!alreadyChecked) {
		if (!site.cache.isFileCached(url)) { return false; }
	}
	
	// Find it
	var index = site.cache.getCachedFileIndex(url);
	
	// Return
	if (index>=0) {
		return site.cache.db[index];
	} else {
		loggr.warn(" > site.cache.getFileCached().w: index <= 0");
		return false;
	}
	
}

// findCachedFile

site.cache.getCachedFileIndex = function(url) {
	
	loggr.log("site.cache.getCachedFileIndex()");
	
	for (var i=0; i<site.cache.db.length; i++) {
		
		var dbObj = site.cache.db[i];
		if (dbObj.url==url) {
			return i;
		}
		
	}
	
	return -1;
	
}

// getFilenameFromUrl

site.cache.getFilenameFromUrl = function(url) {
	
	loggr.log("site.cache.getFilenameFromUrl()");
	
	var filename = url.substr(url.lastIndexOf("/")+1);
	
	if (filename.indexOf("?")>0) {
		filename = filename.substr(0,filename.lastIndexOf("?"));
	}
	
	return filename;
	
}























